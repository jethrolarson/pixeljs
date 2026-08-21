import { User } from 'firebase/auth'
import { funState, FunState, mapRead } from '@fun-land/fun-state'
import { Component, h, hx, enhance, bindView, bindClass, bindProperty } from '@fun-land/fun-web'
import { PackData, PackIcon, PACK_ICON_SIZE, MAX_PACK_LEVELS } from "../pack";
import { Level, LevelData } from "../level";
import { Matrix } from "../matrix";
import { createUi } from "../game/uiState";
import { getPackById, savePack, deletePack } from '../packStore'
import { getLevels } from '../store'
import { getUser } from '../services/getUser'
import { getModerator } from '../services/getModerator'
import { PackCard } from '../components/PackCard'
import { IconEditor } from "../components/IconEditor";
import { Header } from '../components/Header'
import { hidden } from '../components/Header.css'
import { btn, btnDanger, btnPrimary, empty, page, pageBody } from '../theme.css'
import * as styles from './PackEdit.css'

interface PackForm {
  title: string;
  description: string;
  published: boolean;
  levelIds: string[];
}

const inputField: Component<{
  attrs: Record<string, unknown>;
  state: FunState<string>;
}> = (signal, { attrs, state }) =>
  hx("input", {
    signal,
    props: { className: styles.input, type: "text", ...attrs },
    bind: { value: state },
    on: { input: (e) => state.set(e.currentTarget.value) },
  });

const editor = (signal: AbortSignal, user: User): Element => {
  const params = new URLSearchParams(location.search);
  const packId = params.get("id");
  const addLevelId = params.get("add");
  const uid = user.uid;

  let currentId: string | null = packId;
  let currentPack: PackData | null = null;
  let allMyLevels: LevelData[] = [];

  const form = funState<PackForm>({
    title: "",
    description: "",
    published: false,
    levelIds: [],
  });
  const query = funState("");
  const status = funState("");
  const showDelete = funState(false);

  // Not part of `form` — Level isn't FunState-backed — so a loaded icon is
  // applied by mutating these instances in place (applyIcon), not replacing
  // them: IconEditor below is constructed once holding these references.
  const iconLevel = new Level({
    x: PACK_ICON_SIZE,
    y: PACK_ICON_SIZE,
    palette: ["#ffffff"],
  });
  const iconUi = createUi(iconLevel.palette);
  const applyIcon = (icon: PackIcon): void => {
    iconLevel.grid = new Matrix(icon.x, icon.y, icon.game.split(""));
    iconUi.set({ activeColorIndex: 1, palette: [...icon.palette] });
  };

  const buildPack = (): PackData => {
    const f = form.get();
    return {
      id: currentId ?? undefined,
      title: f.title.trim() || "Untitled Pack",
      description: f.description.trim() || undefined,
      ownerId: uid,
      ownerName: currentPack?.ownerName ?? user.displayName ?? "Anonymous",
      levelIds: f.levelIds,
      icon: iconLevel.isEmpty()
        ? null
        : {
            x: iconLevel.x,
            y: iconLevel.y,
            game: iconLevel.getGame(),
            palette: [...iconUi.get().palette],
          },
      published: f.published,
      featured: currentPack?.featured ?? false,
      featuredOrder: currentPack?.featuredOrder,
      upvotes: currentPack?.upvotes ?? 0,
    };
  };

  const persist = async (): Promise<void> => {
    const saved = await savePack(buildPack());
    currentPack = saved;
    currentId = saved.id!;
    showDelete.set(true);
    history.replaceState(null, "", `?id=${currentId}`);
  };

  // --- Form fields ---

  const descField = hx("textarea", {
    signal,
    props: {
      className: styles.textarea,
      placeholder: "A short description…",
      maxLength: 400,
    },
    bind: { value: form.prop("description") },
    on: { input: (e) => form.prop("description").set(e.currentTarget.value) },
  });

  const publishCheck = hx("input", {
    signal,
    props: { type: "checkbox" },
    bind: { checked: form.prop("published") },
    on: { change: (e) => form.prop("published").set(e.currentTarget.checked) },
  });

  // --- Level list (drag to reorder) ---
  let dragIndex = -1;
  // Move the dragged item to just before the drop target; consistent whichever
  // direction you drag.
  const reorder = (from: number, to: number): void => {
    if (from < 0 || from === to) return;
    form.prop("levelIds").mod((arr) => {
      const a = [...arr];
      const [moved] = a.splice(from, 1);
      a.splice(from < to ? to - 1 : to, 0, moved);
      return a;
    });
  };

  const levelList = bindView(signal, form.prop("levelIds"), (s, ids) =>
    ids.length === 0
      ? h("ul", { className: styles.packLevels }, [
          h("li", { className: styles.emptyLevels }, ["No levels added yet."]),
        ])
      : h(
          "ul",
          { className: styles.packLevels },
          ids.map((id, i) => {
            const lvl = allMyLevels.find((l) => l.id === id);
            return hx(
              "li",
              {
                signal: s,
                props: { className: styles.packLevelItem, draggable: true },
                on: {
                  dragstart: (e) => {
                    dragIndex = i;
                    if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
                  },
                  dragover: (e) => e.preventDefault(),
                  drop: (e) => {
                    e.preventDefault();
                    reorder(dragIndex, i);
                    dragIndex = -1;
                  },
                  dragend: () => {
                    dragIndex = -1;
                  },
                },
              },
              [
                h("span", { className: styles.dragHandle }, ["⠿"]),
                h("span", { className: styles.levTitle }, [lvl?.title ?? id]),
                hx(
                  "button",
                  {
                    signal: s,
                    props: { className: styles.editBtn },
                    // Levels only ever save with a pack id, so an unsaved pack
                    // must persist first before edit.html can link back to it.
                    on: {
                      click: async () => {
                        if (!currentId) await persist();
                        location.href = `/edit.html?id=${id}&pack=${currentId}`;
                      },
                    },
                  },
                  ["Edit"],
                ),
                hx(
                  "button",
                  {
                    signal: s,
                    props: { className: styles.removeBtn },
                    on: {
                      click: () =>
                        form
                          .prop("levelIds")
                          .mod((arr) => arr.filter((_, j) => j !== i)),
                    },
                  },
                  ["✕"],
                ),
              ],
            );
          }),
        ),
  );

  // --- Buttons ---
  const saveBtn = hx(
    "button",
    {
      signal,
      props: { className: `${btn} ${btnPrimary}` },
      on: {
        click: async () => {
          status.set("Saving…");
          await persist();
          status.set("Saved!");
          setTimeout(() => status.set(""), 2000);
        },
      },
    },
    ["Save"],
  );
  const newLevelBtn = hx(
    "button",
    {
      signal,
      props: { className: btn },
      on: {
        click: async () => {
          if (form.get().levelIds.length >= MAX_PACK_LEVELS) {
            status.set(`Pack is full (${MAX_PACK_LEVELS} max).`);
            return;
          }
          status.set("Saving pack…");
          await persist();
          location.href = `/edit.html?pack=${currentId}`;
        },
      },
    },
    ["+ Create new level"],
  );
  const deleteBtn = enhance(
    hx(
      "button",
      {
        signal,
        props: { className: `${btn} ${btnDanger}` },
        on: {
          click: async () => {
            if (currentId && confirm("Delete this pack?")) {
              await deletePack(currentId);
              location.href = "/browse.html";
            }
          },
        },
      },
      ["Delete"],
    ),
    bindClass(
      hidden,
      mapRead(showDelete, (v) => !v),
      signal,
    ),
  );
  const statusEl = enhance(
    h("span", { className: styles.status }, []),
    bindProperty("textContent", status, signal),
  );

  // --- Icon editor ---
  // The preview only watches `form`, so a no-op `mod` forces it to re-render
  // with the icon's latest painted state after each stroke/palette edit.
  const iconEditor = IconEditor(signal, {
    level: iconLevel,
    ui: iconUi,
    onChange: () => form.mod((f) => ({ ...f })),
  });

  // --- Preview ---
  const preview = bindView(signal, form, (s) =>
    PackCard(s, { pack: buildPack() }),
  );

  // --- Async load ---
  (async () => {
    allMyLevels = (await getLevels()).filter((l) => l.ownerId === uid);
    if (packId) {
      let pack: PackData | null;
      try {
        pack = await getPackById(packId);
      } catch (e) {
        console.error(e);
        status.set("Failed to load pack.");
        return;
      }
      if (pack && pack.ownerId !== uid) {
        status.set("You do not own this pack.");
        return;
      }
      if (pack) {
        currentPack = pack;
        if (pack.icon) applyIcon(pack.icon);
        form.set({
          title: pack.title,
          description: pack.description ?? "",
          published: pack.published,
          levelIds: [...pack.levelIds],
        });
        showDelete.set(true);
      }
    }
    if (
      addLevelId &&
      !form.get().levelIds.includes(addLevelId) &&
      form.get().levelIds.length < MAX_PACK_LEVELS
    ) {
      form.prop("levelIds").mod((ids) => [...ids, addLevelId]);
      await persist();
    }
    history.replaceState(
      null,
      "",
      currentId ? `?id=${currentId}` : location.pathname,
    );
  })().catch(console.error);

  const group = (labelText: string, ...children: Element[]) =>
    h("div", { className: styles.formGroup }, [
      h("label", { className: styles.label }, [labelText]),
      ...children,
    ]);

  return h("div", { className: styles.layout }, [
    h("div", { className: styles.form }, [
      group(
        "Title",
        inputField(signal, {
          state: form.prop("title"),
          attrs: { placeholder: "My awesome pack", maxLength: 80 },
        }),
      ),
      group("Description", descField),
      group("Icon (paint the pack cover)", iconEditor),
      h("div", { className: styles.formGroup }, [
        h("div", { className: styles.publishRow }, [
          publishCheck,
          h("label", { className: styles.publishLabel }, [
            "Published (visible to others)",
          ]),
        ]),
      ]),
      bindView(signal, form.prop("levelIds"), (_s, ids) =>
        h("h3", { className: styles.heading }, [
          `Levels  ${ids.length} / ${MAX_PACK_LEVELS}`,
        ]),
      ),
      levelList,
      h("div", { className: styles.formGroup }, [newLevelBtn]),
      h("div", { className: styles.formActions }, [
        saveBtn,
        deleteBtn,
        statusEl,
      ]),
    ]),
    h("div", { className: styles.previewCol }, [
      h("div", { className: styles.previewLabel }, ["Preview"]),
      preview,
    ]),
  ]);
};

export const PackEdit: Component = (signal) => {
  const user = getUser(signal)
  const uid = mapRead(user, (u) => u?.uid ?? null)
  const isMod = getModerator(signal, uid)

  const slot = h('div', {})
  let started = false
  user.watch(signal, (u) => {
    if (u && !started) {
      started = true
      slot.replaceChildren(editor(signal, u))
    } else if (!u && !started) {
      slot.replaceChildren(h('p', { className: empty }, ['Sign in to create packs.']))
    }
  })

  return h('div', { className: page }, [Header(signal, { user, isMod }), h('div', { className: pageBody }, [slot])])
}
