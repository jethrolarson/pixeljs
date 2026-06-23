import { Component, h } from '@fun-land/fun-web'
import { Level, LevelData } from '../level'
import { getLevelById } from '../store'
import { getPackById } from '../packStore'
import { createGameLoop, createAssets } from '../game/loop'
import { createUi } from '../game/uiState'
import { Palette } from '../components/Palette'
import { btn } from '../theme.css'
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
  const backLink = h('a', { href: '/', className: styles.backLink }, ['← Home'])
  const nextSlot = h('div', {}, [])

  const params = new URLSearchParams(location.search)
  const id = params.get('id')
  const packId = params.get('pack')
  ;(async () => {
    const data = (id ? await getLevelById(id) : null) ?? fallback
    const level = new Level(data)
    document.title = level.title

    // Pack context: breadcrumb back to the pack + a Next-level link.
    if (packId) {
      const pack = await getPackById(packId).catch(() => null)
      if (pack) {
        backLink.textContent = `← ${pack.title}`
        backLink.setAttribute('href', `/pack.html?id=${pack.id}`)
        const idx = id ? pack.levelIds.indexOf(id) : -1
        if (idx >= 0 && idx < pack.levelIds.length - 1) {
          const nextId = pack.levelIds[idx + 1]
          nextSlot.replaceChildren(
            h('a', { href: `/play.html?id=${nextId}&pack=${pack.id}`, className: btn }, ['Next →']),
          )
        }
      }
    }

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
      backLink,
      h('div', {}, [faults, ' faults']),
      time,
      nextSlot,
    ]),
    paletteSlot,
    canvas,
  ])
}
