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

export const Header: Component<HeaderProps> = (signal, { user, isMod }) => {
  const notSignedIn = mapRead(user, (u) => u == null)
  const notMod = mapRead(isMod, (m) => !m)

  const link = (href: string, label: string, hideWhen?: FunRead<boolean>) => {
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
      link('/browse.html', 'Browse'),
      link('/levels.html', 'My Levels', notSignedIn),
      link('/admin.html', 'Admin', notMod),
      link('/pack-edit.html', '+ New Pack', notSignedIn),
      authButton,
    ]),
  ])
}
