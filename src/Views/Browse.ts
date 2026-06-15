import { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore'
import { funState, FunRead, mapRead } from '@fun-land/fun-state'
import { Component, h, hx, enhance, bindView, bindClass } from '@fun-land/fun-web'
import { PackData } from '../pack'
import { getFeaturedPacks, getCommunityPacks, getMyPacks, upvotePack, hasUpvoted } from '../packStore'
import { getUser } from '../services/getUser'
import { getModerator } from '../services/getModerator'
import { signIn } from '../auth'
import { Header } from '../components/Header'
import { PackCard } from '../components/PackCard'
import { hidden } from '../components/Header.css'
import { grid } from '../components/PackCard.css'
import { Loadable, loading, loadInto, bindLoadable } from '../components/Async'
import { btn, empty, page } from '../theme.css'
import * as styles from './Browse.css'

type TabName = 'featured' | 'community' | 'mine'
type Sort = 'upvotes' | 'createdAt'

interface CommunityState {
  packs: PackData[]
  lastDoc: QueryDocumentSnapshot<DocumentData> | null
  loading: boolean
  error: boolean
}

export const Browse: Component = (signal) => {
  const user = getUser(signal)
  const uid = () => user.get()?.uid ?? null
  const isMod = getModerator(
    signal,
    mapRead(user, (u) => u?.uid ?? null),
  )

  // Render a grid of packs with working upvote buttons (per-card voted state).
  const packGrid = (regionSignal: AbortSignal, packs: PackData[], showEdit = false): Element =>
    h(
      'div',
      { className: grid },
      packs.map((p) => {
        const voted = funState(false)
        const u = uid()
        if (u) hasUpvoted(p.id!, u).then(voted.set).catch(console.error)
        return PackCard(regionSignal, {
          pack: p,
          showEdit,
          upvote: {
            voted,
            signedIn: !!u,
            toggle: () => upvotePack(p.id!, uid()!),
            requireSignIn: () => void signIn(),
          },
        })
      }),
    )

  // --- Featured panel ---
  const featured = funState<Loadable<PackData[]>>(loading())
  loadInto(featured, getFeaturedPacks())
  const featuredPanel = bindLoadable(
    signal,
    featured,
    (s, packs) => (packs.length ? packGrid(s, packs) : h('p', { className: empty }, ['No featured packs yet.'])),
    { errorMsg: 'Failed to load packs.' },
  )

  // --- Community panel ---
  const sort = funState<Sort>('upvotes')
  const community = funState<CommunityState>({ packs: [], lastDoc: null, loading: false, error: false })
  let communityStarted = false

  const loadCommunity = async (reset: boolean): Promise<void> => {
    community.mod((st) => ({ ...st, loading: true, error: false, ...(reset ? { packs: [], lastDoc: null } : {}) }))
    try {
      const after = reset ? undefined : community.get().lastDoc ?? undefined
      const res = await getCommunityPacks(sort.get(), after)
      community.mod((st) => ({
        packs: reset ? res.packs : [...st.packs, ...res.packs],
        lastDoc: res.lastDoc,
        loading: false,
        error: false,
      }))
    } catch (e) {
      console.error(e)
      community.mod((st) => ({ ...st, loading: false, error: true }))
    }
  }

  const sortSelect = hx(
    'select',
    {
      signal,
      on: { change: (e) => { sort.set(e.currentTarget.value as Sort); void loadCommunity(true) } },
    },
    [h('option', { value: 'upvotes' }, ['Most voted']), h('option', { value: 'createdAt' }, ['Newest'])],
  )

  const communityBody = bindView(signal, community, (s, st) => {
    if (st.loading && st.packs.length === 0) return h('p', { className: empty }, ['Loading…'])
    if (st.error && st.packs.length === 0) return h('p', { className: empty }, ['Failed to load packs.'])
    if (st.packs.length === 0) return h('p', { className: empty }, ['No community packs yet.'])
    const children: Element[] = [packGrid(s, st.packs)]
    if (st.lastDoc)
      children.push(
        h('div', { className: styles.loadMoreWrap }, [
          hx('button', { signal: s, props: { className: btn }, on: { click: () => void loadCommunity(false) } }, ['Load more']),
        ]),
      )
    return h('div', {}, children)
  })

  const communityPanel = h('div', {}, [
    h('div', { className: styles.sortBar }, ['Sort by:', sortSelect]),
    communityBody,
  ])

  // --- My Packs panel ---
  const mine = funState<Loadable<PackData[]>>(loading())
  const loadMine = (): void => {
    const u = uid()
    if (!u) return
    mine.set(loading())
    loadInto(mine, getMyPacks(u))
  }
  const minePanel = bindView(signal, user, (s, u) =>
    !u
      ? h('p', { className: empty }, ['Sign in to see your packs.'])
      : bindLoadable(
          s,
          mine,
          (s2, packs) =>
            packs.length
              ? packGrid(s2, packs, true)
              : h('p', { className: empty }, ["You haven't created any packs. ", h('a', { href: '/pack-edit.html' }, ['Create one!'])]),
          { errorMsg: 'Failed to load your packs.' },
        ),
  )

  // --- Tabs ---
  const activeTab = funState<TabName>('featured')
  const notSignedIn = mapRead(user, (u) => u == null)
  let mineStarted = false

  activeTab.watch(signal, (t) => {
    if (t === 'community' && !communityStarted) {
      communityStarted = true
      void loadCommunity(true)
    }
    if (t === 'mine' && !mineStarted) {
      mineStarted = true
      loadMine()
    }
  })

  // Reload My Packs when auth changes while it's the active tab.
  user.watch(signal, () => {
    if (activeTab.get() === 'mine' && mineStarted) loadMine()
  })

  const tabButton = (name: TabName, label: string, hideWhen?: FunRead<boolean>) => {
    const el = enhance(
      hx('button', { signal, props: { className: styles.tab }, on: { click: () => activeTab.set(name) } }, [label]),
      bindClass(styles.tabActive, mapRead(activeTab, (t) => t === name), signal),
    )
    return hideWhen ? enhance(el, bindClass(hidden, hideWhen, signal)) : el
  }

  const panels: Record<TabName, Element> = {
    featured: featuredPanel,
    community: communityPanel,
    mine: minePanel,
  }
  const panelView = bindView(signal, activeTab, (_s, t) => panels[t])

  return h('div', { className: page }, [
    Header(signal, { user, isMod }),
    h('nav', { className: styles.tabs }, [
      tabButton('featured', 'Featured'),
      tabButton('community', 'Community'),
      tabButton('mine', 'My Packs', notSignedIn),
    ]),
    panelView,
  ])
}
