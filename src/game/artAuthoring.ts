import { FunState } from '@fun-land/fun-state'
import { Level, SolvedArt } from '../level'
import { createUi, Ui } from './uiState'

export interface ArtAuthoring {
  scale: number
  target: 'puzzle' | 'art'
  level: Level
  ui: FunState<Ui>
  /** Puzzle grew/shrank by (dCols, dRows) — mirror the change at art resolution. */
  resize(dCols: number, dRows: number): void
  setScale(s: number): void
  /** null when the art grid is entirely blank — nothing worth persisting. */
  toSaveData(): SolvedArt | null
}

/**
 * Solved-art authoring: a reward grid on its own palette + 1×–4× resolution,
 * edited on the same canvas as the puzzle (with the puzzle shown faintly
 * behind it) via a target toggle. Always exists — there's no separate
 * "enabled" state; a level simply has no solved art when the grid is left
 * entirely blank (see `toSaveData`), same as if you'd never touched it.
 */
export const createArtAuthoring = (puzzle: Level, puzzleUi: FunState<Ui>, savedArt: SolvedArt | null | undefined): ArtAuthoring => {
  const scale = savedArt?.scale ?? 1
  const ui = createUi(savedArt?.palette ?? [...puzzleUi.get().palette])
  const level = new Level({ title: puzzle.title, x: puzzle.x * scale, y: puzzle.y * scale, game: savedArt?.data, palette: ui.get().palette })

  const art: ArtAuthoring = {
    scale,
    target: 'puzzle',
    level,
    ui,
    resize(dCols, dRows) {
      if (dCols > 0) art.level.addCols(dCols * art.scale)
      else if (dCols < 0) art.level.subtractCols(-dCols * art.scale)
      if (dRows > 0) art.level.addRows(dRows * art.scale)
      else if (dRows < 0) art.level.subtractRows(-dRows * art.scale)
    },
    setScale(s) {
      const from = art.scale
      art.scale = s
      const nx = puzzle.x * s
      const ny = puzzle.y * s
      // Resample existing art into the new resolution: cells map by their puzzle
      // fraction (oldIdx = floor(newIdx * from / s)). Scaling up by an integer
      // factor (1→2, 1→3) is lossless block-duplication; scaling down or by a
      // non-integer ratio (3→2, 2→1) samples and loses detail.
      const old = art.level
      const cells: string[] = new Array(nx * ny)
      for (let cx = 0; cx < nx; cx++) {
        for (let cy = 0; cy < ny; cy++) {
          const ox = Math.min(old.x - 1, Math.floor((cx * from) / s))
          const oy = Math.min(old.y - 1, Math.floor((cy * from) / s))
          cells[cx * ny + cy] = old.grid.getAt(ox, oy)
        }
      }
      art.level = new Level({ title: puzzle.title, x: nx, y: ny, game: cells.join(''), palette: art.ui.get().palette })
    },
    toSaveData() {
      return art.level.isEmpty() ? null : { scale: art.scale, palette: [...art.ui.get().palette], data: art.level.getGame() }
    },
  }
  return art
}
