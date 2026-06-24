import { CellBuffer, Cell } from './cellbuffer'
import { FULL, TL, TR, BL, BR, H, V, DH, GEOMETRIC } from './glyphs'
import { tintedGlyph, glyphInk, GLYPH_PX } from './glyphatlas'

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
  // Text: blit one bitmap glyph per char at ~80% cell size. Glyph ink widths
  // vary (e.g. "0" is 7px, "5" is 6px), so center each by its ink box for true
  // horizontal centering; keep a fixed vertical reference (the cap band, rows
  // 0–6) so letters in a word share a baseline instead of bouncing.
  const n = g.length
  const cw = cellW / n
  const dw = cw * 0.8
  const dh = cellH * 0.8
  const vRef = 3.5 // cap/digit band center, in 0..8 glyph coords
  for (let k = 0; k < n; k++) {
    const ch = g[k]
    const ink = glyphInk(ch)
    const inkCx = (ink.x0 + ink.x1 + 1) / 2
    const dx = x + k * cw + cw / 2 - (inkCx / GLYPH_PX) * dw
    const dy = y + cellH / 2 - (vRef / GLYPH_PX) * dh
    ctx.drawImage(tintedGlyph(ch, cell.fg), 0, 0, GLYPH_PX, GLYPH_PX, dx, dy, dw, dh)
  }
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
    case DH: {
      const t2 = Math.max(1, Math.round(th * 0.6))
      ctx.fillRect(x, y + h * 0.4 - t2 / 2, w, t2)
      ctx.fillRect(x, y + h * 0.6 - t2 / 2, w, t2)
      break
    }
  }
}
