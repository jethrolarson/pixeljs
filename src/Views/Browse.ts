import { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore'
import { funState, mapRead } from '@fun-land/fun-state'
import { Component, h, hx, bindView } from '@fun-land/fun-web'
import { PackData } from '../pack'
import { getCommunityPacks } from '../packStore'
import { getUser } from '../services/getUser'
import { getModerator } from '../services/getModerator'
import { Header } from '../components/Header'
import { packGrid } from '../components/PackGrid'
import { btn, empty, page } from '../theme.css'
import { sectionHeader, sectionTitle } from './Home.css'
import * as styles from './Browse.css'

type Sort = 'upvotes' | 'createdAt'

interface CommunityState {
  packs: PackData[]
  lastDoc: QueryDocumentSnapshot<DocumentData> | null
  loading: boolean
  error: boolean
}

export const Browse: Component = (signal) => {
  const user = getUser(signal)
  const getUid = () => user.get()?.uid ?? null
  const isMod = getModerator(
    signal,
    mapRead(user, (u) => u?.uid ?? null),
  )

  const sort = funState<Sort>('upvotes')
  const community = funState<CommunityState>({ packs: [], lastDoc: null, loading: false, error: false })

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
      on: {
        change: (e) => {
          sort.set(e.currentTarget.value as Sort)
          void loadCommunity(true)
        },
      },
    },
    [h('option', { value: 'upvotes' }, ['Most voted']), h('option', { value: 'createdAt' }, ['Newest'])],
  )

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

  return h('div', { className: page }, [
    Header(signal, { user, isMod }),
    h('div', { className: sectionHeader }, [
      h('h2', { className: sectionTitle }, ['Community Packs']),
      h('div', { className: styles.sortBar }, ['Sort by:', sortSelect]),
    ]),
    body,
  ])
}
