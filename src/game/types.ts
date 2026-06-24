/** Shared game types, kept neutral so the layout/renderer internals can change
 * without churning unrelated importers (input, Palette, loop). */

export type GameMode = 'play' | 'edit'

export interface GridPos {
  x: number
  y: number
}
