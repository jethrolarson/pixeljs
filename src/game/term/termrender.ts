import { CellBuffer, Cell } from './cellbuffer'
import { FULL, TL, TR, BL, BR, H, V, DH, DV, DTL, DTR, DBL, DBR, GEOMETRIC } from './glyphs'
import { tintedGlyph, glyphInk, GLYPH_PX } from './glyphatlas'
import { compactDigitChar } from './digitsCompact'
import { GRID_PX, CLEARANCE } from '../layout'

/** Where the character grid lands on the canvas. */
export interface TermMetrics {
  cellW: number
  cellH: number
  originX: number
  originY: number
}

/**
 * Draw a CellBuffer to a 2D context. This is the ONLY module that knows how a
 * glyph becomes pixels, so swapping in a bitmap-font atlas later means
 * reimplementing just this file. Geometric glyphs (box-drawing + full block) are
 * drawn as rects so they connect crisply at any cell aspect; everything else is
 * text via the monospace font.
 */
export function drawBuffer(ctx: CanvasRenderingContext2D, buffer: CellBuffer, m: TermMetrics): void {
  ctx.imageSmoothingEnabled = false

  buffer.each((col, row, cell) => {
    const x = m.originX + col * m.cellW
    const y = m.originY + row * m.cellH
    const animated =
      cell.scale !== undefined || cell.alpha !== undefined || cell.dx !== undefined || cell.dy !== undefined

    if (animated) {
      ctx.save()
      ctx.globalAlpha = cell.alpha ?? 1
      const cx = x + m.cellW / 2 + (cell.dx ?? 0) * m.cellW
      const cy = y + m.cellH / 2 + (cell.dy ?? 0) * m.cellH
      const s = cell.scale ?? 1
      ctx.translate(cx, cy)
      ctx.scale(s, s)
      ctx.translate(-cx, -cy)
    }

    drawCell(ctx, cell, x, y, m)

    if (animated) ctx.restore()
  })
}

function drawCell(ctx: CanvasRenderingContext2D, cell: Cell, x: number, y: number, m: TermMetrics): void {
  const { cellW, cellH } = m
  if (cell.bg) {
    ctx.fillStyle = cell.bg
    ctx.fillRect(x, y, Math.ceil(cellW), Math.ceil(cellH))
  }
  const g = cell.glyph
  if (g === ' ' || g === '') return
  if (GEOMETRIC.has(g)) {
    ctx.fillStyle = cell.fg
    drawGeometric(ctx, g, x, y, cellW, cellH)
    return
  }
  // One cell is always GRID_PX = GLYPH_PX + 2*CLEARANCE grid pixels (see
  // layout.ts) — layout snaps cell size to multiples of half a GRID_PX, so
  // zoom (cell px per grid px) can be a half-integer (1.5, 2.5, ...). Dest
  // coords still get Math.round'd below, so glyphs land on whole CSS pixels.
  // Glyph and clearance both scale by `zoom` together, so their 8:2:2
  // proportion is identical at every cell size instead of being derived
  // independently.
  const zoom = cellH / GRID_PX

  // Every cell holds exactly one glyph, except a multi-digit clue count
  // (e.g. "12" — the only producer of a multi-char glyph string). 2+ digits
  // physically can't fit one cell's width at the same per-pixel zoom as a
  // single digit, so they get their own narrower glyph set (digitsCompact.ts)
  // and are the one case allowed to shrink below `zoom`, only as far as
  // fitting requires.
  if (g.length > 1 && /^[0-9]+$/.test(g)) {
    const chars = [...g].map(compactDigitChar)
    const inks = chars.map(glyphInk)
    const widthAt = (s: number): number =>
      inks.reduce((sum, ink) => sum + (ink.x1 - ink.x0 + 1) * s, 0) + s * (chars.length - 1)
    let packZoom = zoom
    while (packZoom > 1 && widthAt(packZoom) > cellW) packZoom--
    const dh = packZoom * GLYPH_PX
    const totalW = widthAt(packZoom)
    let cx = x + (cellW - totalW) / 2
    // Round the final destination coords, not the running accumulators — a
    // half-pixel offset here isn't a smaller glyph, it's a misaligned one:
    // nearest-neighbor samples it across a device-pixel boundary, so some
    // source rows/cols render 1px taller than others. `cx` stays exact so
    // per-glyph spacing doesn't drift.
    const dy = Math.round(y + (cellH - dh) / 2)
    for (let k = 0; k < chars.length; k++) {
      const ink = inks[k]
      const dx = Math.round(cx - ink.x0 * packZoom)
      ctx.drawImage(tintedGlyph(chars[k], cell.fg), 0, 0, GLYPH_PX, GLYPH_PX, dx, dy, GLYPH_PX * packZoom, dh)
      cx += (ink.x1 - ink.x0 + 1) * packZoom + packZoom
    }
    return
  }

  // One glyph, centered in a fixed CLEARANCE*zoom-margined box. The box
  // itself is symmetric, but the ROM font's ink isn't always centered within
  // its own 8-column glyph (e.g. "1" sits off-center) — shift within the box
  // by ink bounds so the visible character looks centered, without changing
  // the box's size or position (zoom/proportions untouched).
  const ink = glyphInk(g)
  const inkCx = (ink.x0 + ink.x1 + 1) / 2
  const dw = GLYPH_PX * zoom
  const dh = GLYPH_PX * zoom
  const dx = Math.round(x + CLEARANCE * zoom + (GLYPH_PX / 2 - inkCx) * zoom)
  const dy = Math.round(y + CLEARANCE * zoom)
  ctx.drawImage(tintedGlyph(g, cell.fg), 0, 0, GLYPH_PX, GLYPH_PX, dx, dy, dw, dh)
}

/**
 * A 50% checkerboard stipple (CP437 ▒ style) drawn over a cell. Used as the
 * keyboard cursor: the gaps leave the cell behind it visible. Aligned to the
 * 8×8 sub-grid so it stays crisp.
 */
export function drawStipple(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string): void {
  ctx.fillStyle = color
  const sx = w / GLYPH_PX
  const sy = h / GLYPH_PX
  for (let r = 0; r < GLYPH_PX; r++) {
    for (let c = 0; c < GLYPH_PX; c++) {
      if ((r + c) % 2 === 0) ctx.fillRect(Math.floor(x + c * sx), Math.floor(y + r * sy), Math.ceil(sx), Math.ceil(sy))
    }
  }
}

/** Box-drawing + block glyphs as rectangles, sized to the cell. */
function drawGeometric(ctx: CanvasRenderingContext2D, g: string, x: number, y: number, w: number, h: number): void {
  if (g === FULL) {
    ctx.fillRect(x, y, Math.ceil(w), Math.ceil(h))
    return
  }
  const th = Math.max(1, Math.round(h * 0.11))
  const midX = x + w / 2
  const midY = y + h / 2
  const hBar = (x0: number, x1: number): void => ctx.fillRect(x0, midY - th / 2, x1 - x0, th)
  const vBar = (y0: number, y1: number): void => ctx.fillRect(midX - th / 2, y0, th, y1 - y0)
  const right = x + w
  const bottom = y + h

  // Double-line glyphs: two parallel strokes offset by ±sep from the center, so
  // the corners line up with the neighbouring ═/║ runs.
  const t2 = Math.max(1, Math.round(th * 0.7))
  const sep = Math.max(t2, Math.round(h * 0.16))
  const xL = midX - sep
  const xR = midX + sep
  const yT = midY - sep
  const yB = midY + sep
  const dh = (x0: number, x1: number, yc: number): void => ctx.fillRect(x0, yc - t2 / 2, x1 - x0, t2)
  const dv = (y0: number, y1: number, xc: number): void => ctx.fillRect(xc - t2 / 2, y0, t2, y1 - y0)

  switch (g) {
    case H:
      hBar(x, right)
      break
    case V:
      vBar(y, bottom)
      break
    case TL:
      hBar(midX - th / 2, right)
      vBar(midY - th / 2, bottom)
      break
    case TR:
      hBar(x, midX + th / 2)
      vBar(midY - th / 2, bottom)
      break
    case BL:
      hBar(midX - th / 2, right)
      vBar(y, midY + th / 2)
      break
    case BR:
      hBar(x, midX + th / 2)
      vBar(y, midY + th / 2)
      break
    case DH:
      dh(x, right, yT)
      dh(x, right, yB)
      break
    case DV:
      dv(y, bottom, xL)
      dv(y, bottom, xR)
      break
    case DTL:
      dh(xL, right, yT)
      dv(yT, bottom, xL)
      dh(xR, right, yB)
      dv(yB, bottom, xR)
      break
    case DTR:
      dh(x, xR, yT)
      dv(yT, bottom, xR)
      dh(x, xL, yB)
      dv(yB, bottom, xL)
      break
    case DBL:
      dh(xL, right, yB)
      dv(y, yB, xL)
      dh(xR, right, yT)
      dv(y, yT, xR)
      break
    case DBR:
      dh(x, xR, yB)
      dv(y, yB, xR)
      dh(x, xL, yT)
      dv(y, yT, xL)
      break
  }
}
