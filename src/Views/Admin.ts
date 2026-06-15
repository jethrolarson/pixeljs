import { funState, FunState, mapRead } from '@fun-land/fun-state'
import { Component, h, hx, enhance, attr, bindView } from '@fun-land/fun-web'
import { PackData } from '../pack'
import { getPublishedPacks, setPackFeatured, isModerator } from '../packStore'
import { getUser } from '../services/getUser'
import { getModerator } from '../services/getModerator'
import { Header } from '../components/Header'
import { empty, page } from '../theme.css'
import * as styles from './Admin.css'

type Apply = (id: string, featured: boolean, order: number) => Promise<void>

const row = (signal: AbortSignal, pack: PackData, apply: Apply): Element => {
  const icons = pack.icons.slice(0, 4).join('') || '🧩'

  const orderInput = hx('input', {
    signal,
    props: { type: 'number', value: String(pack.featuredOrder ?? 0), disabled: !pack.featured, className: styles.orderInput },
    on: { change: (e) => { if (pack.featured) void apply(pack.id!, true, parseInt(e.currentTarget.value || '0', 10)) } },
  })

  const check = hx('input', {
    signal,
    props: { type: 'checkbox', checked: pack.featured },
    on: { change: (e) => void apply(pack.id!, e.currentTarget.checked, parseInt(orderInput.value || '0', 10)) },
  })

  const cover = enhance(h('div', { className: styles.cover }, [icons]), attr('style', `background:${pack.color}`))

  return h('div', { className: styles.row }, [
    cover,
    h('div', { className: styles.titleBox }, [
      h('a', { href: `/pack.html?id=${pack.id}`, className: styles.titleLink }, [pack.title]),
      h('div', { className: styles.sub }, [`${pack.ownerName} · ▲ ${pack.upvotes}`]),
    ]),
    h('div', { className: styles.controls }, [
      h('label', { className: styles.ctrlLabel }, ['Order', orderInput]),
      h('label', { className: styles.ctrlLabel }, [check, 'Featured']),
    ]),
  ])
}

const adminLists = (signal: AbortSignal, packs: FunState<PackData[]>, apply: Apply): Element => {
  const featuredList = bindView(signal, packs, (s, list) => {
    const featured = list.filter((p) => p.featured).sort((a, b) => (a.featuredOrder ?? 0) - (b.featuredOrder ?? 0))
    return featured.length
      ? h('div', {}, featured.map((p) => row(s, p, apply)))
      : h('p', { className: empty }, ['No featured packs.'])
  })

  const publishedList = bindView(signal, packs, (s, list) =>
    list.length ? h('div', {}, list.map((p) => row(s, p, apply))) : h('p', { className: empty }, ['No published packs.']),
  )

  return h('div', {}, [
    h('h2', { className: styles.sectionTitle }, ['Featured']),
    featuredList,
    h('h2', { className: styles.sectionTitle }, ['All published packs']),
    publishedList,
  ])
}

const adminGate = (signal: AbortSignal, uid: string): Element => {
  const phase = funState<'checking' | 'denied' | 'ready'>('checking')
  const packs = funState<PackData[]>([])

  isModerator(uid)
    .then((m) => {
      if (!m) {
        phase.set('denied')
        return
      }
      return getPublishedPacks().then((ps) => {
        packs.set(ps)
        phase.set('ready')
      })
    })
    .catch((e) => {
      console.error(e)
      phase.set('denied')
    })

  const apply: Apply = async (id, featured, order) => {
    try {
      await setPackFeatured(id, featured, order)
      packs.mod((list) => list.map((p) => (p.id === id ? { ...p, featured, featuredOrder: order } : p)))
    } catch (e) {
      console.error(e)
      alert('Failed to update. Are you a moderator?')
    }
  }

  return bindView(signal, phase, (s, ph) =>
    ph === 'checking'
      ? h('p', { className: empty }, ['Checking…'])
      : ph === 'denied'
        ? h('p', { className: empty }, ["You don't have moderator access."])
        : adminLists(s, packs, apply),
  )
}

export const Admin: Component = (signal) => {
  const user = getUser(signal)
  const isMod = getModerator(
    signal,
    mapRead(user, (u) => u?.uid ?? null),
  )

  const content = bindView(signal, user, (s, u) =>
    u ? adminGate(s, u.uid) : h('p', { className: empty }, ['Sign in with a moderator account.']),
  )

  return h('div', { className: page }, [Header(signal, { user, isMod }), content])
}
