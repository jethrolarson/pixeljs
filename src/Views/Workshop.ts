import { funState, mapRead } from '@fun-land/fun-state'
import { Component, h, hx, bindView } from '@fun-land/fun-web'
import { LevelData } from '../level'
import { PackData } from '../pack'
import { getLevels, deleteLevel } from '../store'
import { getMyPacks } from '../packStore'
import { levelToDataURL } from '../util'
import { getUser } from '../services/getUser'
import { getModerator } from '../services/getModerator'
import { Header } from '../components/Header'
import { packGrid } from '../components/PackGrid'
import { Loadable, loading, loadInto, bindLoadable } from '../components/Async'
import { btn, btnDanger, empty, page } from '../theme.css'
import { sectionHeader, sectionTitle } from './Home.css'
import * as styles from './Workshop.css'

const levelCard = (signal: AbortSignal, level: LevelData, reload: () => void): Element =>
  h('div', { className: styles.card }, [
    h('a', { href: `/play.html?id=${level.id}`, className: styles.thumbLink }, [
      h('img', { src: levelToDataURL(level), alt: level.title ?? 'Untitled', className: styles.thumb }),
    ]),
    h('div', { className: styles.cardInfo }, [
      h('span', { className: styles.cardTitle }, [level.title ?? 'Untitled']),
      h('div', { className: styles.cardActions }, [
        h('a', { href: `/edit.html?id=${level.id}`, className: btn }, ['Edit']),
        hx(
          'button',
          {
            signal,
            props: { className: `${btn} ${btnDanger}` },
            on: {
              click: async () => {
                if (!confirm(`Delete "${level.title ?? 'Untitled'}"?`)) return
                await deleteLevel(level.id!)
                reload()
              },
            },
          },
          ['Delete'],
        ),
      ]),
    ]),
  ])

const levelsSection = (signal: AbortSignal, uid: string): Element => {
  const levels = funState<Loadable<LevelData[]>>(loading())
  const reload = (): void => loadInto(levels, getLevels().then((ls) => ls.filter((l) => l.ownerId === uid)))
  reload()

  const grid = bindLoadable(
    signal,
    levels,
    (regionSignal, ls) =>
      ls.length
        ? h('div', { className: styles.grid }, ls.map((l) => levelCard(regionSignal, l, reload)))
        : h('p', { className: empty }, ['No levels yet.']),
    { errorMsg: 'Failed to load levels.' },
  )

  return h('section', {}, [
    h('div', { className: sectionHeader }, [
      h('h2', { className: sectionTitle }, ['My Levels']),
      h('a', { href: '/edit.html', className: btn }, ['+ New Level']),
    ]),
    grid,
  ])
}

const packsSection = (signal: AbortSignal, uid: string): Element => {
  const packs = funState<Loadable<PackData[]>>(loading())
  loadInto(packs, getMyPacks(uid))

  const grid = bindLoadable(
    signal,
    packs,
    (regionSignal, ps) =>
      ps.length
        ? packGrid(regionSignal, ps, () => uid, true)
        : h('p', { className: empty }, ['No packs yet.']),
    { errorMsg: 'Failed to load packs.' },
  )

  return h('section', {}, [
    h('div', { className: sectionHeader }, [
      h('h2', { className: sectionTitle }, ['My Packs']),
      h('a', { href: '/pack-edit.html', className: btn }, ['+ New Pack']),
    ]),
    grid,
  ])
}

export const Workshop: Component = (signal) => {
  const user = getUser(signal)
  const uid = mapRead(user, (u) => u?.uid ?? null)
  const isMod = getModerator(signal, uid)

  const content = bindView(signal, user, (regionSignal, u) =>
    u
      ? h('div', { className: styles.sections }, [
          levelsSection(regionSignal, u.uid),
          packsSection(regionSignal, u.uid),
        ])
      : h('p', { className: empty }, ['Sign in to see your workshop.']),
  )

  return h('div', { className: page }, [Header(signal, { user, isMod }), content])
}
