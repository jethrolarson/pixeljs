import { Cell, CellBuffer } from './cellbuffer'

/**
 * Tiny cell-animation core. Decouples the three axes an effect needs:
 *   WHERE  — `cells`: which buffer cells (a list, or a region fn of the buffer)
 *   WHEN   — `dur` (finite, ms) or omit for a looping effect
 *   HOW    — `apply`: given the cell + a `Phase`, return field overrides
 *
 * `play` fires an anim from anywhere; `tick` runs every frame against the
 * freshly-projected buffer, mutating matched cells. Finite anims auto-drop when
 * done. `key` makes an anim a singleton (a replay with the same key replaces it),
 * which is how a paint-pop keeps to the latest cell and a win-chase stays single.
 */

export interface CellPos {
  c: number
  r: number
}
export type CellsSpec = CellPos[] | ((buf: CellBuffer) => CellPos[])

/** What an `apply` fn gets each frame. `u` = eased 0..1 progress (finite anims);
 *  `t` = raw elapsed seconds (for effects that spin on real time, e.g. hue);
 *  `i`/`n` = index within the cell set (spatial phase — chase, ripple, stagger). */
export interface Phase {
  u: number
  t: number
  i: number
  n: number
}
export type ApplyFn = (cell: Cell, ph: Phase) => Partial<Cell> | void

export interface AnimSpec {
  cells: CellsSpec
  apply: ApplyFn
  /** Finite duration in ms. Omit for a looping/until-stopped effect. */
  dur?: number
  ease?: (t: number) => number
  /** Singleton tag: replaying the same key replaces the running anim. */
  key?: string
}

interface Active extends AnimSpec {
  start: number
  done?: boolean
}

export const easings = {
  linear: (t: number) => t,
  outQuad: (t: number) => 1 - (1 - t) * (1 - t),
  outCubic: (t: number) => 1 - Math.pow(1 - t, 3),
  outBack: (t: number) => {
    const c1 = 1.70158
    const c3 = c1 + 1
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
  },
  inOutSine: (t: number) => -(Math.cos(Math.PI * t) - 1) / 2,
}

/** Reusable cell regions. */
export const regions = {
  /** Outer frame cells, clockwise from top-left, corners once. */
  perimeter:
    (inset = 0) =>
    (buf: CellBuffer): CellPos[] => {
      const out: CellPos[] = []
      const c0 = inset
      const r0 = inset
      const c1 = buf.cols - 1 - inset
      const r1 = buf.rows - 1 - inset
      for (let c = c0; c <= c1; c++) out.push({ c, r: r0 })
      for (let r = r0 + 1; r <= r1; r++) out.push({ c: c1, r })
      for (let c = c1 - 1; c >= c0; c--) out.push({ c, r: r1 })
      for (let r = r1 - 1; r >= r0 + 1; r--) out.push({ c: c0, r })
      return out
    },
}

const active: Active[] = []

export function play(spec: AnimSpec): void {
  const a: Active = { ...spec, start: Date.now() }
  if (spec.key) {
    const j = active.findIndex(x => x.key === spec.key)
    if (j >= 0) {
      active[j] = a
      return
    }
  }
  active.push(a)
}

export function stop(key: string): void {
  for (let i = active.length - 1; i >= 0; i--) if (active[i].key === key) active.splice(i, 1)
}

/** Drop everything — call when a puzzle (re)starts. */
export function clearAnims(): void {
  active.length = 0
}

/** Advance every anim against `buf` at wall-clock `now` (ms). */
export function tick(buf: CellBuffer, now: number): void {
  for (const a of active) {
    const t = (now - a.start) / 1000
    let u = 0
    if (a.dur) {
      const e = now - a.start
      if (e >= a.dur) a.done = true
      u = (a.ease ?? easings.linear)(Math.min(1, e / a.dur))
    }
    const cells = typeof a.cells === 'function' ? a.cells(buf) : a.cells
    const n = cells.length
    for (let i = 0; i < n; i++) {
      const { c, r } = cells[i]
      const cell = buf.get(c, r)
      if (!cell) continue
      const patch = a.apply(cell, { u, t, i, n })
      if (patch) buf.set(c, r, { ...cell, ...patch })
    }
  }
  for (let i = active.length - 1; i >= 0; i--) if (active[i].done) active.splice(i, 1)
}
