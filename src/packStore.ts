import {
  collection, doc, getDoc, getDocs, setDoc, deleteDoc, updateDoc,
  query, orderBy, where, limit, startAfter, serverTimestamp,
  increment, QueryDocumentSnapshot, DocumentData
} from 'firebase/firestore'
import { db } from './firebase'
import { PackData } from './pack'

const col = collection(db, 'packs')
const PAGE_SIZE = 12

function docToPack(snap: QueryDocumentSnapshot<DocumentData>): PackData {
  const { createdAt, updatedAt, ...rest } = snap.data()
  return { ...rest, id: snap.id } as PackData
}

export async function getFeaturedPacks(): Promise<PackData[]> {
  const q = query(col, where('published', '==', true), where('featured', '==', true), orderBy('featuredOrder', 'asc'))
  const snap = await getDocs(q)
  return snap.docs.map(docToPack)
}

export async function getCommunityPacks(
  sortBy: 'upvotes' | 'createdAt' = 'upvotes',
  after?: QueryDocumentSnapshot<DocumentData>
): Promise<{ packs: PackData[]; lastDoc: QueryDocumentSnapshot<DocumentData> | null }> {
  let q = query(col, where('published', '==', true), orderBy(sortBy, 'desc'), limit(PAGE_SIZE))
  if (after) q = query(q, startAfter(after))
  const snap = await getDocs(q)
  return {
    packs: snap.docs.map(docToPack),
    lastDoc: snap.docs[snap.docs.length - 1] ?? null,
  }
}

export async function getMyPacks(ownerId: string): Promise<PackData[]> {
  const q = query(col, where('ownerId', '==', ownerId), orderBy('updatedAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(docToPack)
}

export async function getPackById(id: string): Promise<PackData | null> {
  const snap = await getDoc(doc(col, id))
  if (!snap.exists()) return null
  return docToPack(snap as QueryDocumentSnapshot<DocumentData>)
}

function stripUndefined(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined))
}

export async function savePack(data: PackData): Promise<PackData> {
  const id = data.id ?? doc(col).id
  const ref = doc(col, id)
  const payload = stripUndefined({
    ...data,
    id,
    updatedAt: serverTimestamp(),
    ...(!data.id ? { createdAt: serverTimestamp() } : {}),
  })
  await setDoc(ref, payload, { merge: true })
  return { ...data, id }
}

export async function deletePack(id: string): Promise<void> {
  await deleteDoc(doc(col, id))
}

export async function upvotePack(packId: string, userId: string): Promise<void> {
  const voteRef = doc(db, 'packs', packId, 'upvotes', userId)
  const existing = await getDoc(voteRef)
  if (existing.exists()) {
    await deleteDoc(voteRef)
    await updateDoc(doc(col, packId), { upvotes: increment(-1) })
  } else {
    await setDoc(voteRef, { at: serverTimestamp() })
    await updateDoc(doc(col, packId), { upvotes: increment(1) })
  }
}

export async function hasUpvoted(packId: string, userId: string): Promise<boolean> {
  const snap = await getDoc(doc(db, 'packs', packId, 'upvotes', userId))
  return snap.exists()
}

// --- Moderator / featuring ---

export async function isModerator(uid: string): Promise<boolean> {
  const snap = await getDoc(doc(db, 'config', 'site'))
  if (!snap.exists()) return false
  const uids = (snap.data().moderatorUids ?? []) as string[]
  return uids.includes(uid)
}

export async function getPublishedPacks(): Promise<PackData[]> {
  const q = query(col, where('published', '==', true), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(docToPack)
}

// Moderator-only: rules permit changing only featured/featuredOrder/updatedAt.
export async function setPackFeatured(
  packId: string, featured: boolean, order: number
): Promise<void> {
  await updateDoc(doc(col, packId), {
    featured,
    featuredOrder: order,
    updatedAt: serverTimestamp(),
  })
}
