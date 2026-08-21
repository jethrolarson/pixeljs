import { Component, h, bindView } from '@fun-land/fun-web'
import { toastState } from '../toast'
import * as styles from './ToastHost.css'

/** Renders the current toast stack. Mount once per page; `showToast` (from
 * `services/toast`) can be called from anywhere once this is on screen. */
export const ToastHost: Component = (signal) =>
  bindView(signal, toastState, (_s, list) =>
    h(
      'div',
      { className: styles.host },
      list.map((t) => h('div', { className: `${styles.toast} ${t.kind === 'error' ? styles.error : styles.info}` }, [t.message])),
    ),
  )
