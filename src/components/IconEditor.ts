import { FunState } from '@fun-land/fun-state'
import { Component, h, hx } from '@fun-land/fun-web'
import { Level } from '../level'
import { Ui } from '../game/uiState'
import { Palette } from './Palette'
import * as styles from './IconEditor.css'

export interface IconEditorProps {
  level: Level
  ui: FunState<Ui>
  onChange?: () => void
}

/** Not the terminal game-loop renderer — that's built for a full puzzle page
 * (chrome, hint gutters, hotkey footer), wrong shape for a small widget with
 * no puzzle semantics. Canvas fills whatever box it's given (see PackEdit's
 * full-screen modal) rather than a fixed pixel size, since drawing and page
 * scroll compete for the same gesture on a small inline canvas on mobile. */
export const IconEditor: Component<IconEditorProps> = (signal, { level, ui, onChange }) => {
  const canvas = hx('canvas', {
    signal,
    props: { width: level.x, height: level.y, className: styles.canvas },
  })
  const canvasWrap = h('div', { className: styles.canvasWrap }, [canvas])
  const ctx = canvas.getContext('2d')!

  // Sizes the canvas to the largest box matching level's aspect ratio that
  // fits canvasWrap. Done in JS rather than CSS aspect-ratio: that measured
  // the wrap as non-square on first paint on mobile (viewport/flex layout not
  // settled yet), stretching the drawing until a reflow happened to fix it.
  const resize = (): void => {
    const { clientWidth: w, clientHeight: h } = canvasWrap
    const side = Math.floor(Math.min(w, (h * level.x) / level.y))
    if (side > 0) {
      canvas.style.width = `${side}px`
      canvas.style.height = `${(side * level.y) / level.x}px`
    }
  }
  const observer = new ResizeObserver(resize)
  observer.observe(canvasWrap)
  signal.addEventListener('abort', () => observer.disconnect())

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
    // Right-click erases (desktop, no touch equivalent); activeColorIndex 0
    // is the touch-friendly equivalent — Palette's erase swatch sets it, same
    // as picking a color swatch sets an actual index, so both erase paths
    // agree on one flag instead of needing separate "erasing" state.
    const erase = (e.buttons & 2) !== 0 || ui.get().activeColorIndex === 0
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

  return h('div', { className: styles.wrap }, [canvasWrap, palette])
}
