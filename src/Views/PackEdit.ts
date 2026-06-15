import { User } from 'firebase/auth'
import { funState, FunState, mapRead } from '@fun-land/fun-state'
import { Component, h, hx, enhance, bindView, bindClass, bindProperty } from '@fun-land/fun-web'
import { PackData } from '../pack'
import { LevelData } from '../level'
import { getPackById, savePack, deletePack } from '../packStore'
import { getLevels } from '../store'
import { getUser } from '../services/getUser'
import { getModerator } from '../services/getModerator'
import { PackCard } from '../components/PackCard'
import { Header } from '../components/Header'
import { hidden } from '../components/Header.css'
import { btn, btnDanger, empty, page } from '../theme.css'
import * as styles from './PackEdit.css'

const PRESET_COLORS = ['#2a6496', '#1a6b3a', '#7a2a2a', '#5a2a7a', '#7a5a1a', '#1a5a6b', '#333']

interface PackForm {
  title: string
  description: string
  icons: string
  color: string
  published: boolean
  levelIds: string[]
}

const parseIcons = (raw: string): string[] =>
  [...raw.trim()].filter((c) => (c.codePointAt(0) ?? 0) > 0x7f).slice(0, 4)

const editor = (signal: AbortSignal, user: User): Element => {
  const params = new URLSearchParams(location.search)
  const packId = params.get('id')
  const addLevelId = params.get('add')
  const uid = user.uid

  let currentId: string | null = packId
  let currentPack: PackData | null = null
  let allMyLevels: LevelData[] = []

  const form = funState<PackForm>({
    title: '',
    description: '',
    icons: '',
    color: PRESET_COLORS[0],
    published: false,
    levelIds: [],
  })
  const query = funState('')
  const status = funState('')
  const showDelete = funState(false)

  const buildPack = (): PackData => {
    const f = form.get()
    return {
      id: currentId ?? undefined,
      title: f.title.trim() || 'Untitled Pack',
      description: f.description.trim() || undefined,
      ownerId: uid,
      ownerName: currentPack?.ownerName ?? user.displayName ?? 'Anonymous',
      levelIds: f.levelIds,
      icons: parseIcons(f.icons),
      color: f.color,
      published: f.published,
      featured: currentPack?.featured ?? false,
      featuredOrder: currentPack?.featuredOrder,
      upvotes: currentPack?.upvotes ?? 0,
    }
  }

  const persist = async (): Promise<void> => {
    const saved = await savePack(buildPack())
    currentPack = saved
    currentId = saved.id!
    showDelete.set(true)
    history.replaceState(null, '', `?id=${currentId}`)
  }

  // --- Form fields ---
  const inputField = (key: 'title' | 'icons', attrs: Record<string, unknown>) =>
    hx('input', {
      signal,
      props: { className: styles.input, ...attrs },
      bind: { value: form.prop(key) },
      on: { input: (e) => form.prop(key).set(e.currentTarget.value) },
    })

  const descField = hx('textarea', {
    signal,
    props: { className: styles.textarea, placeholder: 'A short description…', maxLength: 400 },
    bind: { value: form.prop('description') },
    on: { input: (e) => form.prop('description').set(e.currentTarget.value) },
  })

  const colorField = hx('input', {
    signal,
    props: { type: 'color', className: styles.colorInput },
    bind: { value: form.prop('color') },
    on: { input: (e) => form.prop('color').set(e.currentTarget.value) },
  })

  const presetRow = h(
    'div',
    { className: styles.presets },
    PRESET_COLORS.map((c) =>
      enhance(
        hx('div', { signal, attrs: { style: `background:${c}` }, props: { className: styles.preset }, on: { click: () => form.prop('color').set(c) } }, []),
        bindClass(styles.presetSelected, mapRead(form.prop('color'), (col) => col === c), signal),
      ),
    ),
  )

  const publishCheck = hx('input', {
    signal,
    props: { type: 'checkbox' },
    bind: { checked: form.prop('published') },
    on: { change: (e) => form.prop('published').set(e.currentTarget.checked) },
  })

  // --- Level list ---
  const levelList = bindView(signal, form.prop('levelIds'), (_s, ids) =>
    ids.length === 0
      ? h('ul', { className: styles.packLevels }, [h('li', { className: styles.emptyLevels }, ['No levels added yet.'])])
      : h(
          'ul',
          { className: styles.packLevels },
          ids.map((id, i) => {
            const lvl = allMyLevels.find((l) => l.id === id)
            return h('li', { className: styles.packLevelItem }, [
              h('span', { className: styles.dragHandle }, ['⠿']),
              h('span', { className: styles.levTitle }, [lvl?.title ?? id]),
              hx('button', { signal, props: { className: styles.removeBtn }, on: { click: () => form.prop('levelIds').mod((arr) => arr.filter((_, j) => j !== i)) } }, ['✕']),
            ])
          }),
        ),
  )

  // --- Level search ---
  const searchInput = hx('input', {
    signal,
    props: { className: styles.input, placeholder: 'Search your levels…' },
    bind: { value: query },
    on: { input: (e) => query.set(e.currentTarget.value) },
  })

  const searchResults = bindView(signal, query, (s, q) => {
    const term = q.trim().toLowerCase()
    const taken = form.get().levelIds
    const matches = term
      ? allMyLevels.filter((l) => !taken.includes(l.id!) && (l.title ?? '').toLowerCase().includes(term)).slice(0, 10)
      : []
    if (matches.length === 0) return h('div', {})
    return h(
      'div',
      { className: styles.levelResults },
      matches.map((l) =>
        hx('div', { signal: s, props: { className: styles.levelResult }, on: { click: () => { form.prop('levelIds').mod((ids) => [...ids, l.id!]); query.set('') } } }, [
          h('span', {}, [l.title ?? 'Untitled']),
          h('span', { className: styles.addLabel }, ['+ Add']),
        ]),
      ),
    )
  })

  // --- Buttons ---
  const saveBtn = hx('button', { signal, props: { className: btn }, on: { click: async () => { status.set('Saving…'); await persist(); status.set('Saved!'); setTimeout(() => status.set(''), 2000) } } }, ['Save'])
  const newLevelBtn = hx('button', { signal, props: { className: btn }, on: { click: async () => { status.set('Saving pack…'); await persist(); location.href = `/edit.html?pack=${currentId}` } } }, ['+ Create new level'])
  const deleteBtn = enhance(
    hx('button', { signal, props: { className: `${btn} ${btnDanger}` }, on: { click: async () => { if (currentId && confirm('Delete this pack?')) { await deletePack(currentId); location.href = '/browse.html' } } } }, ['Delete']),
    bindClass(hidden, mapRead(showDelete, (v) => !v), signal),
  )
  const statusEl = enhance(h('span', { className: styles.status }, []), bindProperty('textContent', status, signal))

  // --- Preview ---
  const preview = bindView(signal, form, (s) => PackCard(s, { pack: buildPack() }))

  // --- Async load ---
  ;(async () => {
    allMyLevels = (await getLevels()).filter((l) => l.ownerId === uid)
    if (packId) {
      let pack: PackData | null
      try {
        pack = await getPackById(packId)
      } catch (e) {
        console.error(e)
        status.set('Failed to load pack.')
        return
      }
      if (pack && pack.ownerId !== uid) {
        status.set('You do not own this pack.')
        return
      }
      if (pack) {
        currentPack = pack
        form.set({
          title: pack.title,
          description: pack.description ?? '',
          icons: pack.icons.join(''),
          color: pack.color,
          published: pack.published,
          levelIds: [...pack.levelIds],
        })
        showDelete.set(true)
      }
    }
    if (addLevelId && !form.get().levelIds.includes(addLevelId)) {
      form.prop('levelIds').mod((ids) => [...ids, addLevelId])
      await persist()
    }
    history.replaceState(null, '', currentId ? `?id=${currentId}` : location.pathname)
  })().catch(console.error)

  const group = (labelText: string, ...children: Element[]) =>
    h('div', { className: styles.formGroup }, [h('label', { className: styles.label }, [labelText]), ...children])

  return h('div', { className: styles.layout }, [
    h('div', { className: styles.form }, [
      group('Title', inputField('title', { placeholder: 'My awesome pack', maxLength: 80 })),
      group('Description', descField),
      group('Icons (1–4 emoji)', inputField('icons', { placeholder: '🧩', maxLength: 8 })),
      group('Card color', h('div', { className: styles.colorRow }, [colorField, presetRow])),
      h('div', { className: styles.formGroup }, [
        h('div', { className: styles.publishRow }, [publishCheck, h('label', { className: styles.publishLabel }, ['Published (visible to others)'])]),
      ]),
      h('h3', { className: styles.heading }, ['Levels']),
      levelList,
      group('Add an existing level', searchInput, searchResults),
      h('div', { className: styles.formGroup }, [newLevelBtn]),
      h('div', { className: styles.formActions }, [saveBtn, deleteBtn, statusEl]),
    ]),
    h('div', { className: styles.previewCol }, [h('div', { className: styles.previewLabel }, ['Preview']), preview]),
  ])
}

export const PackEdit: Component = (signal) => {
  const user = getUser(signal)
  const uid = mapRead(user, (u) => u?.uid ?? null)
  const isMod = getModerator(signal, uid)

  const slot = h('div', {})
  let started = false
  user.watch(signal, (u) => {
    if (u && !started) {
      started = true
      slot.replaceChildren(editor(signal, u))
    } else if (!u && !started) {
      slot.replaceChildren(h('p', { className: empty }, ['Sign in to create packs.']))
    }
  })

  return h('div', { className: page }, [Header(signal, { user, isMod }), slot])
}
