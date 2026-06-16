import { Component, h } from '@fun-land/fun-web'
import { Level, LevelData } from '../level'
import { getLevelById } from '../store'
import { createGameLoop, createAssets } from '../game/loop'
import { createUi } from '../game/uiState'
import { Palette } from '../components/Palette'
import * as styles from './canvasPage.css'

const fallback: LevelData = {
  title: 'Plus',
  x: 5,
  y: 5,
  game: '0100001110011100010000100',
  palette: ['#0000ff'],
  bgcolor: '#dddddd',
  par: 3,
}

export const Play: Component = (signal) => {
  const canvas = h('canvas', { id: 'canvas', className: styles.canvas }) as HTMLCanvasElement
  const faults = h('span', {}, [])
  const time = h('div', {}, [])
  const paletteSlot = h('div', {}, [])

  const id = new URLSearchParams(location.search).get('id')
  ;(async () => {
    const data = (id ? await getLevelById(id) : null) ?? fallback
    const level = new Level(data)
    document.title = level.title

    const ui = createUi(level.palette)
    paletteSlot.replaceChildren(Palette(signal, { ui, mode: 'play' }))

    const loop = createGameLoop({
      canvas,
      level,
      mode: 'play',
      getActiveColor: () => ui.get().activeColorIndex,
      getMute: () => ui.get().mute,
      getPalette: () => ui.get().palette,
      assets: createAssets(),
      onHud: (hud) => {
        faults.textContent = `${hud.faults}/${hud.par}`
        time.textContent = hud.time
      },
      signal,
    })
    loop.start()
  })().catch(console.error)

  return h('div', {}, [
    h('div', { className: styles.menu }, [
      h('a', { href: '/', className: styles.backLink }, ['← Levels']),
      h('div', {}, [faults, ' faults']),
      time,
    ]),
    paletteSlot,
    canvas,
  ])
}
