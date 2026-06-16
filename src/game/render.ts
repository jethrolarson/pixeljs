import { Canvas2D, Color } from '../canvas2d'
import { hexToRGB, brightness, rgbToCSS } from '../color'
import { Level } from '../level'
import { GameMode, Layout, GridPos } from './layout'

/** CSS color for a 1-based palette index (0 → black fallback). */
export function paletteColor(palette: string[], index: number): string {
  const color = palette[index - 1]
  return color ? rgbToCSS(hexToRGB(color)) : 'rgb(0,0,0)'
}

function drawCell(p: Canvas2D, layout: Layout, x: number, y: number): void {
  const { cw, offset } = layout
  p.rect(x * cw + offset.x, y * cw + offset.y, cw, cw)
}

function drawMark(p: Canvas2D, layout: Layout, x: number, y: number, color: Color): void {
  const { cw, offset } = layout
  p.stroke(color)
  p.strokeWeight(1)
  p.line(x * cw + offset.x, y * cw + offset.y, (x + 1) * cw + offset.x, (y + 1) * cw + offset.y)
  p.line(x * cw + offset.x, (y + 1) * cw + offset.y, (x + 1) * cw + offset.x, y * cw + offset.y)
  p.noStroke()
}

/** Clear to the background color and paint the grid area. */
export function renderBackground(p: Canvas2D, level: Level, layout: Layout): void {
  const bg = rgbToCSS(hexToRGB(level.bgcolor))
  p.background(bg)
  p.fill(bg)
  p.noStroke()
  p.rect(layout.offset.x, layout.offset.y, layout.cw * level.x, layout.cw * level.y)
}

/** Draw the full solution grid (used in edit mode and on a completed puzzle). */
function renderSolution(p: Canvas2D, level: Level, layout: Layout, palette: string[]): void {
  p.noStroke()
  for (let x = 0; x < level.x; x++) {
    for (let y = 0; y < level.y; y++) {
      const gridVal = level.grid.getAt(x, y)
      if (gridVal !== '0') {
        p.fill(paletteColor(palette, parseInt(gridVal)))
        drawCell(p, layout, x, y)
      }
    }
  }
}

/**
 * Render cells. No score side effect — score is computed separately.
 * `reveal` shows the solution (completed puzzle); edit mode always shows it.
 */
export function renderCells(
  p: Canvas2D,
  level: Level,
  layout: Layout,
  palette: string[],
  mode: GameMode,
  reveal: boolean,
): void {
  if (mode === 'edit' || reveal) {
    renderSolution(p, level, layout, palette)
    return
  }

  p.noStroke()
  for (let x = 0; x < level.x; x++) {
    for (let y = 0; y < level.y; y++) {
      const gridVal = level.grid.getAt(x, y)
      const paintVal = level.paint.getAt(x, y)
      const markVal = level.mark.getAt(x, y)

      if (paintVal !== '0') {
        if (paintVal === gridVal) {
          p.fill(paletteColor(palette, parseInt(paintVal)))
          drawCell(p, layout, x, y)
        } else {
          drawMark(p, layout, x, y, p.color(180, 30, 30))
        }
      } else if (markVal !== '0') {
        drawMark(p, layout, x, y, p.color(0, 0, 0))
      }
    }
  }
}

/** Draw the numbered hint groups around the grid (play mode). */
export function renderHints(p: Canvas2D, level: Level, layout: Layout, palette: string[]): void {
  const { cw, offset } = layout
  p.textSize(Math.floor(cw / 3))
  p.textAlign('center', 'middle')

  const rowHints = level.getRowHints()
  for (let y = 0; y < rowHints.length; y++) {
    const hintGroup = [...rowHints[y]].reverse()
    const rowComplete = level.isRowComplete(y)
    for (let x = 0; x < hintGroup.length; x++) {
      const { count, colorIndex } = hintGroup[x]
      const pos = { x: offset.x - cw * (x + 1), y: cw * y + offset.y }
      p.fill(colorIndex > 0 ? paletteColor(palette, colorIndex) : 'rgb(160,160,160)')
      p.noStroke()
      p.rect(pos.x, pos.y, cw, cw)
      p.fill(rowComplete ? 180 : 0)
      p.text(count, pos.x + cw / 2, pos.y + cw / 2)
    }
  }

  const colHints = level.getColHints()
  for (let x = 0; x < colHints.length; x++) {
    const hintGroup = [...colHints[x]].reverse()
    const colComplete = level.isColComplete(x)
    for (let y = 0; y < hintGroup.length; y++) {
      const { count, colorIndex } = hintGroup[y]
      const pos = { x: cw * x + offset.x, y: offset.y - cw * (y + 1) }
      p.fill(colorIndex > 0 ? paletteColor(palette, colorIndex) : 'rgb(160,160,160)')
      p.noStroke()
      p.rect(pos.x, pos.y, cw, cw)
      p.fill(colComplete ? 180 : 0)
      p.text(count, pos.x + cw / 2, pos.y + cw / 2)
    }
  }
}

/** Draw the cell grid lines (every 5th line heavier). */
export function renderGrid(p: Canvas2D, level: Level, layout: Layout): void {
  const { cw, offset } = layout
  const gridLineColor =
    level.gridcolor ?? (brightness(hexToRGB(level.bgcolor)) > 80 ? 'rgb(0,0,0)' : 'rgb(200,200,200)')
  p.stroke(gridLineColor)
  for (let i = 1; i < level.x; i++) {
    p.strokeWeight(i % 5 === 0 ? 3 : 1)
    p.line(i * cw + offset.x, offset.y, i * cw + offset.x, level.y * cw + offset.y)
  }
  for (let i = 1; i < level.y; i++) {
    p.strokeWeight(i % 5 === 0 ? 3 : 1)
    p.line(offset.x, i * cw + offset.y, level.x * cw + offset.x, i * cw + offset.y)
  }
}

/** Crosshair highlight for the hovered row + column. */
export function renderHover(p: Canvas2D, level: Level, layout: Layout, pos: GridPos): void {
  const { cw, offset } = layout
  p.noStroke()
  p.fill(p.color(30, 30, 200, 90))
  p.rect(offset.x, pos.y * cw + offset.y, cw * level.x, cw)
  p.rect(pos.x * cw + offset.x, offset.y, cw, cw * level.y)
}

/** Win banner text (top-left). */
export function renderWinText(p: Canvas2D, text: string): void {
  p.fill(255)
  p.noStroke()
  p.textAlign('left')
  p.text(text, 150, 40)
}
