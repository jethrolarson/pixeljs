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

const level = (overrides = {}) => ({
  title: 'Level',
  ownerId: 'owner',
  x: 2,
  y: 2,
  game: '0120',
  palette: ['#000000', '#ffffff'],
  art: null,
  ...overrides,
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

test('level encoding accepts palette indices 1–9 and valid mixed-case colors', async () => {
  const palette = Array.from({ length: 9 }, (_, i) => `#00000${i}`)
  palette[8] = '#Aa00Ff'
  await assertSucceeds(setDoc(doc(dbFor('owner'), 'levels/valid'), level({ game: '0987', palette })))
})

test('level encoding rejects oversized puzzle and solved-art palettes', async () => {
  const palette = Array.from({ length: 10 }, (_, i) => `#00000${i}`)
  const ref = doc(dbFor('owner'), 'levels/invalid')

  await assertFails(setDoc(ref, level({ palette })))
  await assertFails(setDoc(ref, level({
    art: { scale: 1, palette, data: '0000' },
  })))
})

test('level encoding rejects malformed puzzle and solved-art colors', async () => {
  const ref = doc(dbFor('owner'), 'levels/invalid')

  await assertFails(setDoc(ref, level({ palette: ['not-a-color', '#ffffff'] })))
  await assertFails(setDoc(ref, level({ palette: [42, '#ffffff'] })))
  await assertFails(setDoc(ref, level({ palette: ['#12345g', '#ffffff'] })))
  await assertFails(setDoc(ref, level({
    art: { scale: 1, palette: [{}], data: '0000' },
  })))
  await assertFails(setDoc(ref, level({
    art: { scale: 1, palette: ['red'], data: '0000' },
  })))
})

test('level encoding rejects malformed dimensions and solved-art scales', async () => {
  const ref = doc(dbFor('owner'), 'levels/invalid')

  await assertFails(setDoc(ref, level({ x: 0 })))
  await assertFails(setDoc(ref, level({ y: 1.5 })))
  await assertFails(setDoc(ref, level({ x: '2' })))
  await assertFails(setDoc(ref, level({ art: { scale: 0, palette: ['#000000'], data: '0000' } })))
  await assertFails(setDoc(ref, level({ art: { scale: 5, palette: ['#000000'], data: '0'.repeat(400) } })))
  await assertFails(setDoc(ref, level({ art: { scale: 1.5, palette: ['#000000'], data: '0'.repeat(9) } })))
})

test('level encoding rejects malformed grid lengths and palette indices', async () => {
  const ref = doc(dbFor('owner'), 'levels/invalid')

  await assertFails(setDoc(ref, level({ game: '010' })))
  await assertFails(setDoc(ref, level({ game: '0130' })))
  await assertFails(setDoc(ref, level({
    art: { scale: 2, palette: ['#000000'], data: '0'.repeat(15) },
  })))
})

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
