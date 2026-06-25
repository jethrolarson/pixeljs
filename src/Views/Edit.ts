import { FunState } from '@fun-land/fun-state'
import { Component, h, hx } from '@fun-land/fun-web'
import { Level, LevelData } from '../level'
import { getLevelById, saveLevel } from '../store'
import { getUser } from '../services/getUser'
import { signIn, currentUser } from '../auth'
import { createGameLoop, createAssets } from '../game/loop'
import { createUi, Ui } from '../game/uiState'
import { Palette } from '../components/Palette'
import { termBtn } from './canvasPage.css'
import * as styles from './canvasPage.css'
import * as edit from './Edit.css'

const defaultLevel: LevelData = {
  title: 'New Level',
  x: 10,
  y: 10,
  game: '0'.repeat(100),
  palette: ['#0000ff'],
  par: 3,
}

const levelToData = (level: Level, ui: FunState<Ui>): LevelData => ({
  title: level.title,
  x: level.x,
  y: level.y,
  game: level.getGame(),
  palette: [...ui.get().palette],
  par: level.par,
  levelSetName: level.levelSetName,
})

export const Edit: Component = (signal) => {
  const canvas = h('canvas', { id: 'canvas', className: styles.canvas }) as HTMLCanvasElement
  const menuSlot = h('div', { className: styles.menu }, [])
  const paletteSlot = h('div', {}, [])

  const params = new URLSearchParams(location.search)
  let currentId: string | null = params.get('id')
  const returnPackId = params.get('pack')
  const user = getUser(signal)

  ;(async () => {
    const data = (currentId ? await getLevelById(currentId) : null) ?? defaultLevel
    const level = new Level(data)
    document.title = level.title

    const ui = createUi(level.palette)
    const assets = createAssets()

    // Solved-art authoring: an optional reward grid on its own palette + 1×/2×
    // resolution, edited on the same canvas with the puzzle shown faintly behind.
    let artEnabled = !!data.art
    let artScale = data.art?.scale ?? 1
    let artUi: FunState<Ui> | null = null
    let artLevel: Level | null = null
    let target: 'puzzle' | 'art' = 'puzzle'

    const initArt = (): void => {
      artUi = createUi(data.art?.palette ?? [...ui.get().palette])
      artLevel = new Level({ title: level.title, x: level.x * artScale, y: level.y * artScale, game: data.art?.data, palette: artUi.get().palette })
    }
    if (artEnabled) initArt()

    // Each editing target (puzzle vs. art) runs its own loop under a child signal,
    // so swapping tears the previous one's listeners down.
    let loopCtl: AbortController | null = null
    signal.addEventListener('abort', () => loopCtl?.abort())
    const mountLoop = (): void => {
      loopCtl?.abort()
      loopCtl = new AbortController()
      const s = loopCtl.signal
      const onArt = target === 'art' && artEnabled && !!artLevel && !!artUi
      const activeUi = onArt ? artUi! : ui
      const activeLevel = onArt ? artLevel! : level
      createGameLoop({
        canvas,
        level: activeLevel,
        mode: 'edit',
        getActiveColor: () => activeUi.get().activeColorIndex,
        getMute: () => ui.get().mute,
        getPalette: () => activeUi.get().palette,
        assets,
        underlay: onArt ? { level, scale: artScale } : undefined,
        signal: s,
      }).start()
      paletteSlot.replaceChildren(Palette(s, { ui: activeUi, mode: 'edit' }))
    }
    mountLoop()

    const setCols = (n: number): void => {
      const d = n - level.x
      if (d > 0) { level.addCols(d); artLevel?.addCols(d * artScale) }
      else if (d < 0) { level.subtractCols(-d); artLevel?.subtractCols(-d * artScale) }
    }
    const setRows = (n: number): void => {
      const d = n - level.y
      if (d > 0) { level.addRows(d); artLevel?.addRows(d * artScale) }
      else if (d < 0) { level.subtractRows(-d); artLevel?.subtractRows(-d * artScale) }
    }

    // Persist the current edits and return the level id (null if not signed in).
    const persist = async (): Promise<string | null> => {
      const u = currentUser()
      if (!u) { signIn(); return null }
      const art = artEnabled && artLevel && artUi
        ? { scale: artScale, palette: [...artUi.get().palette], data: artLevel.getGame() }
        : null
      const saved = await saveLevel({ ...levelToData(level, ui), id: currentId ?? undefined, art }, u.uid)
      currentId = saved.id!
      document.title = saved.title ?? 'Edit Level'
      history.replaceState(null, '', `?id=${currentId}`)
      return currentId
    }

    const onSave = async (): Promise<void> => {
      const id = await persist()
      if (id && returnPackId) location.href = `/pack-edit.html?id=${returnPackId}&add=${id}`
    }

    // Test plays the level you're editing — save first so nothing is lost and
    // play loads the current state by id.
    const onTest = async (): Promise<void> => {
      const id = await persist()
      if (id) location.href = `/play.html?id=${id}`
    }

    const titleInput = hx('input', {
      signal,
      props: { type: 'text', value: level.title, placeholder: 'title', className: edit.titleInput },
      on: { input: (e) => { level.title = e.currentTarget.value; document.title = e.currentTarget.value } },
    })
    const xInput = hx('input', {
      signal,
      props: { type: 'number', min: '3', max: '32', value: String(level.x), className: edit.num },
      on: { change: (e) => { setCols(parseInt(e.currentTarget.value)); e.currentTarget.value = String(level.x) } },
    })
    const yInput = hx('input', {
      signal,
      props: { type: 'number', min: '3', max: '32', value: String(level.y), className: edit.num },
      on: { change: (e) => { setRows(parseInt(e.currentTarget.value)); e.currentTarget.value = String(level.y) } },
    })
    const parInput = hx('input', {
      signal,
      props: { type: 'number', min: '1', max: '10', value: String(level.par), className: edit.num },
      on: { change: (e) => { level.par = parseInt(e.currentTarget.value) } },
    })
    const muteInput = hx('input', {
      signal,
      props: { type: 'checkbox' },
      on: { change: (e) => ui.mod((u) => ({ ...u, mute: e.currentTarget.checked })) },
    })

    // Solved-art controls: enable + switch target + scale, all wired to mountLoop.
    const targetBtn = hx('button', { signal, props: { type: 'button', className: termBtn }, on: { click: () => { target = target === 'puzzle' ? 'art' : 'puzzle'; mountLoop(); updateArtControls() } } }, ['Edit: Puzzle'])
    const scaleBtn = hx('button', { signal, props: { type: 'button', className: termBtn }, on: { click: () => setScale((artScale % 4) + 1) } }, ['Art 1×'])
    const artControls = h('div', { className: styles.field }, [targetBtn, scaleBtn])
    const updateArtControls = (): void => {
      artControls.style.display = artEnabled ? '' : 'none'
      targetBtn.textContent = `Edit: ${target === 'art' ? 'Art' : 'Puzzle'}`
      scaleBtn.textContent = `Art ${artScale}×`
    }
    const setArtEnabled = (on: boolean): void => {
      artEnabled = on
      if (on && !artLevel) initArt()
      if (!on) target = 'puzzle'
      mountLoop()
      updateArtControls()
    }
    const setScale = (s: number): void => {
      const from = artScale
      artScale = s
      if (artEnabled && artUi) {
        const nx = level.x * s
        const ny = level.y * s
        // Resample existing art into the new resolution: cells map by their puzzle
        // fraction (oldIdx = floor(newIdx * from / s)). Scaling up by an integer
        // factor (1→2, 1→3) is lossless block-duplication; scaling down or by a
        // non-integer ratio (3→2, 2→1) samples and loses detail.
        let game = '0'.repeat(nx * ny)
        if (artLevel) {
          const old = artLevel
          const cells: string[] = new Array(nx * ny)
          for (let cx = 0; cx < nx; cx++) {
            for (let cy = 0; cy < ny; cy++) {
              const ox = Math.min(old.x - 1, Math.floor((cx * from) / s))
              const oy = Math.min(old.y - 1, Math.floor((cy * from) / s))
              cells[cx * ny + cy] = old.grid.getAt(ox, oy)
            }
          }
          game = cells.join('')
        }
        artLevel = new Level({ title: level.title, x: nx, y: ny, game, palette: artUi.get().palette })
      }
      if (target === 'art') mountLoop()
      updateArtControls()
    }
    const artCheck = hx('input', { signal, props: { type: 'checkbox' }, on: { change: (e) => setArtEnabled(e.currentTarget.checked) } })
    artCheck.checked = artEnabled
    updateArtControls()

    const saveBtn = hx('button', { signal, props: { type: 'button', className: termBtn }, on: { click: onSave } }, ['Save'])
    const testBtn = hx('a', {
      signal,
      props: { href: '#', className: edit.testLink },
      on: { click: (e) => { e.preventDefault(); void onTest() } },
    }, ['Test'])
    const signinMsg = h('p', { className: edit.signinMsg }, ['Sign in to save'])

    const backHref = returnPackId ? `/pack-edit.html?id=${returnPackId}` : '/workshop.html'
    const backLabel = returnPackId ? '← Back to pack' : '← Workshop'

    menuSlot.replaceChildren(
      h('a', { href: backHref, className: styles.backLink }, [backLabel]),
      h('div', { className: styles.field }, [titleInput]),
      h('div', { className: styles.field }, [
        h('label', { className: edit.label }, [xInput, ' X ']),
        yInput,
      ]),
      h('div', { className: styles.field }, [h('label', { className: edit.label }, ['Par ']), parInput]),
      h('label', { className: edit.muteRow }, [muteInput, ' Mute']),
      h('label', { className: edit.muteRow }, [artCheck, ' Solved art']),
      artControls,
      h('div', { className: styles.field }, [saveBtn, testBtn]),
      signinMsg,
    )

    user.watch(signal, (u) => {
      saveBtn.style.display = u ? '' : 'none'
      testBtn.style.display = u ? '' : 'none'
      signinMsg.style.display = u ? 'none' : ''
    })
  })().catch(console.error)

  return h('div', {}, [menuSlot, paletteSlot, canvas])
}
