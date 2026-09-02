import {
  collection, doc, getDoc, getDocs, setDoc, deleteDoc,
  query, orderBy, serverTimestamp, Timestamp
} from 'firebase/firestore'
import { db } from './firebase'
import { LevelData, validateLevelData } from './level'

const col = collection(db, 'levels')

function docToLevel(id: string, data: Record<string, unknown>): LevelData {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { createdAt, updatedAt, ...rest } = data
  const level = { ...rest, id } as LevelData
  validateLevelData(level)
  return level
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
  validateLevelData(data)
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

export async function markLevelSolved(levelId: string, userId: string): Promise<void> {
  await setDoc(doc(db, 'levels', levelId, 'solves', userId), { at: serverTimestamp() })
}

export async function getSolvedLevelIds(levelIds: string[], userId: string): Promise<Set<string>> {
  const hits = await Promise.all(
    levelIds.map((id) => getDoc(doc(db, 'levels', id, 'solves', userId)).then((snap) => (snap.exists() ? id : null))),
  )
  return new Set(hits.filter((id): id is string => id !== null))
}
