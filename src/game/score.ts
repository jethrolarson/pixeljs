import { Level } from '../level'

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
