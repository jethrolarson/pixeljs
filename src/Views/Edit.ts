import { FunState, funState } from "@fun-land/fun-state";
import { Component, h, hx } from "@fun-land/fun-web";
import { Level, LevelData } from "../level";
import { getLevelById, saveLevel } from "../store";
import { getUser } from "../services/getUser";
import { signIn, currentUser } from "../auth";
import { createGameLoop, createAssets } from "../game/loop";
import { createUi, Ui } from "../game/uiState";
import { createArtAuthoring } from "../game/artAuthoring";
import { Palette } from "../components/Palette";
import { ArtControls } from "../components/ArtControls";
import { NumField } from "../components/NumField";
import { termBtn } from "./canvasPage.css";
import * as styles from "./canvasPage.css";
import * as edit from "./Edit.css";

const defaultLevel: LevelData = {
  title: "New Level",
  x: 10,
  y: 10,
  game: "0".repeat(100),
  palette: ["#0000ff"],
  par: 3,
};

const levelToData = (level: Level, ui: FunState<Ui>): LevelData => ({
  title: level.title,
  x: level.x,
  y: level.y,
  game: level.getGame(),
  palette: [...ui.get().palette],
  par: level.par,
  levelSetName: level.levelSetName,
});

export const Edit: Component = (signal) => {
  const canvas = h("canvas", { id: "canvas", className: styles.canvas });
  const menuSlot = h("div", { className: styles.menu }, []);
  const paletteSlot = h("div", {}, []);

  const params = new URLSearchParams(location.search);
  let currentId: string | null = params.get("id");
  const returnPackId = params.get("pack");
  const user = getUser(signal);

  (async () => {
    const data =
      (currentId ? await getLevelById(currentId) : null) ?? defaultLevel;
    const level = new Level(data);
    document.title = level.title;

    const ui = createUi(level.palette);
    const mute = funState(false);
    const assets = createAssets();
    const art = createArtAuthoring(level, ui, data.art);

    // Each editing target (puzzle vs. art) runs its own loop under a child signal,
    // so swapping tears the previous one's listeners down.
    let loopCtl: AbortController | null = null;
    signal.addEventListener("abort", () => loopCtl?.abort());
    const mountLoop = (): void => {
      // Abort the previous mount's signal before building the next one — hx's
      // `on:` handlers are registered with `{ signal }`, so this is what
      // unregisters the old game loop's and Palette's listeners before
      // paletteSlot.replaceChildren() swaps the DOM. Reordering this would
      // leak listeners on every target/scale toggle.
      loopCtl?.abort();
      loopCtl = new AbortController();
      const s = loopCtl.signal;
      const onArt = art.target === "art";
      const activeUi = onArt ? art.ui : ui;
      const activeLevel = onArt ? art.level : level;
      createGameLoop({
        canvas,
        level: activeLevel,
        mode: "edit",
        getActiveColor: () => activeUi.get().activeColorIndex,
        getMute: () => mute.get(),
        getPalette: () => activeUi.get().palette,
        assets,
        underlay: onArt ? { level, scale: art.scale } : undefined,
        signal: s,
      }).start();
      paletteSlot.replaceChildren(
        Palette(s, {
          ui: activeUi,
          mode: "edit",
          onRemoveColor: (i) => activeLevel.removeColor(i),
        }),
      );
    };
    mountLoop();

    const setCols = (n: number): void => {
      const d = n - level.x;
      if (d > 0) level.addCols(d);
      else if (d < 0) level.subtractCols(-d);
      art.resize(d, 0);
    };
    const setRows = (n: number): void => {
      const d = n - level.y;
      if (d > 0) level.addRows(d);
      else if (d < 0) level.subtractRows(-d);
      art.resize(0, d);
    };

    // Persist the current edits and return the level id (null if not signed in).
    const persist = async (): Promise<string | null> => {
      const u = currentUser();
      if (!u) {
        signIn();
        return null;
      }
      const saved = await saveLevel(
        {
          ...levelToData(level, ui),
          id: currentId ?? undefined,
          art: art.toSaveData(),
        },
        u.uid,
      );
      currentId = saved.id!;
      document.title = saved.title ?? "Edit Level";
      history.replaceState(null, "", `?id=${currentId}`);
      return currentId;
    };

    const onSave = async (): Promise<void> => {
      const id = await persist();
      if (id && returnPackId)
        location.href = `/pack-edit.html?id=${returnPackId}&add=${id}`;
    };

    // Test plays the level you're editing — save first so nothing is lost and
    // play loads the current state by id.
    const onTest = async (): Promise<void> => {
      const id = await persist();
      if (id) location.href = `/play.html?id=${id}`;
    };

    const titleInput = hx("input", {
      signal,
      props: {
        type: "text",
        value: level.title,
        placeholder: "title",
        className: edit.titleInput,
      },
      on: {
        input: (e) => {
          level.title = e.currentTarget.value;
          document.title = e.currentTarget.value;
        },
      },
    });
    const xInput = NumField(signal, { min: 3, max: 32, value: { get: () => level.x, set: setCols } });
    const yInput = NumField(signal, { min: 3, max: 32, value: { get: () => level.y, set: setRows } });

    const parField = h("div", { className: styles.field }, [
      h("label", { className: edit.label }, ["Par "]),
      NumField(signal, {
        min: 1,
        max: 10,
        value: {
          get: () => level.par,
          set: (n) => {
            level.par = n;
          },
        },
      }),
    ]);

    const muteField = h("label", { className: edit.muteRow }, [
      hx("input", {
        signal,
        props: { type: "checkbox" },
        on: { change: (e) => mute.set(e.currentTarget.checked) },
      }),
      " Mute",
    ]);

    const saveBtn = hx(
      "button",
      {
        signal,
        props: { type: "button", className: termBtn },
        on: { click: onSave },
      },
      ["Save"],
    );
    const testBtn = hx(
      "a",
      {
        signal,
        props: { href: "#", className: edit.testLink },
        on: {
          click: (e) => {
            e.preventDefault();
            void onTest();
          },
        },
      },
      ["Test"],
    );
    const signinMsg = h("p", { className: edit.signinMsg }, [
      "Sign in to save",
    ]);

    const backHref = returnPackId
      ? `/pack-edit.html?id=${returnPackId}`
      : "/workshop.html";
    const backLabel = returnPackId ? "← Back to pack" : "← Workshop";

    menuSlot.replaceChildren(
      h("a", { href: backHref, className: styles.backLink }, [backLabel]),
      h("div", { className: styles.field }, [titleInput]),
      h("div", { className: styles.field }, [
        h("label", { className: edit.label }, [xInput, " X "]),
        yInput,
      ]),
      parField,
      muteField,
      ArtControls(signal, { art, onChange: mountLoop }),
      h("div", { className: styles.field }, [saveBtn, testBtn]),
      signinMsg,
    );

    user.watch(signal, (u) => {
      saveBtn.style.display = u ? "" : "none";
      testBtn.style.display = u ? "" : "none";
      signinMsg.style.display = u ? "none" : "";
    });
  })().catch(console.error);

  return h("div", {}, [menuSlot, paletteSlot, canvas]);
};
