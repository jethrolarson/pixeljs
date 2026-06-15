import { Component, h, enhance, attr } from '@fun-land/fun-web'
import { PackData } from '../pack'
import { btn } from '../theme.css'
import { upvoteButton, UpvoteConfig } from './UpvoteButton'
import * as styles from './PackCard.css'

export interface PackCardProps {
  pack: PackData
  showEdit?: boolean
  upvote?: Omit<UpvoteConfig, 'initialCount'>
}

export const PackCard: Component<PackCardProps> = (signal, { pack, showEdit, upvote }) => {
  const iconStr = pack.icons.slice(0, 4).join('') || '🧩'
  const levels = pack.levelIds.length
  const href = `/pack.html?id=${pack.id}`

  const coverEl = enhance(
    h('a', { href, className: styles.cover }, [h('span', { className: styles.icons }, [iconStr])]),
    attr('style', `background:${pack.color}`),
  )

  const actionEls: Element[] = []
  if (upvote) actionEls.push(upvoteButton(signal, { ...upvote, initialCount: pack.upvotes }))
  if (showEdit) actionEls.push(h('a', { href: `/pack-edit.html?id=${pack.id}`, className: btn }, ['Edit']))

  return h('div', { className: styles.card }, [
    coverEl,
    h('div', { className: styles.info }, [
      h('a', { href, className: styles.titleLink }, [pack.title]),
      h('div', { className: styles.meta }, [`${levels} level${levels !== 1 ? 's' : ''} · ${pack.ownerName}`]),
      h('div', { className: styles.cardActions }, actionEls),
    ]),
  ])
}
