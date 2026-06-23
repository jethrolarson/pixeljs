import { User } from 'firebase/auth'
import { funState, mapRead } from '@fun-land/fun-state'
import { Component, h, enhance, attr, bindView } from '@fun-land/fun-web'
import { PackData } from '../pack'
import { LevelData } from '../level'
import { getPackById, upvotePack, hasUpvoted } from '../packStore'
import { getLevelById } from '../store'
import { getUser } from '../services/getUser'
import { getModerator } from '../services/getModerator'
import { signIn } from '../auth'
import { Header } from '../components/Header'
import { upvoteButton } from '../components/UpvoteButton'
import { Loadable, loading, loadInto, bindLoadable } from '../components/Async'
import { btn, empty, page } from '../theme.css'
import * as styles from './Pack.css'

const hero = (signal: AbortSignal, pack: PackData, user: User | null): Element => {
  const iconStr = pack.icons.slice(0, 4).join('') || '🧩'
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

  const cover = enhance(
    h('div', { className: styles.heroCover }, [iconStr]),
    attr('style', `background:${pack.color}`),
  )

  const infoChildren: Element[] = [
    h('h2', { className: styles.heroTitle }, [pack.title]),
    h('div', { className: styles.heroMeta }, [`by ${pack.ownerName} · ${pack.levelIds.length} levels`]),
  ]
  if (pack.description) infoChildren.push(h('div', { className: styles.description }, [pack.description]))
  infoChildren.push(h('div', { className: styles.heroActions }, actions))

  return h('div', { className: styles.hero }, [cover, h('div', { className: styles.heroInfo }, infoChildren)])
}

const levelList = (pack: PackData, levels: (LevelData | null)[]): Element =>
  pack.levelIds.length === 0
    ? h('p', { className: empty }, ['No levels in this pack yet.'])
    : h(
        'ol',
        { className: styles.list },
        levels.map((level, i) =>
          h('li', { className: styles.item }, [
            h('span', { className: styles.num }, [String(i + 1)]),
            level
              ? h('a', { href: `/play.html?id=${pack.levelIds[i]}&pack=${pack.id}`, className: styles.itemTitle }, [
                  level.title ?? 'Untitled',
                ])
              : h('span', { className: styles.itemMissing }, ['(deleted)']),
          ]),
        ),
      )

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

      const levels = funState<Loadable<(LevelData | null)[]>>(loading())
      loadInto(levels, Promise.all(pack.levelIds.map((lid) => getLevelById(lid))))

      const heroEl = bindView(regionSignal, user, (s, u) => hero(s, pack, u))
      const listEl = bindLoadable(regionSignal, levels, (_s, ls) => levelList(pack, ls))

      return h('div', {}, [heroEl, h('h3', { className: styles.listHeading }, ['Levels']), listEl])
    },
    { errorMsg: 'Failed to load pack.' },
  )

  return h('div', { className: page }, [Header(signal, { user, isMod }), content])
}
