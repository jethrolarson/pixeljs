/** Shared game types, kept neutral so the layout/renderer internals can change
 * without churning unrelated importers (input, Palette, loop). */

export type GameMode = 'play' | 'edit'

/**
 * How a play session scores + gives feedback.
 * - `zen`: errors are never revealed; success feedback comes only from per-clue
 *   satisfaction and the exact-solve win. The only active mode today.
 * - `faults`: classic — wrong paint shows red, faults counted vs par (golf).
 *   Kept dormant behind this flag so it can be re-enabled later.
 */
export type ScoreMode = 'faults' | 'zen'

export interface GridPos {
  x: number
  y: number
}
