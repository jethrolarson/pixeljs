import { funState } from '@fun-land/fun-state'
import { h } from '@fun-land/fun-web'
import { PackData } from '../pack'
import { upvotePack, hasUpvoted } from '../packStore'
import { signIn } from '../auth'
import { PackCard } from './PackCard'
import { grid } from './PackCard.css'

/**
 * A grid of PackCards with working upvote buttons. `getUid` is read live so a
 * card stays correct if the user signs in after the grid renders.
 */
export const packGrid = (
  signal: AbortSignal,
  packs: PackData[],
  getUid: () => string | null,
  showEdit = false,
): Element =>
  h(
    'div',
    { className: grid },
    packs.map((p) => {
      const voted = funState(false)
      const u = getUid()
      if (u) hasUpvoted(p.id!, u).then(voted.set).catch(console.error)
      return PackCard(signal, {
        pack: p,
        showEdit,
        upvote: {
          voted,
          signedIn: !!u,
          toggle: () => upvotePack(p.id!, getUid()!),
          requireSignIn: () => void signIn(),
        },
      })
    }),
  )
