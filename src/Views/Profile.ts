import { User, updateProfile } from "firebase/auth";
import { funState, mapRead } from "@fun-land/fun-state";
import {
  Component,
  h,
  hx,
  enhance,
  bindClass,
  bindProperty,
  bindView,
} from "@fun-land/fun-web";
import { Matrix } from "../matrix";
import { Level } from "../level";
import { createUi } from "../game/uiState";
import { PackIcon, PACK_ICON_SIZE } from "../pack";
import {
  UserProfile,
  MAX_DISPLAY_NAME,
  getProfile,
  saveProfile,
} from "../profileStore";
import { isModerator } from "../packStore";
import { getUser } from "../services/getUser";
import { writeIdentityCache, writeProfileCache } from "../authCache";
import { signOut_ } from "../auth";
import { Header } from "../components/Header";
import { IconEditor } from "../components/IconEditor";
import { renderPixelIcon } from "../components/PixelIcon";
import { hidden } from "../components/Header.css";
import {
  btn,
  btnDanger,
  btnPrimary,
  btnSecondary,
  empty,
  page,
  pageBody,
} from "../theme.css";
import * as styles from "./Profile.css";

const editor = (signal: AbortSignal, user: User): Element => {
  const uid = user.uid;
  const name = funState(user.displayName ?? "");
  const status = funState("");
  const isMod = funState(false);
  isModerator(uid).then(isMod.set).catch(console.error);

  // Level isn't FunState-backed, so a loaded icon is applied by mutating this
  // instance in place (applyIcon) — IconEditor below holds the reference.
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
  const buildIcon = (): PackIcon | null =>
    iconLevel.isEmpty()
      ? null
      : {
          x: iconLevel.x,
          y: iconLevel.y,
          game: iconLevel.getGame(),
          palette: [...iconUi.get().palette],
        };

  // Bumped after each stroke/palette edit to re-render the trigger preview,
  // which has no other state to watch.
  const iconTick = funState(0);
  const iconEditor = IconEditor(signal, {
    level: iconLevel,
    ui: iconUi,
    onChange: () => iconTick.mod((n) => n + 1),
  });

  const iconModalOpen = funState(false);
  const iconTrigger = hx(
    "button",
    {
      signal,
      props: { className: styles.iconTrigger, type: "button" },
      on: { click: () => iconModalOpen.set(true) },
    },
    [bindView(signal, iconTick, () => renderPixelIcon(buildIcon(), 48))],
  );
  const iconModal = enhance(
    h("div", { className: styles.iconModal }, [
      h("div", { className: styles.iconModalHeader }, [
        h("span", { className: styles.label }, ["Icon"]),
        hx(
          "button",
          {
            signal,
            props: { type: "button" },
            on: { click: () => iconModalOpen.set(false) },
          },
          ["Done"],
        ),
      ]),
      h("div", { className: styles.iconModalBody }, [iconEditor]),
    ]),
    bindClass(
      styles.iconModalHidden,
      mapRead(iconModalOpen, (v) => !v),
      signal,
    ),
  );

  const nameInput = hx("input", {
    signal,
    props: {
      className: styles.input,
      type: "text",
      placeholder: "Your name",
      maxLength: MAX_DISPLAY_NAME,
    },
    bind: { value: name },
    on: { input: (e) => name.set(e.currentTarget.value) },
  });

  // Auth `displayName` mirrors the profile so `ownerName` (PackEdit) stays in
  // step; both caches are refreshed so the next navigation renders it without a
  // round-trip.
  const persist = async (): Promise<void> => {
    const profile: UserProfile = {
      displayName: name.get().trim(),
      icon: buildIcon(),
    };
    await saveProfile(uid, profile);
    await updateProfile(user, { displayName: profile.displayName || null });
    writeProfileCache(uid, profile);
    writeIdentityCache({ uid, displayName: profile.displayName || null });
  };

  const saveBtn = hx(
    "button",
    {
      signal,
      props: { className: `${btn} ${btnPrimary}` },
      on: {
        click: async () => {
          status.set("Saving…");
          try {
            await persist();
            status.set("Saved!");
            setTimeout(() => status.set(""), 2000);
          } catch (e) {
            console.error(e);
            status.set("Failed to save.");
          }
        },
      },
    },
    ["Save"],
  );
  const statusEl = enhance(
    h("span", { className: styles.status }, []),
    bindProperty("textContent", status, signal),
  );

  const signOutBtn = hx(
    "button",
    {
      signal,
      props: { className: `${btn} ${btnSecondary}` },
      on: {
        click: async () => {
          await signOut_();
          location.href = "/";
        },
      },
    },
    ["Sign out"],
  );
  const adminLink = enhance(
    h("a", { href: "/admin.html", className: `${btn} ${btnDanger}` }, [
      "Admin",
    ]),
    bindClass(
      hidden,
      mapRead(isMod, (m) => !m),
      signal,
    ),
  );

  (async () => {
    try {
      const existing = await getProfile(uid);
      if (existing) {
        if (existing.displayName) name.set(existing.displayName);
        if (existing.icon) {
          applyIcon(existing.icon);
          iconTick.mod((n) => n + 1);
        }
      }
    } catch (e) {
      console.error(e);
    }
  })().catch(console.error);

  const group = (labelText: string, ...children: Element[]) =>
    h("div", { className: styles.formGroup }, [
      h("label", { className: styles.label }, [labelText]),
      ...children,
    ]);

  return h("div", { className: styles.layout }, [
    group("Display name", nameInput),
    group("Icon", iconTrigger),
    h("div", { className: styles.formActions }, [saveBtn, statusEl]),
    h("div", { className: styles.accountRow }, [signOutBtn, adminLink]),
    iconModal,
  ]);
};

export const Profile: Component = (signal) => {
  const user = getUser(signal);

  const slot = h("div", {});
  let started = false;
  user.watch(signal, (u) => {
    if (u && !started) {
      started = true;
      slot.replaceChildren(editor(signal, u));
    } else if (!u && !started) {
      slot.replaceChildren(
        h("p", { className: empty }, ["Sign in to edit your profile."]),
      );
    }
  });

  return h("div", { className: page }, [
    Header(signal, {}),
    h("div", { className: pageBody }, [slot]),
  ]);
};
