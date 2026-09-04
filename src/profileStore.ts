import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore/lite'
import { db } from './firebase'
import { PackIcon } from './pack'

/** A user's public identity: the name and 16×16 pixel avatar shown on the menu
 * and as pack attribution. `icon` reuses `PackIcon` — same small paintable grid,
 * authored with the same `IconEditor`. */
export interface UserProfile {
  displayName: string
  icon: PackIcon | null
}

export const MAX_DISPLAY_NAME = 40

const ref = (uid: string) => doc(db, 'users', uid)

export async function getProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(ref(uid))
  if (!snap.exists()) return null
  const data = snap.data()
  return { displayName: data.displayName ?? '', icon: data.icon ?? null }
}

export async function saveProfile(uid: string, profile: UserProfile): Promise<void> {
  await setDoc(
    ref(uid),
    {
      displayName: profile.displayName.trim().slice(0, MAX_DISPLAY_NAME),
      icon: profile.icon,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}
