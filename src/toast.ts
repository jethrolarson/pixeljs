import { funState, FunState } from '@fun-land/fun-state'

export interface Toast {
  id: number
  message: string
  kind: 'info' | 'error'
}

// Module-level singleton: toasts are triggered from anywhere (event handlers,
// async flows) with no component to thread state through, and there's only
// ever one toast stack per page.
const toasts: FunState<Toast[]> = funState<Toast[]>([])
let nextId = 0

export const toastState: FunState<Toast[]> = toasts

export const dismissToast = (id: number): void => {
  toasts.mod((ts) => ts.filter((t) => t.id !== id))
}

/** Show a toast; it auto-dismisses after `durationMs` (default 2500ms). */
export const showToast = (message: string, kind: Toast['kind'] = 'info', durationMs = 2500): void => {
  const id = ++nextId
  toasts.mod((ts) => [...ts, { id, message, kind }])
  setTimeout(() => dismissToast(id), durationMs)
}
