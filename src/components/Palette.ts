import { FunState, mapRead } from '@fun-land/fun-state'
import { Component, h, hx, enhance, attr, on, bindClass, bindView } from '@fun-land/fun-web'
import { Ui } from '../game/uiState'
import { GameMode } from '../game/types'
import * as styles from './Palette.css'

export interface PaletteProps {
  ui: FunState<Ui>
  mode: GameMode
  /** Edit mode only: drop palette color at 0-based index, remapping the grid. */
  onRemoveColor?: (index: number) => void
}

export const Palette: Component<PaletteProps> = (signal, { ui, mode, onRemoveColor }) => {
  const isActive = (colorIndex: number) => mapRead(ui, (u) => u.activeColorIndex === colorIndex)

  const playSwatch: Component<{ i: number }> = (regionSignal, { i }) => {
    const colorIndex = i + 1
    const el = hx(
      'div',
      { signal: regionSignal, props: { className: styles.swatch }, on: { click: () => ui.prop('activeColorIndex').set(colorIndex) } },
      [],
    )
    return enhance(el, attr('style', `background-color:${ui.get().palette[i]}`), bindClass(styles.on, isActive(colorIndex), regionSignal))
  }

  const editSwatch: Component<{ i: number; canRemove: boolean }> = (regionSignal, { i, canRemove }) => {
    const colorIndex = i + 1
    const input = hx('input', {
      signal: regionSignal,
      props: { type: 'color', name: `color${colorIndex}`, value: ui.get().palette[i], className: styles.hiddenColorInput },
      on: {
        input: (e) => {
          const v = e.currentTarget.value
          ui.mod((u) => ({ ...u, palette: u.palette.map((c, j) => (j === i ? v : c)) }))
          label.style.backgroundColor = v
        },
      },
    })
    const removeBtn = canRemove && onRemoveColor
      ? hx(
        'button',
        {
          signal: regionSignal,
          props: { type: 'button', className: styles.removeButton },
          on: {
            // Stop the label's click (which would set active color) and the
            // native picker from opening when the ×'s deleting the swatch instead.
            click: (e) => {
              e.preventDefault()
              e.stopPropagation()
              onRemoveColor(i)
              ui.mod((u) => {
                const palette = u.palette.filter((_, j) => j !== i)
                return { ...u, palette, activeColorIndex: Math.min(u.activeColorIndex, palette.length) }
              })
            },
          },
        },
        ['×'],
      )
      : null
    // <label> wrapping the input opens the native picker on click; the click
    // handler also makes this the active paint color.
    const label = h('label', { className: styles.swatch }, removeBtn ? [input, removeBtn] : [input])
    return enhance(
      label,
      attr('style', `background-color:${ui.get().palette[i]}`),
      bindClass(styles.on, isActive(colorIndex), regionSignal),
      on('click', () => ui.prop('activeColorIndex').set(colorIndex), regionSignal),
    )
  }

  // Edit mode only: activeColorIndex 0 means "erase" (level.grid's own empty
  // value), so this is just another swatch to select — no separate erase
  // state, and it shares the same selected-indicator style as a color swatch.
  const eraseSwatch: Component<Record<string, never>> = (regionSignal) =>
    enhance(
      hx(
        'button',
        { signal: regionSignal, props: { type: 'button', className: styles.swatch }, on: { click: () => ui.prop('activeColorIndex').set(0) } },
        ['×'],
      ),
      bindClass(styles.on, isActive(0), regionSignal),
    )

  // Re-render the swatch row only when the palette length changes (add color),
  // not on every color edit — otherwise an open native picker would be torn down.
  return bindView(signal, mapRead(ui, (u) => u.palette.length), (regionSignal, len) => {
    const swatches = Array.from({ length: len }, (_, i) =>
      mode === 'play' ? playSwatch(regionSignal, { i }) : editSwatch(regionSignal, { i, canRemove: len > 1 }),
    )
    const addBtn = mode === 'edit'
      ? hx(
        'button',
        { signal: regionSignal, props: { type: 'button', className: styles.addButton }, on: { click: () => ui.mod((u) => ({ ...u, palette: [...u.palette, '#888888'] })) } },
        ['+'],
      )
      : null
    const leading = mode === 'edit' ? [eraseSwatch(regionSignal, {})] : []
    return h('div', { className: styles.layers }, addBtn ? [...leading, ...swatches, addBtn] : [...leading, ...swatches])
  })
}
