import {
  collection, doc, getDoc, getDocs, setDoc, deleteDoc,
  query, orderBy, serverTimestamp, Timestamp
} from 'firebase/firestore'
import { db } from './firebase'
import { LevelData } from './level'

const col = collection(db, 'levels')

function docToLevel(id: string, data: Record<string, unknown>): LevelData {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { createdAt, updatedAt, ownerId, ...rest } = data
  return { ...rest, id } as LevelData
}

export async function getLevels(): Promise<LevelData[]> {
  const snap = await getDocs(query(col, orderBy('updatedAt', 'desc')))
  return snap.docs.map(d => docToLevel(d.id, d.data()))
}

export async function getLevelById(id: string): Promise<LevelData | null> {
  const snap = await getDoc(doc(col, id))
  if (!snap.exists()) return null
  return docToLevel(snap.id, snap.data())
}

function stripUndefined(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined))
}

export async function saveLevel(data: LevelData, ownerId: string): Promise<LevelData> {
  const id = data.id ?? doc(col).id
  const ref = doc(col, id)
  const payload = stripUndefined({
    ...data,
    id,
    ownerId,
    updatedAt: serverTimestamp(),
    ...(!data.id ? { createdAt: serverTimestamp() } : {}),
  })
  await setDoc(ref, payload, { merge: true })
  return { ...data, id }
}

export async function deleteLevel(id: string): Promise<void> {
  await deleteDoc(doc(col, id))
}
