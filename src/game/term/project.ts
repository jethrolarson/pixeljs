import { CellBuffer } from './cellbuffer'
import { FULL, MARK, WRONG, chrome } from './glyphs'
import { Level } from '../../level'
import { hexToRGB, rgbToCSS } from '../../color'
import { GameMode, GridPos } from '../types'
import { Layout } from '../layout'
import { Hints, ClueSat } from '../score'

const PP = 'pp·wf'

/** CSS color for a 1-based palette index (0 → dim fallback). */
function paletteColor(palette: string[], index: number): string {
  const c = palette[index - 1]
  return c ? rgbToCSS(hexToRGB(c)) : chrome.dim
}

export interface ProjectOpts {
  level: Level
  palette: string[]
  mode: GameMode
  layout: Layout
  hints: Hints
  sat?: ClueSat | null
  hover?: GridPos | null
  solved: boolean
  /** Show the full solution (edit mode, or a won puzzle). */
  reveal: boolean
  golf?: string | null
  /** Currently selected paint color (1-based), for the play-mode palette strip. */
  activeColorIndex?: number
  /** Most-recently painted cell + its pop progress (1 = fresh, 0 = settled). */
  pop?: { x: number; y: number; t: number } | null
}

/**
 * Pure: build the terminal character buffer for a puzzle. Layout in char coords
 * comes from `layout`; no canvas/pixel knowledge here. Animation lives only in
 * the cell fields (e.g. the paint `pop` scale).
 */
export function projectPuzzle(o: ProjectOpts): CellBuffer {
  const { level, palette, mode, layout, hints } = o
  const buf = new CellBuffer(layout.cols, layout.rows)

  // Chrome quadrant (upper-left): brand + dimensions.
  buf.text(0, 0, PP, chrome.green)
  buf.text(0, 2, `${level.x}x${level.y}`, chrome.dim)

  // Palette selector (play mode): a swatch strip with a caret under the active.
  if (mode === 'play') {
    for (let i = 0; i < palette.length; i++) {
      const color = paletteColor(palette, i + 1)
      const col = layout.paletteCol + i
      buf.set(col, layout.paletteRow, { glyph: FULL, fg: color, bg: color })
      if (i + 1 === o.activeColorIndex) buf.set(col, layout.paletteRow + 1, { glyph: '^', fg: chrome.text })
    }
  }
  // Puzzle title under the grid; golf result replaces it once solved.
  buf.text(layout.boxLeft, layout.nameRow, o.solved && o.golf ? o.golf : level.title, o.solved ? chrome.solved : chrome.name)

  // Grid box; border color signals solved state.
  buf.box(layout.boxLeft, layout.boxTop, level.x + 2, level.y + 2, o.solved ? chrome.solved : chrome.dim)

  // Clues (play mode only): per-column above, per-row to the left.
  if (mode === 'play') {
    const clueCell = (count: number, colorIndex: number, satisfied: boolean) => {
      // Empty line: a plain grey 0.
      if (count === 0) return { glyph: '0', fg: chrome.dim }
      const color = colorIndex > 0 ? paletteColor(palette, colorIndex) : chrome.dim
      const glyph = String(count)
      // Unsatisfied: color fills the cell (digit reads dark on it). Satisfied:
      // the cell empties out and the digit is drawn in the color.
      return satisfied ? { glyph, fg: color } : { glyph, fg: chrome.bg, bg: color }
    }
    for (let gx = 0; gx < level.x; gx++) {
      const groups = hints.col[gx]
      const k = groups.length
      for (let j = 0; j < k; j++) {
        buf.set(
          layout.gridCol + gx,
          layout.boxTop - k + j,
          clueCell(groups[j].count, groups[j].colorIndex, o.sat?.col[gx]?.[j] ?? false),
        )
      }
    }
    for (let gy = 0; gy < level.y; gy++) {
      const groups = hints.row[gy]
      const k = groups.length
      for (let j = 0; j < k; j++) {
        buf.set(
          layout.boxLeft - k + j,
          layout.gridRow + gy,
          clueCell(groups[j].count, groups[j].colorIndex, o.sat?.row[gy]?.[j] ?? false),
        )
      }
    }
  }

  // Interior puzzle cells.
  const popScale = o.pop ? 1 + 0.45 * o.pop.t : 1
  for (let gx = 0; gx < level.x; gx++) {
    for (let gy = 0; gy < level.y; gy++) {
      const col = layout.gridCol + gx
      const row = layout.gridRow + gy
      const solVal = level.grid.getAt(gx, gy)
      const fresh = o.pop && o.pop.x === gx && o.pop.y === gy ? popScale : undefined

      if (mode === 'edit' || o.reveal) {
        if (solVal !== '0') {
          const c = paletteColor(palette, parseInt(solVal))
          buf.set(col, row, { glyph: FULL, fg: c, bg: c, scale: fresh })
        }
        continue
      }

      const paintVal = level.paint.getAt(gx, gy)
      const markVal = level.mark.getAt(gx, gy)
      if (paintVal !== '0') {
        if (paintVal === solVal) {
          const c = paletteColor(palette, parseInt(paintVal))
          buf.set(col, row, { glyph: FULL, fg: c, bg: c, scale: fresh })
        } else {
          buf.set(col, row, { glyph: WRONG, fg: chrome.red, scale: fresh })
        }
      } else if (markVal !== '0') {
        buf.set(col, row, { glyph: MARK, fg: chrome.dim })
      }
    }
  }

  // Hover crosshair: faint wash over empty cells in the hovered row + column.
  if (o.hover && mode === 'play' && !o.solved && inBounds(level, o.hover)) {
    const wash = 'rgba(80,140,255,0.18)'
    for (let gx = 0; gx < level.x; gx++) washEmpty(buf, layout.gridCol + gx, layout.gridRow + o.hover.y, wash)
    for (let gy = 0; gy < level.y; gy++) washEmpty(buf, layout.gridCol + o.hover.x, layout.gridRow + gy, wash)
  }

  return buf
}

function inBounds(level: Level, pos: GridPos): boolean {
  return pos.x >= 0 && pos.x < level.x && pos.y >= 0 && pos.y < level.y
}

function washEmpty(buf: CellBuffer, col: number, row: number, wash: string): void {
  if (!buf.get(col, row)) buf.set(col, row, { glyph: ' ', fg: chrome.text, bg: wash })
}
