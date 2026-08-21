import { User } from 'firebase/auth'
import { funState, mapRead } from '@fun-land/fun-state'
import { Component, h, bindView } from '@fun-land/fun-web'
import { PackData, PackIcon } from '../pack'
import { LevelData } from '../level'
import { getPackById, upvotePack, hasUpvoted } from '../packStore'
import { getLevelById, getSolvedLevelIds } from '../store'
import { getUser } from '../services/getUser'
import { getModerator } from '../services/getModerator'
import { signIn, currentUser } from '../auth'
import { Header } from '../components/Header'
import { renderPixelIcon } from '../components/PixelIcon'
import { upvoteButton } from '../components/UpvoteButton'
import { Loadable, loading, loadInto, bindLoadable } from '../components/Async'
import { btn, empty, page } from '../theme.css'
import * as cardStyles from '../components/PackCard.css'
import * as styles from './Pack.css'

// Solved art is spoiler-free by design: only shown once the level is beaten,
// so browsing a pack never gives away an unsolved puzzle's answer.
const levelThumb = (level: LevelData | null, solved: boolean): PackIcon | null => {
  if (!level?.art || !solved) return null
  const { scale, palette, data } = level.art
  return { x: (level.x ?? 0) * scale, y: (level.y ?? 0) * scale, game: data, palette }
}

const hero = (signal: AbortSignal, pack: PackData, user: User | null): Element => {
  const isOwner = user?.uid === pack.ownerId

  const voted = funState(false)
  if (user) hasUpvoted(pack.id!, user.uid).then(voted.set).catch(console.error)

  const actions: Element[] = [
    upvoteButton(signal, {
      initialCount: pack.upvotes,
      voted,
      signedIn: !!user,
      toggle: () => upvotePack(pack.id!, user!.uid),
      requireSignIn: () => void signIn(),
    }),
  ]
  if (isOwner) actions.push(h('a', { href: `/pack-edit.html?id=${pack.id}`, className: btn }, ['Edit']))

  const cover = h('div', { className: styles.heroCover }, [renderPixelIcon(pack.icon, 120)])

  const infoChildren: Element[] = [
    h('h2', { className: styles.heroTitle }, [pack.title]),
    h('div', { className: styles.heroMeta }, [`by ${pack.ownerName} · ${pack.levelIds.length} levels`]),
  ]
  if (pack.description) infoChildren.push(h('div', { className: styles.description }, [pack.description]))
  infoChildren.push(h('div', { className: styles.heroActions }, actions))

  return h('div', { className: styles.hero }, [cover, h('div', { className: styles.heroInfo }, infoChildren)])
}

const levelCard = (pack: PackData, level: LevelData | null, index: number, solvedIds: Set<string>): Element => {
  if (!level) return h('div', { className: cardStyles.card }, [h('div', { className: styles.itemMissing }, ['(deleted)'])])
  const href = `/play.html?id=${pack.levelIds[index]}&pack=${pack.id}`
  const solved = solvedIds.has(pack.levelIds[index])
  return h('div', { className: cardStyles.card }, [
    h('a', { href, className: cardStyles.cover }, [renderPixelIcon(levelThumb(level, solved), 160)]),
    h('div', { className: cardStyles.info }, [
      h('a', { href, className: cardStyles.titleLink }, [`${index + 1}. ${level.title ?? 'Untitled'}`]),
    ]),
  ])
}

const levelList = (pack: PackData, levels: (LevelData | null)[], solvedIds: Set<string>): Element =>
  pack.levelIds.length === 0
    ? h('p', { className: empty }, ['No levels in this pack yet.'])
    : h('div', { className: cardStyles.grid }, levels.map((level, i) => levelCard(pack, level, i, solvedIds)))

export const Pack: Component = (signal) => {
  const user = getUser(signal)
  const uid = mapRead(user, (u) => u?.uid ?? null)
  const isMod = getModerator(signal, uid)

  const id = new URLSearchParams(location.search).get('id')
  const packState = funState<Loadable<PackData | null>>(loading())
  if (id) loadInto(packState, getPackById(id))
  else packState.set({ status: 'ok', value: null })

  const content = bindLoadable(
    signal,
    packState,
    (regionSignal, pack) => {
      if (!pack) return h('p', { className: empty }, ['Pack not found.'])
      document.title = `${pack.title} · Pixel Puzzle`

      const levels = funState<Loadable<{ levels: (LevelData | null)[]; solvedIds: Set<string> }>>(loading())
      loadInto(
        levels,
        (async () => {
          const ls = await Promise.all(pack.levelIds.map((lid) => getLevelById(lid)))
          const uid = currentUser()?.uid
          const solvedIds = uid ? await getSolvedLevelIds(pack.levelIds, uid) : new Set<string>()
          return { levels: ls, solvedIds }
        })(),
      )

      const heroEl = bindView(regionSignal, user, (s, u) => hero(s, pack, u))
      const listEl = bindLoadable(regionSignal, levels, (_s, v) => levelList(pack, v.levels, v.solvedIds))

      return h('div', {}, [heroEl, h('h3', { className: styles.listHeading }, ['Levels']), listEl])
    },
    { errorMsg: 'Failed to load pack.' },
  )

  return h('div', { className: page }, [Header(signal, { user, isMod }), content])
}
