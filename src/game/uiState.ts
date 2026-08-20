import { funState, FunState } from '@fun-land/fun-state'

/**
 * Reactive UI state for the canvas pages. Source of truth for the palette and
 * the active paint color; the render loop reads these via getters. `Level` keeps
 * the matrices/dimensions; palette colors live here so the editor can bind them.
 *
 * One `Ui` exists per editing target (e.g. Edit's puzzle vs. solved-art grids),
 * so anything that should stay put when the target switches — like mute —
 * belongs in its own state instead, not here.
 */
export interface Ui {
  activeColorIndex: number // 1-based
  palette: string[]
}

export const createUi = (palette: string[]): FunState<Ui> =>
  funState<Ui>({ activeColorIndex: 1, palette: [...palette] })
