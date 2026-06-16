import { funState, FunState } from '@fun-land/fun-state'

/**
 * Reactive UI state for the canvas pages. Source of truth for the palette and
 * the active paint color; the render loop reads these via getters. `Level` keeps
 * the matrices/dimensions; palette colors live here so the editor can bind them.
 */
export interface Ui {
  activeColorIndex: number // 1-based
  mute: boolean
  palette: string[]
}

export const createUi = (palette: string[]): FunState<Ui> =>
  funState<Ui>({ activeColorIndex: 1, mute: false, palette: [...palette] })
