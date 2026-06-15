import { FunState } from '@fun-land/fun-state'
import { h, bindView } from '@fun-land/fun-web'
import { empty } from '../theme.css'

export type Loadable<T> = { status: 'loading' } | { status: 'error' } | { status: 'ok'; value: T }

export const loading = <T>(): Loadable<T> => ({ status: 'loading' })

/** Resolve a promise into a Loadable state slot. */
export const loadInto = <T>(state: FunState<Loadable<T>>, p: Promise<T>): void => {
  p.then((value) => state.set({ status: 'ok', value })).catch((e) => {
    console.error(e)
    state.set({ status: 'error' })
  })
}

/** Render a Loadable: loading / error placeholders, or the success view. */
export const bindLoadable = <T>(
  signal: AbortSignal,
  state: FunState<Loadable<T>>,
  render: (regionSignal: AbortSignal, value: T) => Element,
  opts?: { errorMsg?: string },
): Element =>
  bindView(signal, state, (regionSignal, s) =>
    s.status === 'loading'
      ? h('p', { className: empty }, ['Loading…'])
      : s.status === 'error'
        ? h('p', { className: empty }, [opts?.errorMsg ?? 'Failed to load.'])
        : render(regionSignal, s.value),
  )
