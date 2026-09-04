import { funState } from "@fun-land/fun-state";
import { Component, h, bindView } from "@fun-land/fun-web";
import { PackData } from "../pack";
import { getMyPacks } from "../packStore";
import { getUser } from "../services/getUser";
import { Header } from "../components/Header";
import { packGrid } from "../components/PackGrid";
import { Loadable, loading, loadInto, bindLoadable } from "../components/Async";
import { btn, btnPrimary, empty, page, pageBody } from "../theme.css";
import { sectionHeader } from "./Home.css";
import * as styles from "./Workshop.css";

const packsSection = (signal: AbortSignal, uid: string): Element => {
  const packs = funState<Loadable<PackData[]>>(loading());
  loadInto(packs, getMyPacks(uid));

  const grid = bindLoadable(
    signal,
    packs,
    (regionSignal, ps) =>
      ps.length
        ? packGrid(regionSignal, ps, () => uid, true)
        : h("p", { className: empty }, ["No packs yet."]),
    { errorMsg: "Failed to load packs." },
  );

  return h("section", {}, [
    h("div", { className: sectionHeader }, [
      h("h2", {}, ["My Packs"]),
      h("a", { href: "/pack-edit.html", className: `${btn} ${btnPrimary}` }, [
        "+ New Pack",
      ]),
    ]),
    grid,
  ]);
};

export const Workshop: Component = (signal) => {
  const user = getUser(signal);

  const content = bindView(signal, user, (regionSignal, u) =>
    u
      ? h("div", { className: styles.sections }, [
          packsSection(regionSignal, u.uid),
        ])
      : h("p", { className: empty }, ["Sign in to see your workshop."]),
  );

  return h("div", { className: page }, [
    Header(signal, {}),
    h("div", { className: pageBody }, [content]),
  ]);
};
