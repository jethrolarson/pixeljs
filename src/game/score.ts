import { Level, HintGroup } from '../level'

/** Solution-derived clue numbers for every row and column. */
export interface Hints {
  row: HintGroup[][]
  col: HintGroup[][]
}

/** Per-clue-number satisfaction flags, parallel to `Hints`. */
export interface ClueSat {
  row: boolean[][]
  col: boolean[][]
}

export function computeHints(level: Level): Hints {
  return { row: level.getRowHints(), col: level.getColHints() }
}

/**
 * Which individual clue numbers the current paint satisfies, left-to-right /
 * top-to-bottom. Optimistic by design: clue j is "satisfied" when the j-th run
 * in the player's paint matches the j-th solution clue (count + color), even if
 * cells further along are still wrong. Perpendicular clues cross-validate.
 */
export function clueSatisfaction(level: Level, hints: Hints): ClueSat {
  // Per-clue satisfaction checked against the actual solution position: a run
  // resolves exactly when its cells are painted the right color and it isn't
  // over-extended into a neighbor. Each clue is independent, so one color's run
  // can resolve while the rest of the line (other colors) is still unsolved.
  const line = (sol: string[], paint: string[]): boolean[] => {
    const res: boolean[] = []
    const n = sol.length
    let i = 0
    while (i < n) {
      const color = sol[i]
      if (color === '0') {
        i++
        continue
      }
      let j = i
      while (j < n && sol[j] === color) j++ // solution run is [i, j)
      let ok = true
      for (let k = i; k < j; k++) if (paint[k] !== color) ok = false
      if (i > 0 && paint[i - 1] === color) ok = false // bleeds left
      if (j < n && paint[j] === color) ok = false // bleeds right
      res.push(ok)
      i = j
    }
    return res
  }
  return {
    row: hints.row.map((_g, y) => line(level.grid.getRow(y), level.paint.getRow(y))),
    col: hints.col.map((_g, x) => line(level.grid.getCol(x), level.paint.getCol(x))),
  }
}

/**
 * Number of "faults": painted cells that are wrong — either a wrong color, or
 * paint on a cell that should be empty. Pure; replaces the side effect that
 * `drawCells` used to fold into rendering.
 */
export function computeScore(level: Level): number {
  let score = 0
  for (let x = 0; x < level.x; x++) {
    for (let y = 0; y < level.y; y++) {
      const paintVal = level.paint.getAt(x, y)
      if (paintVal !== '0' && paintVal !== level.grid.getAt(x, y)) score++
    }
  }
  return score
}

/** Golf-style label comparing faults against par. */
export function golfScore(score: number, par: number): string {
  if (score === 0) return 'Ace!'
  const over = score - par
  if (over <= -3) return 'Albatross!'
  if (over === -2) return 'Eagle!'
  if (over === -1) return 'Birdie'
  if (over === 0) return 'Par'
  if (over === 1) return 'Bogey'
  if (over === 2) return 'Double Bogey'
  if (over === 3) return 'Triple Bogey'
  return `${score} over par`
}

/** Elapsed time between two dates as "m:ss". */
export function formatTime(start: Date, at: Date): string {
  const elapsed = new Date(at.getTime() - start.getTime())
  const mins = elapsed.getMinutes()
  const secs = elapsed.getSeconds()
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
