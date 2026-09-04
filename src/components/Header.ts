import { FunRead, mapRead } from "@fun-land/fun-state";
import { Component, h, bindClass, enhance } from "@fun-land/fun-web";
import * as styles from "./Header.css";
import { ProfileLink } from "./ProfileLink";
import { getIdentity } from "../services/getIdentity";

const path = location.pathname;
const isActive = (href: string): boolean =>
  href === "/" ? path === "/" || path === "/index.html" : path === href;

export const Header: Component = (signal) => {
  const identity = getIdentity(signal);
  const notSignedIn = mapRead(identity, (i) => i == null);

  // Primary destinations: real routes styled as a tab bar (active = current path).
  const tab = (href: string, label: string, hideWhen?: FunRead<boolean>) => {
    const className = isActive(href)
      ? `${styles.tab} ${styles.tabActive}`
      : styles.tab;
    const el = h("a", { href, className }, [label]);
    return hideWhen
      ? enhance(el, bindClass(styles.hidden, hideWhen, signal))
      : el;
  };

  return h("header", { className: styles.headerBar }, [
    h("div", { className: styles.header }, [
      h("h1", { className: styles.title }, [
        h(
          "a",
          {
            href: "/",
            className: isActive("/")
              ? `${styles.logoLink} ${styles.logoLinkActive}`
              : styles.logoLink,
          },
          ["PP ~ WF"],
        ),
      ]),
      h("div", { className: styles.actions }, [
        tab("/browse.html", "Packs"),
        tab("/workshop.html", "Create", notSignedIn),
        ProfileLink(signal, {}),
      ]),
    ]),
  ]);
};
