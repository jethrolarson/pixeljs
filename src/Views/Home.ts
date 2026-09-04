import { funState, mapRead } from '@fun-land/fun-state'
import { Component, h } from '@fun-land/fun-web'
import { PackData } from '../pack'
import { getFeaturedPacks } from '../packStore'
import { getUser } from "../services/getUser";
import { Header } from '../components/Header'
import { packGrid } from '../components/PackGrid'
import { Loadable, loading, loadInto, bindLoadable } from '../components/Async'
import { empty, page, pageBody } from "../theme.css";
import { sectionHeader } from "./Home.css";

export const Home: Component = (signal) => {
  const user = getUser(signal);

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

  return h("div", { className: page }, [
    Header(signal, {}),
    h("div", { className: pageBody }, [
      h("div", { className: sectionHeader }, [h("h2", {}, ["Featured Packs"])]),
      gridEl,
    ]),
  ]);
}
