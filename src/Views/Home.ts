import { funState, mapRead } from '@fun-land/fun-state'
import { Component, h } from '@fun-land/fun-web'
import { PackData } from '../pack'
import { getFeaturedPacks } from '../packStore'
import { getUser } from '../services/getUser'
import { getModerator } from '../services/getModerator'
import { Header } from '../components/Header'
import { packGrid } from '../components/PackGrid'
import { Loadable, loading, loadInto, bindLoadable } from '../components/Async'
import { empty, page } from '../theme.css'
import { sectionHeader, sectionTitle } from './Home.css'

export const Home: Component = (signal) => {
  const user = getUser(signal)
  const uid = mapRead(user, (u) => u?.uid ?? null)
  const isMod = getModerator(signal, uid)

  const featured = funState<Loadable<PackData[]>>(loading())
  loadInto(featured, getFeaturedPacks())

  const gridEl = bindLoadable(
    signal,
    featured,
    (regionSignal, packs) =>
      packs.length
        ? packGrid(regionSignal, packs, () => user.get()?.uid ?? null)
        : h('p', { className: empty }, ['No featured packs yet.']),
    { errorMsg: 'Failed to load packs.' },
  )

  return h('div', { className: page }, [
    Header(signal, { user, isMod }),
    h('div', { className: sectionHeader }, [
      h('h2', { className: sectionTitle }, ['Featured Packs']),
      h('a', { href: '/browse.html' }, ['Browse community packs →']),
    ]),
    gridEl,
  ])
}
