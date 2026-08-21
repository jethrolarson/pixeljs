import { FunState } from '@fun-land/fun-state'
import { Component, h, hx } from '@fun-land/fun-web'
import { Level } from '../level'
import { Ui } from '../game/uiState'
import { Palette } from './Palette'
import * as styles from './IconEditor.css'

export interface IconEditorProps {
  level: Level
  ui: FunState<Ui>
  cellPx?: number
  onChange?: () => void
}

/** Not the terminal game-loop renderer — that's built for a full puzzle page
 * (chrome, hint gutters, hotkey footer), wrong shape for a small inline
 * widget with no puzzle semantics. */
export const IconEditor: Component<IconEditorProps> = (signal, { level, ui, cellPx = 16, onChange }) => {
  const canvas = hx('canvas', {
    signal,
    props: { width: level.x, height: level.y, className: styles.canvas },
  })
  canvas.style.width = `${level.x * cellPx}px`
  canvas.style.height = `${level.y * cellPx}px`
  const ctx = canvas.getContext('2d')!

  const redraw = (): void => {
    ctx.clearRect(0, 0, level.x, level.y)
    const palette = ui.get().palette
    for (let x = 0; x < level.x; x++) {
      for (let y = 0; y < level.y; y++) {
        const v = parseInt(level.grid.getAt(x, y), 10)
        if (v > 0 && palette[v - 1]) {
          ctx.fillStyle = palette[v - 1]
          ctx.fillRect(x, y, 1, 1)
        }
      }
    }
  }
  redraw()
  ui.watch(signal, redraw)

  const cellAt = (e: PointerEvent): [number, number] => {
    const rect = canvas.getBoundingClientRect()
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * level.x)
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * level.y)
    return [Math.min(level.x - 1, Math.max(0, x)), Math.min(level.y - 1, Math.max(0, y))]
  }

  let painting = false
  const paintAt = (e: PointerEvent): void => {
    const [x, y] = cellAt(e)
    const erase = (e.buttons & 2) !== 0
    level.grid.setAt(x, y, erase ? '0' : String(ui.get().activeColorIndex))
    redraw()
  }

  canvas.addEventListener('contextmenu', (e) => e.preventDefault(), { signal }) // right-click erases
  canvas.addEventListener('pointerdown', (e) => { painting = true; paintAt(e) }, { signal })
  canvas.addEventListener('pointermove', (e) => { if (painting) paintAt(e) }, { signal })
  window.addEventListener('pointerup', () => { if (painting) { painting = false; onChange?.() } }, { signal })

  const palette = Palette(signal, {
    ui,
    mode: 'edit',
    onRemoveColor: (i) => { level.removeColor(i); redraw(); onChange?.() },
  })

  return h('div', { className: styles.wrap }, [canvas, palette])
}
