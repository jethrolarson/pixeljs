import { after, before, beforeEach, test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing'
import {
  deleteDoc,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'

const projectId = 'pixeljs-rules-test'
let testEnv

const pack = (ownerId = 'owner') => ({
  id: 'pack-1',
  title: 'Pack',
  ownerId,
  ownerName: 'Owner',
  levelIds: [],
  icon: null,
  published: false,
  featured: false,
  upvotes: 0,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
})

const dbFor = (uid) => uid
  ? testEnv.authenticatedContext(uid).firestore()
  : testEnv.unauthenticatedContext().firestore()

const seed = async (path, data) => testEnv.withSecurityRulesDisabled(async (context) =>
  setDoc(doc(context.firestore(), path), data),
)

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId,
    firestore: { rules: await readFile('firestore.rules', 'utf8') },
  })
})

beforeEach(async () => {
  await testEnv.clearFirestore()
  await seed('config/site', { moderatorUids: ['moderator'] })
})

after(async () => testEnv.cleanup())

test('pack creation requires authentication and request ownership', async () => {
  await assertFails(setDoc(doc(dbFor(), 'packs/pack-1'), pack()))
  await assertFails(setDoc(doc(dbFor('attacker'), 'packs/pack-1'), pack('victim')))
  await assertSucceeds(setDoc(doc(dbFor('owner'), 'packs/pack-1'), pack()))
})

test('pack creation rejects client-selected privileged and aggregate values', async () => {
  await assertFails(setDoc(doc(dbFor('owner'), 'packs/pack-1'), { ...pack(), featured: true }))
  await assertFails(setDoc(doc(dbFor('owner'), 'packs/pack-1'), { ...pack(), upvotes: 10 }))
  await assertFails(setDoc(doc(dbFor('owner'), 'packs/other-id'), pack()))
})

test('owners can edit content but cannot change ownership or privileged fields', async () => {
  await seed('packs/pack-1', { ...pack(), createdAt: new Date(), updatedAt: new Date() })
  const ref = doc(dbFor('owner'), 'packs/pack-1')

  await assertSucceeds(updateDoc(ref, { title: 'Edited', updatedAt: serverTimestamp() }))
  await assertFails(updateDoc(ref, { ownerId: 'attacker', updatedAt: serverTimestamp() }))
  await assertFails(updateDoc(ref, { featured: true, updatedAt: serverTimestamp() }))
  await assertFails(updateDoc(ref, { featuredOrder: 1, updatedAt: serverTimestamp() }))
  await assertFails(updateDoc(ref, { upvotes: 1, updatedAt: serverTimestamp() }))
})

test('moderators can feature and delete packs but cannot edit owner content', async () => {
  await seed('packs/pack-1', { ...pack(), createdAt: new Date(), updatedAt: new Date() })
  const ref = doc(dbFor('moderator'), 'packs/pack-1')

  await assertSucceeds(updateDoc(ref, { featured: true, featuredOrder: 2, updatedAt: serverTimestamp() }))
  await assertFails(updateDoc(ref, { title: 'Moderator rewrite', updatedAt: serverTimestamp() }))
  await assertSucceeds(deleteDoc(ref))
})

test('all direct nested vote writes are denied, including a user own vote', async () => {
  await seed('packs/pack-1', { ...pack(), published: true, createdAt: new Date(), updatedAt: new Date() })
  const voteRef = doc(dbFor('voter'), 'packs/pack-1/upvotes/voter')

  await assertFails(setDoc(voteRef, { at: serverTimestamp() }))
  await seed('packs/pack-1/upvotes/voter', { at: new Date() })
  await assertFails(updateDoc(voteRef, { at: serverTimestamp() }))
  await assertFails(deleteDoc(voteRef))
})

test('owners and moderators retain pack deletion behavior', async () => {
  await seed('packs/owner-pack', { ...pack(), id: 'owner-pack', createdAt: new Date(), updatedAt: new Date() })
  await seed('packs/mod-pack', { ...pack(), id: 'mod-pack', createdAt: new Date(), updatedAt: new Date() })

  await assertSucceeds(deleteDoc(doc(dbFor('owner'), 'packs/owner-pack')))
  await assertSucceeds(deleteDoc(doc(dbFor('moderator'), 'packs/mod-pack')))
})
