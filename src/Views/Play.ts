import { Component, h } from '@fun-land/fun-web'
import { Level, LevelData } from '../level'
import { getLevelById } from '../store'
import { getPackById } from '../packStore'
import { createGameLoop, createAssets, Assets } from '../game/loop'
import { createUi } from '../game/uiState'
import * as styles from './canvasPage.css'

const fallback: LevelData = {
  title: 'Plus',
  x: 5,
  y: 5,
  game: '0100001110011100010000100',
  palette: ['#0000ff'],
  par: 3,
}

/** A single puzzle with no pack context: `~` just goes home. */
function startSingle(signal: AbortSignal, canvas: HTMLCanvasElement, assets: Assets, level: Level): void {
  document.title = level.title
  const ui = createUi(level.palette)
  createGameLoop({
    canvas,
    level,
    mode: 'play',
    scoreMode: 'zen',
    getActiveColor: () => ui.get().activeColorIndex,
    setActiveColor: (i) => ui.prop('activeColorIndex').set(i),
    getMute: () => ui.get().mute,
    getPalette: () => ui.get().palette,
    assets,
    onBack: () => location.assign('/'),
    signal,
  }).start()
}

/**
 * In-page pack session: fetch the pack + all level data once, then swap puzzles
 * client-side with no document reloads. Each puzzle runs a fresh loop under a
 * child AbortController (so its listeners are torn down on swap); `Level`
 * instances are cached so in-progress paint survives popping in and out. The URL
 * is kept honest via push/replaceState and the back/forward button is wired to
 * `popstate`.
 */
async function startPackSession(
  signal: AbortSignal,
  canvas: HTMLCanvasElement,
  assets: Assets,
  packId: string,
  initialId: string | null,
): Promise<void> {
  const pack = await getPackById(packId).catch(() => null)
  if (!pack) {
    const data = (initialId ? await getLevelById(initialId) : null) ?? fallback
    startSingle(signal, canvas, assets, new Level(data))
    return
  }

  const datas = await Promise.all(pack.levelIds.map((lid) => getLevelById(lid)))
  const n = pack.levelIds.length
  const solved: boolean[] = new Array(n).fill(false)
  const cache = new Map<number, Level>()
  const getLevel = (i: number): Level | null => {
    if (!datas[i]) return null
    let lv = cache.get(i)
    if (!lv) {
      lv = new Level(datas[i]!)
      cache.set(i, lv)
    }
    return lv
  }
  const items = (): { title: string; solved: boolean }[] =>
    datas.map((d, i) => ({ title: d?.title ?? '(deleted)', solved: solved[i] }))

  let current = Math.max(0, pack.levelIds.indexOf(initialId ?? ''))
  let child: AbortController | null = null
  signal.addEventListener('abort', () => child?.abort())

  const mount = (index: number, pushUrl: boolean): void => {
    const level = getLevel(index)
    if (!level) return
    child?.abort()
    child = new AbortController()
    current = index
    document.title = level.title

    const url = `/play.html?id=${pack.levelIds[index]}&pack=${pack.id}`
    if (pushUrl) history.pushState({ index }, '', url)
    else history.replaceState({ index }, '', url)

    const ui = createUi(level.palette)
    createGameLoop({
      canvas,
      level,
      mode: 'play',
      scoreMode: 'zen',
      getActiveColor: () => ui.get().activeColorIndex,
      setActiveColor: (i) => ui.prop('activeColorIndex').set(i),
      getMute: () => ui.get().mute,
      getPalette: () => ui.get().palette,
      assets,
      onPrev: index > 0 ? () => mount(index - 1, true) : undefined,
      onNext: index < n - 1 ? () => mount(index + 1, true) : undefined,
      onExit: () => location.assign(`/pack.html?id=${pack.id}`),
      onSolved: () => {
        solved[index] = true
      },
      packMenu: {
        title: pack.title,
        current: index,
        getItems: items,
        onPick: (i) => {
          if (i !== current) mount(i, true)
        },
      },
      signal: child.signal,
    }).start()
  }

  window.addEventListener(
    'popstate',
    (e) => {
      const fromState = (e.state as { index?: number } | null)?.index
      const idx =
        typeof fromState === 'number'
          ? fromState
          : Math.max(0, pack.levelIds.indexOf(new URLSearchParams(location.search).get('id') ?? ''))
      mount(idx, false)
    },
    { signal },
  )

  mount(current, false)
}

export const Play: Component = (signal) => {
  const canvas = h('canvas', { id: 'canvas', className: styles.canvas }) as HTMLCanvasElement

  const params = new URLSearchParams(location.search)
  const id = params.get('id')
  const packId = params.get('pack')
  const assets = createAssets()

  ;(async () => {
    if (packId) {
      await startPackSession(signal, canvas, assets, packId, id)
    } else {
      const data = (id ? await getLevelById(id) : null) ?? fallback
      startSingle(signal, canvas, assets, new Level(data))
    }
  })().catch(console.error)

  return h('div', {}, [canvas])
}
