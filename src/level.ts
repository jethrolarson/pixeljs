import { Matrix } from './matrix'

export const MAX_PALETTE_COLORS = 9

export interface HintGroup {
  count: number
  colorIndex: number  // 1-based index into palette; 0 means empty row/col
}

/** Optional reward art shown in place of the puzzle once solved. Its own palette
 * (more/other colors than the puzzle) and optionally higher resolution. */
export interface SolvedArt {
  scale: number       // 1–4: art grid is (scale·x) × (scale·y)
  palette: string[]
  data: string        // column-major color indices, '0' = blank
}

export interface LevelData {
  id?: string
  ownerId?: string
  title?: string
  x?: number
  y?: number
  game?: string       // column-major color indices: "012120..."
  palette?: string[]  // hex colors for index 1..n
  par?: number
  levelSetName?: string
  key?: string
  art?: SolvedArt | null
}

const validatePalette = (palette: string[], name: string): void => {
  if (!Array.isArray(palette) || palette.length < 1 || palette.length > MAX_PALETTE_COLORS) {
    throw new Error(`${name} must contain between 1 and ${MAX_PALETTE_COLORS} colors.`)
  }
  if (palette.some((color) => typeof color !== 'string' || !/^#[0-9a-f]{6}$/i.test(color))) {
    throw new Error(`${name} contains an invalid color.`)
  }
}

const validateGrid = (data: string, width: number, height: number, paletteSize: number, name: string): void => {
  if (typeof data !== 'string' || data.length !== width * height) {
    throw new Error(`${name} must contain exactly ${width * height} cells.`)
  }
  if (![...data].every((cell) => /^[0-9]$/.test(cell) && Number(cell) <= paletteSize)) {
    throw new Error(`${name} contains a color index outside its palette.`)
  }
}

export const validateLevelData = (data: LevelData): void => {
  const x = data.x ?? 10
  const y = data.y ?? 10
  if (!Number.isInteger(x) || x < 1 || !Number.isInteger(y) || y < 1) {
    throw new Error('Level dimensions must be positive integers.')
  }

  const palette = data.palette ?? ['#0000ff']
  validatePalette(palette, 'Puzzle palette')
  validateGrid(data.game ?? '0'.repeat(x * y), x, y, palette.length, 'Puzzle grid')

  if (data.art === null || data.art === undefined) return
  if (typeof data.art !== 'object' || Array.isArray(data.art)) {
    throw new Error('Solved art must be an object or null.')
  }
  const { scale, palette: artPalette, data: artData } = data.art
  if (!Number.isInteger(scale) || scale < 1 || scale > 4) {
    throw new Error('Solved art scale must be an integer from 1 to 4.')
  }
  validatePalette(artPalette, 'Solved-art palette')
  validateGrid(artData, x * scale, y * scale, artPalette.length, 'Solved-art grid')
}

export class Level {
  title: string
  x: number
  y: number
  par: number
  levelSetName: string
  palette: string[]
  grid: Matrix   // solution: '0'=empty, '1'=palette[0], '2'=palette[1], ...
  paint: Matrix  // player's painting, same encoding as grid
  mark: Matrix   // right-click X marks: '0' or '1'
  art: SolvedArt | null  // optional reward art shown once solved

  constructor(data: LevelData = {}) {
    validateLevelData(data)
    this.title = data.title ?? 'untitled'
    this.x = data.x ?? 10
    this.y = data.y ?? 10
    this.par = data.par ?? 3
    this.levelSetName = data.levelSetName ?? 'My Levels'
    this.palette = data.palette?.length ? [...data.palette] : ['#0000ff']

    const game = data.game ?? '0'.repeat(this.x * this.y)
    this.grid = new Matrix(this.x, this.y, game.split(''))
    this.paint = new Matrix(this.x, this.y)
    this.mark = new Matrix(this.x, this.y)
    this.art = data.art ?? null
  }

  getRowHints(): HintGroup[][] {
    return Array.from({ length: this.y }, (_, y) =>
      this.getLineHints(this.grid.getRow(y))
    )
  }

  getColHints(): HintGroup[][] {
    return Array.from({ length: this.x }, (_, x) =>
      this.getLineHints(this.grid.getCol(x))
    )
  }

  getLineHints(cells: string[]): HintGroup[] {
    const hints: HintGroup[] = []
    let run = 0
    let runColor = '0'

    const pushRun = () => {
      if (run > 0) hints.push({ count: run, colorIndex: parseInt(runColor) })
      run = 0
    }

    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i]
      if (cell !== '0') {
        if (cell !== runColor && run > 0) pushRun()
        runColor = cell
        run++
        if (i === cells.length - 1) pushRun()
      } else {
        pushRun()
      }
    }

    return hints.length > 0 ? hints : [{ count: 0, colorIndex: 0 }]
  }

  isRowComplete(y: number): boolean {
    const row = this.grid.getRow(y)
    const paintRow = this.paint.getRow(y)
    return row.every((cell, i) => cell === '0' || paintRow[i] === cell)
  }

  isColComplete(x: number): boolean {
    const col = this.grid.getCol(x)
    const paintCol = this.paint.getCol(x)
    return col.every((cell, i) => cell === '0' || paintCol[i] === cell)
  }

  isComplete(): boolean {
    for (let x = 0; x < this.x; x++) {
      if (!this.isColComplete(x)) return false
    }
    return true
  }

  /**
   * Exact-match completion: every cell's paint equals the solution, including
   * blank cells having no paint. Stricter than `isComplete`, which ignores stray
   * paint on should-be-blank cells. Zen mode uses this — with errors hidden, the
   * red-X that discourages painting blanks is gone, so the win must be exact.
   */
  isSolvedExactly(): boolean {
    for (let x = 0; x < this.x; x++) {
      const col = this.grid.getCol(x)
      const paintCol = this.paint.getCol(x)
      if (!col.every((cell, i) => paintCol[i] === cell)) return false
    }
    return true
  }

  getGame(): string {
    let s = ''
    for (let x = 0; x < this.x; x++) {
      for (const cell of this.grid.getCol(x)) s += cell
    }
    return s
  }

  /** True if every cell is blank ('0') — no color has been painted anywhere. */
  isEmpty(): boolean {
    for (let x = 0; x < this.x; x++) {
      if (this.grid.getCol(x).some((cell) => cell !== '0')) return false
    }
    return true
  }

  addCols(num: number): void {
    this.x += num
    this.grid.addCols(num)
    this.paint.addCols(num)
    this.mark.addCols(num)
  }

  addRows(num: number): void {
    this.y += num
    this.grid.addRows(num)
    this.paint.addRows(num)
    this.mark.addRows(num)
  }

  subtractCols(num: number): void {
    this.x -= num
    this.grid.subtractCols(num)
    this.paint.subtractCols(num)
    this.mark.subtractCols(num)
  }

  subtractRows(num: number): void {
    this.y -= num
    this.grid.subtractRows(num)
    this.paint.subtractRows(num)
    this.mark.subtractRows(num)
  }

  /**
   * Drop palette color at 0-based `index`. Cells painted with that color clear
   * to blank ('0'); cells above it shift down to follow the palette splice.
   * Caller is responsible for removing the color from `this.palette` itself.
   */
  removeColor(index: number): void {
    const colorIndex = index + 1
    const remap = (cell: string): string => {
      const n = parseInt(cell, 10)
      if (n === colorIndex) return '0'
      return n > colorIndex ? String(n - 1) : cell
    }
    for (let x = 0; x < this.x; x++) {
      for (let y = 0; y < this.y; y++) {
        this.grid.setAt(x, y, remap(this.grid.getAt(x, y)))
        this.paint.setAt(x, y, remap(this.paint.getAt(x, y)))
      }
    }
  }
}
