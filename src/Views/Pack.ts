import { User } from 'firebase/auth'
import { funState } from "@fun-land/fun-state";
import { Component, h, bindView } from '@fun-land/fun-web'
import { votingEnabled } from '../features'
import { PackData, PackIcon } from '../pack'
import { LevelData } from '../level'
import { getPackById, upvotePack, hasUpvoted } from '../packStore'
import { getLevelById, getSolvedLevelIds } from '../store'
import { getUser } from "../services/getUser";
import { signIn, currentUser } from '../auth'
import { Header } from '../components/Header'
import { renderPixelIcon } from '../components/PixelIcon'
import { upvoteButton } from '../components/UpvoteButton'
import { Loadable, loading, loadInto, bindLoadable } from '../components/Async'
import { btn, btnSecondary, empty, page, pageBody } from "../theme.css";
import * as cardStyles from '../components/PackCard.css'
import * as styles from './Pack.css'

// Spoiler-free: only shown once the level is beaten, so browsing a pack
// never gives away an unsolved puzzle's answer. Prefers the level's reward
// art; falls back to the finished puzzle grid itself when there is none.
const levelThumb = (level: LevelData | null, solved: boolean): PackIcon | null => {
  if (!level || !solved) return null
  if (level.art) {
    const { scale, palette, data } = level.art
    return { x: (level.x ?? 0) * scale, y: (level.y ?? 0) * scale, game: data, palette }
  }
  return { x: level.x ?? 0, y: level.y ?? 0, game: level.game ?? '', palette: level.palette ?? [] }
}

const hero = (signal: AbortSignal, pack: PackData, user: User | null): Element => {
  const isOwner = user?.uid === pack.ownerId

  const voted = funState(false)
  if (votingEnabled && user) hasUpvoted(pack.id!, user.uid).then(voted.set).catch(console.error)

  const actions: Element[] = votingEnabled
    ? [
        upvoteButton(signal, {
          initialCount: pack.upvotes,
          voted,
          signedIn: !!user,
          toggle: () => upvotePack(pack.id!, user!.uid),
          requireSignIn: () => void signIn(),
        }),
      ]
    : []
  if (isOwner)
    actions.push(
      h(
        "a",
        {
          href: `/pack-edit.html?id=${pack.id}`,
          className: `${btn} ${btnSecondary}`,
        },
        ["Edit"],
      ),
    );

  const cover = h('div', { className: styles.heroCover }, [renderPixelIcon(pack.icon, 120)])

  const infoChildren: Element[] = [
    h("h2", { className: styles.heroTitle }, [pack.title]),
    h("div", { className: styles.heroMeta }, [
      `by ${pack.ownerName} · `,
      h("span", { className: "no-wrap" }, `${pack.levelIds.length} puzzles`),
    ]),
  ];
  if (pack.description) infoChildren.push(h('div', { className: styles.description }, [pack.description]))
  infoChildren.push(h('div', { className: styles.heroActions }, actions))

  return h('div', { className: styles.hero }, [cover, h('div', { className: styles.heroInfo }, infoChildren)])
}

const levelCard = (pack: PackData, level: LevelData | null, index: number, solvedIds: Set<string>): Element => {
  if (!level) return h('div', { className: cardStyles.card }, [h('div', { className: styles.itemMissing }, ['(deleted)'])])
  const href = `/play.html?id=${pack.levelIds[index]}&pack=${pack.id}`
  const solved = solvedIds.has(pack.levelIds[index])
  return h("div", { className: cardStyles.card }, [
    h("a", { href, className: cardStyles.cover }, [
      renderPixelIcon(levelThumb(level, solved), 128),
    ]),
    h("div", { className: cardStyles.info }, [
      h("a", { href, className: cardStyles.titleLink }, [
        `${index + 1}. ${level.title ?? "Untitled"}`,
      ]),
    ]),
  ]);
}

const levelList = (pack: PackData, levels: (LevelData | null)[], solvedIds: Set<string>): Element =>
  pack.levelIds.length === 0
    ? h('p', { className: empty }, ['No levels in this pack yet.'])
    : h('div', { className: cardStyles.grid }, levels.map((level, i) => levelCard(pack, level, i, solvedIds)))

export const Pack: Component = (signal) => {
  const user = getUser(signal);

  const id = new URLSearchParams(location.search).get('id')
  const packState = funState<Loadable<PackData | null>>(loading())
  if (id) loadInto(packState, getPackById(id))
  else packState.set({ status: 'ok', value: null })

  const content = bindLoadable(
    signal,
    packState,
    (regionSignal, pack) => {
      if (!pack) return h('p', { className: empty }, ['Pack not found.'])
      document.title = `${pack.title} | PP•WF`;

      const levels = funState<Loadable<{ levels: (LevelData | null)[]; solvedIds: Set<string> }>>(loading())
      loadInto(
        levels,
        (async () => {
          const ls = await Promise.all(pack.levelIds.map((lid) => getLevelById(lid)))
          const uid = currentUser()?.uid
          // Solved status is a nice-to-have overlay on the level list, not part
          // of it — a lookup failure here must never take the list down with it.
          const solvedIds = uid ? await getSolvedLevelIds(pack.levelIds, uid).catch(() => new Set<string>()) : new Set<string>()
          return { levels: ls, solvedIds }
        })(),
      )

      const heroEl = bindView(regionSignal, user, (s, u) => hero(s, pack, u))
      const listEl = bindLoadable(regionSignal, levels, (_s, v) => levelList(pack, v.levels, v.solvedIds))

      return h("div", {}, [
        heroEl,
        h("h3", { className: styles.listHeading }, ["Puzzles"]),
        listEl,
      ]);
    },
    { errorMsg: 'Failed to load pack.' },
  )

  return h("div", { className: page }, [
    Header(signal, {}),
    h("div", { className: pageBody }, [content]),
  ]);
}
