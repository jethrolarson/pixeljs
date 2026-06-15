import { onAuthStateChanged, User } from 'firebase/auth'
import { funState, FunState } from '@fun-land/fun-state'
import { auth } from '../firebase'

/**
 * A FunState that tracks the current Firebase Auth user.
 * Watch it to respond to sign-in / sign-out.
 */
export const getUser = (signal: AbortSignal): FunState<User | null> => {
  const userState = funState<User | null>(auth.currentUser)
  const unsubscribe = onAuthStateChanged(auth, (user) => userState.set(user))
  signal.addEventListener('abort', unsubscribe)
  return userState
}
