import { FunState } from '@fun-land/fun-state'
import { Component, h, hx } from '@fun-land/fun-web'
import { Level, LevelData } from '../level'
import { getLevelById, saveLevel } from '../store'
import { getUser } from '../services/getUser'
import { signIn, currentUser } from '../auth'
import { createGameLoop, createAssets } from '../game/loop'
import { createUi, Ui } from '../game/uiState'
import { Palette } from '../components/Palette'
import { btn } from '../theme.css'
import * as styles from './canvasPage.css'
import * as edit from './Edit.css'

const defaultLevel: LevelData = {
  title: 'New Level',
  x: 10,
  y: 10,
  game: '0'.repeat(100),
  palette: ['#0000ff'],
  bgcolor: '#dddddd',
  par: 3,
}

const levelToData = (level: Level, ui: FunState<Ui>): LevelData => ({
  title: level.title,
  x: level.x,
  y: level.y,
  game: level.getGame(),
  palette: [...ui.get().palette],
  bgcolor: level.bgcolor,
  ...(level.gridcolor ? { gridcolor: level.gridcolor } : {}),
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
    paletteSlot.replaceChildren(Palette(signal, { ui, mode: 'edit' }))

    const loop = createGameLoop({
      canvas,
      level,
      mode: 'edit',
      getActiveColor: () => ui.get().activeColorIndex,
      getMute: () => ui.get().mute,
      getPalette: () => ui.get().palette,
      assets: createAssets(),
      signal,
    })
    loop.start()

    const setCols = (n: number): void => {
      const d = n - level.x
      if (d > 0) level.addCols(d)
      else if (d < 0) level.subtractCols(-d)
    }
    const setRows = (n: number): void => {
      const d = n - level.y
      if (d > 0) level.addRows(d)
      else if (d < 0) level.subtractRows(-d)
    }

    const onSave = async (): Promise<void> => {
      const u = currentUser()
      if (!u) { signIn(); return }
      const saved = await saveLevel({ ...levelToData(level, ui), id: currentId ?? undefined }, u.uid)
      currentId = saved.id!
      document.title = saved.title ?? 'Edit Level'
      if (returnPackId) {
        location.href = `/pack-edit.html?id=${returnPackId}&add=${currentId}`
        return
      }
      history.replaceState(null, '', `?id=${currentId}`)
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
    const bgInput = hx('input', {
      signal,
      props: { type: 'color', value: level.bgcolor },
      on: { input: (e) => { level.bgcolor = e.currentTarget.value } },
    })
    const gridInput = hx('input', {
      signal,
      props: { type: 'color', value: level.gridcolor ?? '#000000' },
      on: { input: (e) => { level.gridcolor = e.currentTarget.value } },
    })
    const muteInput = hx('input', {
      signal,
      props: { type: 'checkbox' },
      on: { change: (e) => ui.mod((u) => ({ ...u, mute: e.currentTarget.checked })) },
    })

    const saveBtn = hx('button', { signal, props: { type: 'button', className: btn }, on: { click: onSave } }, ['Save'])
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
      h('div', { className: styles.field }, [h('label', { className: edit.label }, ['BG ']), bgInput]),
      h('div', { className: styles.field }, [h('label', { className: edit.label }, ['Grid ']), gridInput]),
      h('label', { className: edit.muteRow }, [muteInput, ' Mute']),
      h('div', { className: styles.field }, [saveBtn, h('a', { href: '/play.html', className: edit.testLink }, ['Test'])]),
      signinMsg,
    )

    user.watch(signal, (u) => {
      saveBtn.style.display = u ? '' : 'none'
      signinMsg.style.display = u ? 'none' : ''
    })
  })().catch(console.error)

  return h('div', {}, [menuSlot, paletteSlot, canvas])
}
