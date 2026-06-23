import { User } from 'firebase/auth'
import { FunState, FunRead, mapRead } from '@fun-land/fun-state'
import { Component, h, hx, bindView, bindClass, enhance } from '@fun-land/fun-web'
import { signIn, signOut_ } from '../auth'
import { btn, headerBar } from '../theme.css'
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

  // Secondary actions (button-styled).
  const action = (href: string, label: string, hideWhen?: FunRead<boolean>) => {
    const el = h('a', { href, className: btn }, [label])
    return hideWhen ? enhance(el, bindClass(styles.hidden, hideWhen, signal)) : el
  }

  const authButton = bindView(signal, user, (regionSignal, u) =>
    hx(
      'button',
      { signal: regionSignal, props: { className: btn }, on: { click: () => (u ? void signOut_() : void signIn()) } },
      [u ? 'Sign out' : 'Sign in'],
    ),
  )

  return h('header', { className: headerBar }, [
    h('h1', { className: styles.title }, [h('a', { href: '/' }, ['Pixel Puzzle'])]),
    h('div', { className: styles.actions }, [
      tab('/', 'Home'),
      tab('/browse.html', 'Browse'),
      tab('/workshop.html', 'Workshop', notSignedIn),
      action('/admin.html', 'Admin', notMod),
      authButton,
    ]),
  ])
}
