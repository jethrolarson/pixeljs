import { Cell } from './cellbuffer'
import { AnimSpec, Phase, regions } from './anim'

/**
 * Win celebration: a "chasing lights" sweep around the outer frame. This is just
 * the coloring `apply` for the generic `anim` core — `winChaseAnim()` hands back
 * an AnimSpec the loop plays on solve. Perimeter cells keep their double-line
 * glyph; only `fg` is recolored, from each cell's position phase (`i/n`) and the
 * raw elapsed time (`t`).
 *
 * Every knob lives in the mutable `winFx` singleton below, and in dev it's hung
 * off `window.winFx`, so you can tune it live from the console while a solved
 * puzzle animates — edit a field, see it next frame. Presets at the bottom.
 */
export interface WinFx {
  enabled: boolean
  /** 'chase' = N bulbs spaced round the border (Christmas lights); 'comet' =
   *  one head + tail; 'rainbow' = full-border hue gradient that rotates. */
  mode: 'chase' | 'comet' | 'rainbow'
  speed: number // laps per second
  dir: 1 | -1 // travel direction
  bulbs: number // chase: how many lit points
  tail: number // lit width, as a fraction of the whole perimeter (0..1)
  gamma: number // tail falloff shape; >1 = sharper bulbs
  hue: number // base hue, degrees
  hueSpin: number // hue rotation, degrees per second
  hueSpread: number // chase: hue offset between adjacent bulbs, degrees
  sat: number // 0..100
  bright: number // lit lightness, 0..100
  floor: number // unlit lightness (keeps the frame visible), 0..100
}

/** Live-tunable. Mutate fields (or `window.winFx`) to experiment. */
export const winFx: WinFx = {
  enabled: true,
  mode: 'chase',
  speed: 0.4,
  dir: 1,
  bulbs: 4,
  tail: 0.05,
  gamma: 1.6,
  hue: 120,
  hueSpin: 40,
  hueSpread: 40,
  sat: 90,
  bright: 60,
  floor: 16,
}

/** Ready-made looks. `applyPreset('candycane')` or copy fields by hand. */
export const winFxPresets: Record<string, Partial<WinFx>> = {
  christmas: { mode: 'chase', bulbs: 8, hue: 0, hueSpread: 120, tail: 0.04, speed: 0.4 },
  comet: { mode: 'comet', bulbs: 1, tail: 0.25, gamma: 2, hueSpin: 0, speed: 0.7 },
  rainbow: { mode: 'rainbow', hueSpin: 90, speed: 0, tail: 1, bright: 55 },
  candycane: { mode: 'chase', bulbs: 12, hue: 0, hueSpread: 180, sat: 95, tail: 0.03, speed: 0.6 },
}

export function applyWinFxPreset(name: keyof typeof winFxPresets): void {
  Object.assign(winFx, winFxPresets[name])
}

/** Shortest distance between two phases on a unit ring. */
function ringDist(a: number, b: number): number {
  const d = Math.abs(a - b) % 1
  return Math.min(d, 1 - d)
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v
}
function hsl(h: number, s: number, l: number): string {
  return `hsl(${((h % 360) + 360) % 360} ${clamp(s, 0, 100)}% ${clamp(l, 0, 100)}%)`
}

/** The chase coloring, as an `anim` apply: cell position phase = i/n, time = t. */
function chaseApply(cell: Cell, { t, i, n }: Phase, fx: WinFx = winFx): Partial<Cell> | void {
  if (!fx.enabled) return
  const p = i / n
  const spin = fx.hueSpin * t
  const head = fx.speed * t * fx.dir

  let intensity = 0
  let hueShift = 0
  if (fx.mode === 'rainbow') {
    intensity = 1
    hueShift = p * 360
  } else {
    const bulbs = fx.mode === 'comet' ? 1 : Math.max(1, Math.floor(fx.bulbs))
    for (let b = 0; b < bulbs; b++) {
      const pos = head + b / bulbs
      const d = ringDist(p, pos)
      if (d < fx.tail) {
        const lit = Math.pow(1 - d / fx.tail, fx.gamma)
        if (lit > intensity) {
          intensity = lit
          hueShift = b * fx.hueSpread
        }
      }
    }
  }
  const l = fx.floor + (fx.bright - fx.floor) * intensity
  return { fg: hsl(fx.hue + spin + hueShift, fx.sat, l) }
}

/** AnimSpec the loop plays on solve: chase the outer frame, forever, live-tuned. */
export function winChaseAnim(): AnimSpec {
  return { key: 'win', cells: regions.perimeter(), apply: chaseApply }
}

// Dev: live console control. Edit fields while a solved puzzle animates.
//   winFx.speed = 1.2 ; applyWinFxPreset('candycane')
if (import.meta.env?.DEV && typeof window !== 'undefined') {
  Object.assign(window, { winFx, winFxPresets, applyWinFxPreset })
}
