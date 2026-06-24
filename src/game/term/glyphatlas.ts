import { FONT8X8, GLYPH_PX } from './font8x8'

/**
 * Crisp 8×8 bitmap glyphs from the public-domain IBM-VGA/CP437 ROM font. Masks
 * are built once per char and tinted (cached) per color, then blitted with
 * nearest-neighbor at integer scale — no anti-aliasing, so the text reads as
 * hard pixels. This is the sole glyph source for `termrender`; swapping fonts
 * means replacing `font8x8` only.
 */

const maskCache = new Map<number, HTMLCanvasElement>()
const tintCache = new Map<string, HTMLCanvasElement>()
const inkCache = new Map<number, InkBounds>()

/** Inclusive ink bounds of a glyph in 0..7 cell coords. */
export interface InkBounds {
  x0: number
  x1: number
  y0: number
  y1: number
}

/** Rows for chars we use that fall outside ASCII 0x00–0x7F. */
function syntheticRows(ch: string): number[] | null {
  if (ch === '·') return [0, 0, 0, 0x18, 0x18, 0, 0, 0] // centered 2×2 dot
  return null
}

function rowsFor(ch: string): ArrayLike<number> | null {
  const code = ch.charCodeAt(0)
  return syntheticRows(ch) ?? (code >= 0 && code < 128 ? FONT8X8.subarray(code * 8, code * 8 + 8) : null)
}

/** Tight ink bounding box, so each glyph can be centered in its cell. */
export function glyphInk(ch: string): InkBounds {
  const code = ch.charCodeAt(0)
  let b = inkCache.get(code)
  if (b) return b
  const rows = rowsFor(ch)
  let x0 = 8
  let x1 = -1
  let y0 = 8
  let y1 = -1
  if (rows) {
    for (let r = 0; r < GLYPH_PX; r++) {
      for (let col = 0; col < GLYPH_PX; col++) {
        if ((rows[r] >> col) & 1) {
          if (col < x0) x0 = col
          if (col > x1) x1 = col
          if (r < y0) y0 = r
          if (r > y1) y1 = r
        }
      }
    }
  }
  b = x1 < 0 ? { x0: 0, x1: 7, y0: 0, y1: 7 } : { x0, x1, y0, y1 }
  inkCache.set(code, b)
  return b
}

function buildMask(ch: string): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = GLYPH_PX
  c.height = GLYPH_PX
  const x = c.getContext('2d')!
  const rows = rowsFor(ch)
  if (rows) {
    const img = x.createImageData(GLYPH_PX, GLYPH_PX)
    for (let r = 0; r < GLYPH_PX; r++) {
      const b = rows[r]
      for (let col = 0; col < GLYPH_PX; col++) {
        if ((b >> col) & 1) {
          const i = (r * GLYPH_PX + col) * 4
          img.data[i] = img.data[i + 1] = img.data[i + 2] = 255
          img.data[i + 3] = 255
        }
      }
    }
    x.putImageData(img, 0, 0)
  }
  return c
}

function mask(ch: string): HTMLCanvasElement {
  const code = ch.charCodeAt(0)
  let m = maskCache.get(code)
  if (!m) {
    m = buildMask(ch)
    maskCache.set(code, m)
  }
  return m
}

/** A GLYPH_PX² canvas of `ch` filled with `color` (transparent elsewhere). */
export function tintedGlyph(ch: string, color: string): HTMLCanvasElement {
  const key = `${ch}|${color}`
  let t = tintCache.get(key)
  if (t) return t
  t = document.createElement('canvas')
  t.width = GLYPH_PX
  t.height = GLYPH_PX
  const x = t.getContext('2d')!
  x.imageSmoothingEnabled = false
  x.drawImage(mask(ch), 0, 0)
  x.globalCompositeOperation = 'source-in'
  x.fillStyle = color
  x.fillRect(0, 0, GLYPH_PX, GLYPH_PX)
  tintCache.set(key, t)
  return t
}

export { GLYPH_PX }
