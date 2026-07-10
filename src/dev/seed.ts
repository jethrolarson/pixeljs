/**
 * Dev-only console seeder. Loaded only in `import.meta.env.DEV` (see index.ts),
 * it hangs `seedFont` off `window` so you can bulk-write the font test levels
 * from DevTools:
 *
 *   1. sign in (Google) in the app so writes pass Firestore rules
 *   2. open console, run:  await seedFont()
 *
 * Optionally group them into packs of 20 afterwards:  await seedFont(true)
 */
import { saveLevel } from '../store'
import { savePack } from '../packStore'
import { currentUser } from '../auth'
import { MAX_PACK_LEVELS } from '../pack'
import type { LevelData } from '../level'

async function seedFont(makePacks = false): Promise<void> {
  const user = currentUser()
  if (!user) {
    console.error('[seedFont] not signed in — sign in first, then rerun')
    return
  }
  const levels: LevelData[] = await fetch('/font-levels.json').then(r => r.json())
  console.info(`[seedFont] writing ${levels.length} levels as ${user.uid}…`)

  const ids: string[] = []
  for (const [i, lvl] of levels.entries()) {
    const saved = await saveLevel(lvl, user.uid)
    ids.push(saved.id!)
    if ((i + 1) % 10 === 0 || i === levels.length - 1) {
      console.info(`[seedFont] ${i + 1}/${levels.length}`)
    }
  }
  console.info('[seedFont] levels done')

  if (makePacks) {
    for (let i = 0; i < ids.length; i += MAX_PACK_LEVELS) {
      const chunk = ids.slice(i, i + MAX_PACK_LEVELS)
      const n = i / MAX_PACK_LEVELS + 1
      await savePack({
        title: `Font 8×8 — part ${n}`,
        ownerId: user.uid,
        ownerName: user.displayName ?? 'seed',
        levelIds: chunk,
        icons: ['🔡'],
        color: '#0d0d0d',
        published: false,
        featured: false,
        upvotes: 0,
      })
      console.info(`[seedFont] pack ${n} (${chunk.length} levels)`)
    }
  }
  console.info('[seedFont] done')
}

;(window as unknown as { seedFont: typeof seedFont }).seedFont = seedFont
console.info('[seed] ready — run: await seedFont()')
