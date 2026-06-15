import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth'
import { auth } from './firebase'

const provider = new GoogleAuthProvider()

export function signIn(): Promise<void> {
  return signInWithPopup(auth, provider).then(() => {})
}

export function signOut_(): Promise<void> {
  return signOut(auth)
}

export function onAuth(cb: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, cb)
}

export function currentUser(): User | null {
  return auth.currentUser
}
