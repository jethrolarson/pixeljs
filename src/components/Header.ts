import { User } from 'firebase/auth'
import { FunState, FunRead, mapRead } from '@fun-land/fun-state'
import {
  Component,
  h,
  hx,
  bindView,
  bindClass,
  enhance,
  addClass,
} from "@fun-land/fun-web";
import { signIn, signOut_ } from '../auth'
import { btn, btnSecondary } from "../theme.css";
import * as styles from './Header.css'

export interface HeaderProps {
  user: FunState<User | null>
  isMod: FunState<boolean>
}

const path = location.pathname
const isActive = (href: string): boolean =>
  href === '/' ? path === '/' || path === '/index.html' : path === href

export const Header: Component<HeaderProps> = (signal, { user, isMod }) => {
  const notSignedIn = mapRead(user, (u) => u == null)
  const notMod = mapRead(isMod, (m) => !m)

  // Primary destinations: real routes styled as a tab bar (active = current path).
  const tab = (href: string, label: string, hideWhen?: FunRead<boolean>) => {
    const className = isActive(href) ? `${styles.tab} ${styles.tabActive}` : styles.tab
    const el = h('a', { href, className }, [label])
    return hideWhen ? enhance(el, bindClass(styles.hidden, hideWhen, signal)) : el
  }

  const authButton = addClass("display_contents")(
    bindView(signal, user, (regionSignal, u) =>
      hx(
        "button",
        {
          signal: regionSignal,
          props: { className: [btn, btnSecondary].join(" ") },
          on: { click: () => (u ? void signOut_() : void signIn()) },
        },
        [u ? "Sign out" : "Sign in"],
      ),
    ),
  );

  return h("header", { className: styles.headerBar }, [
    h("h1", { className: styles.title }, [
      h(
        "a",
        {
          href: "/",
          className: isActive("/")
            ? `${styles.logoLink} ${styles.logoLinkActive}`
            : styles.logoLink,
        },
        ["PP • WF"],
      ),
    ]),
    h("div", { className: styles.actions }, [
      tab("/browse.html", "Browse"),
      tab("/workshop.html", "Workshop", notSignedIn),
      tab("/admin.html", "Admin", notMod),
      authButton,
    ]),
  ]);
}
