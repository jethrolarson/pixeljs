import { funState, FunState, mapRead } from '@fun-land/fun-state'
import { hx, enhance, bindClass } from '@fun-land/fun-web'
import { btn } from '../theme.css'
import { voted as votedClass } from './PackCard.css'

export interface UpvoteConfig {
  initialCount: number
  /** Whether the current user has upvoted (owned by caller, may resolve async). */
  voted: FunState<boolean>
  signedIn: boolean
  /** Perform the real Firestore toggle. */
  toggle: () => Promise<void>
  requireSignIn: () => void
}

export const upvoteButton = (signal: AbortSignal, cfg: UpvoteConfig): Element => {
  const count = funState(cfg.initialCount)

  const onClick = async (): Promise<void> => {
    if (!cfg.signedIn) {
      cfg.requireSignIn()
      return
    }
    const next = !cfg.voted.get()
    cfg.voted.set(next)
    count.mod((c) => c + (next ? 1 : -1))
    try {
      await cfg.toggle()
    } catch (e) {
      console.error(e)
      cfg.voted.set(!next)
      count.mod((c) => c + (next ? -1 : 1))
    }
  }

  const button = hx(
    'button',
    {
      signal,
      props: { className: btn },
      bind: { textContent: mapRead(count, (c) => `▲ ${c}`) },
      on: { click: onClick },
    },
    [],
  )
  return enhance(button, bindClass(votedClass, cfg.voted, signal))
}
