import {
  Component,
  h,
  hx,
  bindView,
  enhance,
  attrs,
  addClass,
} from "@fun-land/fun-web";
import { signIn } from "../auth";
import { renderPixelIcon } from "./PixelIcon";
import { btn, btnSecondary } from "../theme.css";
import { mapRead } from "@fun-land/fun-state";
import * as styles from "./ProfileLink.css";
import { getProfileState } from "../services/getProfileState";
import { getIdentity } from "../services/getIdentity";

export const ProfileLink: Component = (signal) => {
  const identity = getIdentity(signal);
  const profile = getProfileState(
    signal,
    mapRead(identity, (i) => i?.uid ?? null),
  );
  return bindView(signal, identity, (regionSignal, id) => {
    if (id == null)
      return hx(
        "button",
        {
          signal: regionSignal,
          props: { className: `${btn} ${btnSecondary}` },
          on: { click: () => void signIn() },
        },
        ["Sign in"],
      );
    const className =
      location.pathname === "/profile.html"
        ? `${styles.profileLink} ${styles.profileLinkActive}`
        : styles.profileLink;
    return enhance(
      bindView(
        regionSignal,
        profile,
        (_s, p) =>
          enhance(
            // 32px is 2x the icon size of 16px
            p?.icon ? renderPixelIcon(p.icon, 32) : h("span", {}, "@"),
            addClass(styles.profileIcon),
          ),

        { tagName: "a" },
      ),
      attrs({ href: "/profile.html", className }),
    );
  });
};
