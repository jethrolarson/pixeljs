import { funState, FunState, FunRead } from '@fun-land/fun-state'
import { UserProfile, getProfile } from '../profileStore'
import { readProfileCache, writeProfileCache } from '../authCache'

/**
 * Profile for the given uid, seeded from the session cache so the Header avatar
 * paints immediately on navigation; the Firestore read then reconciles and
 * refreshes the cache. Null uid (signed out) → null.
 */
export const getProfileState = (
  signal: AbortSignal,
  uidState: FunRead<string | null>,
): FunState<UserProfile | null> => {
  const state = funState<UserProfile | null>(null)
  uidState.watch(signal, (uid) => {
    if (!uid) {
      state.set(null)
      return
    }
    state.set(readProfileCache(uid))
    getProfile(uid)
      .then((profile) => {
        state.set(profile)
        if (profile) writeProfileCache(uid, profile)
      })
      .catch((e) => console.error(e))
  })
  return state
}
