import { funState, FunState, FunRead } from '@fun-land/fun-state'
import { isModerator } from '../packStore'

/**
 * A FunState<boolean> that resolves to whether the given uid is a moderator.
 * Re-resolves whenever uidState changes (including to null → false).
 */
export const getModerator = (signal: AbortSignal, uidState: FunRead<string | null>): FunState<boolean> => {
  const isMod = funState(false)
  uidState.watch(signal, (uid) => {
    if (!uid) {
      isMod.set(false)
      return
    }
    isModerator(uid)
      .then((m) => isMod.set(m))
      .catch((e) => {
        console.error(e)
        isMod.set(false)
      })
  })
  return isMod
}
