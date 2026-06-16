import { FunState, mapRead } from '@fun-land/fun-state'
import { Component, h, hx, enhance, attr, on, bindClass, bindView } from '@fun-land/fun-web'
import { Ui } from '../game/uiState'
import { GameMode } from '../game/layout'
import * as styles from './Palette.css'

export interface PaletteProps {
  ui: FunState<Ui>
  mode: GameMode
}

export const Palette: Component<PaletteProps> = (signal, { ui, mode }) => {
  const isActive = (colorIndex: number) => mapRead(ui, (u) => u.activeColorIndex === colorIndex)

  const playSwatch = (regionSignal: AbortSignal, i: number): Element => {
    const colorIndex = i + 1
    const el = hx(
      'div',
      { signal: regionSignal, props: { className: styles.swatch }, on: { click: () => ui.prop('activeColorIndex').set(colorIndex) } },
      [],
    )
    return enhance(el, attr('style', `background-color:${ui.get().palette[i]}`), bindClass(styles.on, isActive(colorIndex), regionSignal))
  }

  const editSwatch = (regionSignal: AbortSignal, i: number): Element => {
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
    // <label> wrapping the input opens the native picker on click; the click
    // handler also makes this the active paint color.
    const label = h('label', { className: styles.swatch }, [input]) as HTMLLabelElement
    return enhance(
      label,
      attr('style', `background-color:${ui.get().palette[i]}`),
      bindClass(styles.on, isActive(colorIndex), regionSignal),
      on('click', () => ui.prop('activeColorIndex').set(colorIndex), regionSignal),
    )
  }

  // Re-render the swatch row only when the palette length changes (add color),
  // not on every color edit — otherwise an open native picker would be torn down.
  return bindView(signal, mapRead(ui, (u) => u.palette.length), (regionSignal, len) => {
    const swatches: Element[] = []
    for (let i = 0; i < len; i++) {
      swatches.push(mode === 'play' ? playSwatch(regionSignal, i) : editSwatch(regionSignal, i))
    }
    if (mode === 'edit') {
      swatches.push(
        hx(
          'button',
          { signal: regionSignal, props: { type: 'button', className: styles.addButton }, on: { click: () => ui.mod((u) => ({ ...u, palette: [...u.palette, '#888888'] })) } },
          ['+'],
        ),
      )
    }
    return h('div', { className: styles.layers }, swatches)
  })
}
