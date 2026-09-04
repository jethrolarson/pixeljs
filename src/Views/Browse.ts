import { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore/lite'
import { funState, mapRead } from '@fun-land/fun-state'
import { Component, h, hx, bindView } from '@fun-land/fun-web'
import { votingEnabled } from '../features'
import { PackData } from '../pack'
import { getCommunityPacks } from '../packStore'
import { getUser } from "../services/getUser";
import { Header } from '../components/Header'
import { packGrid } from '../components/PackGrid'
import { btn, empty, page, pageBody } from "../theme.css";
import { sectionHeader } from "./Home.css";
import * as styles from './Browse.css'

type Sort = 'upvotes' | 'createdAt'

interface CommunityState {
  packs: PackData[]
  lastDoc: QueryDocumentSnapshot<DocumentData> | null
  loading: boolean
  error: boolean
}

// Reset discards the current page (new sort/first load); "load more" keeps
// it and appends once the fetch lands.
const startLoad = (reset: boolean) => (st: CommunityState): CommunityState => ({
  ...st,
  loading: true,
  error: false,
  ...(reset ? { packs: [], lastDoc: null } : {}),
})

const applyPage = (reset: boolean, res: Awaited<ReturnType<typeof getCommunityPacks>>) => (st: CommunityState): CommunityState => ({
  packs: reset ? res.packs : [...st.packs, ...res.packs],
  lastDoc: res.lastDoc,
  loading: false,
  error: false,
})

const applyLoadError = (st: CommunityState): CommunityState => ({ ...st, loading: false, error: true })

export const Browse: Component = (signal) => {
  const user = getUser(signal)
  const getUid = () => user.get()?.uid ?? null;
  const sort = funState<Sort>(votingEnabled ? 'upvotes' : 'createdAt')
  const community = funState<CommunityState>({ packs: [], lastDoc: null, loading: false, error: false })

  // Sort-change and "load more" can both be in flight at once; a stale response
  // arriving after a newer one would otherwise clobber it (e.g. an in-flight
  // "load more" resolving after a sort reset would append last page's packs onto
  // the new sort's freshly-reset list). requestId tags each call so only the
  // most recent one's response is applied.
  let requestId = 0
  const loadCommunity = async (reset: boolean): Promise<void> => {
    const id = ++requestId
    const after = reset ? undefined : community.get().lastDoc ?? undefined
    community.mod(startLoad(reset))
    try {
      const res = await getCommunityPacks(sort.get(), after)
      if (id !== requestId) return
      community.mod(applyPage(reset, res))
    } catch (e) {
      if (id !== requestId) return
      console.error(e)
      community.mod(applyLoadError)
    }
  }

  const sortControl = votingEnabled
    ? h('label', { className: [styles.sortBar, 'deem'].join(' ') }, [
        'Sort by:',
        hx(
          'select',
          {
            signal,
            on: {
              change: (e) => {
                sort.set(e.currentTarget.value as Sort)
                void loadCommunity(true)
              },
            },
          },
          [h('option', { value: 'upvotes' }, ['Most voted']), h('option', { value: 'createdAt' }, ['Newest'])],
        ),
      ])
    : null

  const body = bindView(signal, community, (s, st) => {
    if (st.loading && st.packs.length === 0) return h('p', { className: empty }, ['Loading…'])
    if (st.error && st.packs.length === 0) return h('p', { className: empty }, ['Failed to load packs.'])
    if (st.packs.length === 0) return h('p', { className: empty }, ['No community packs yet.'])
    const children: Element[] = [packGrid(s, st.packs, getUid)]
    if (st.lastDoc)
      children.push(
        h('div', { className: styles.loadMoreWrap }, [
          hx('button', { signal: s, props: { className: btn }, on: { click: () => void loadCommunity(false) } }, [
            'Load more',
          ]),
        ]),
      )
    return h('div', {}, children)
  })

  void loadCommunity(true)

  return h("div", { className: page }, [
    Header(signal, {}),
    h("div", { className: pageBody }, [
      h("div", { className: sectionHeader }, [
        h("h2", {}, ["Community Packs"]),
        ...(sortControl ? [sortControl] : []),
      ]),
      body,
    ]),
  ]);
}
