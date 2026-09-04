import { onAuthStateChanged, User } from 'firebase/auth'
import { funState, FunState } from '@fun-land/fun-state'
import { auth } from '../firebase'
import { Identity, readIdentityCache, writeIdentityCache } from '../authCache'

const toIdentity = (user: User | null): Identity | null =>
  user ? { uid: user.uid, displayName: user.displayName } : null

/**
 * Current identity for chrome that must render before Firebase Auth resolves
 * (the Header). Seeded synchronously from the session cache so page-to-page
 * navigation doesn't flash signed-out; `onAuthStateChanged` then corrects a
 * stale seed (e.g. an expired token) and refreshes the cache.
 *
 * For a real `User` (page bodies that need `uid` for reads/writes) use
 * `getUser` — a fabricated `User` isn't possible from the cache.
 */
export const getIdentity = (signal: AbortSignal): FunState<Identity | null> => {
  const state = funState<Identity | null>(readIdentityCache())
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    const identity = toIdentity(user)
    state.set(identity)
    writeIdentityCache(identity)
  })
  signal.addEventListener('abort', unsubscribe)
  return state
}
