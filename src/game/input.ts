import { Level } from '../level'
import { GameMode, GridPos } from './layout'

export type Sound = 'bing' | 'boom' | 'win'

export interface Pointer {
  x: number
  y: number
  pressed: boolean
  button: 'left' | 'right'
  newlyPressed: boolean
}

/** Drag-scoped interaction state that persists across frames. */
export interface Interaction {
  isErasing: boolean
  lastCell: string
}

export const createInteraction = (): Interaction => ({ isErasing: false, lastCell: '' })

export interface PointerSource {
  read(): Pointer
  /** Clear the per-press 'newlyPressed' edge; call once per frame after use. */
  afterFrame(): void
}

export function createPointer(canvas: HTMLCanvasElement, signal: AbortSignal): PointerSource {
  const state: Pointer = { x: 0, y: 0, pressed: false, button: 'left', newlyPressed: false }
  const opts = { signal }
  canvas.addEventListener('mousemove', (e) => { state.x = e.clientX; state.y = e.clientY }, opts)
  canvas.addEventListener('mousedown', (e) => {
    state.pressed = true
    state.button = e.button === 2 ? 'right' : 'left'
    state.newlyPressed = true
  }, opts)
  canvas.addEventListener('mouseup', () => { state.pressed = false }, opts)
  canvas.addEventListener('contextmenu', (e) => e.preventDefault(), opts)

  return {
    read: () => state,
    afterFrame: () => { state.newlyPressed = false },
  }
}

/**
 * Apply a paint / mark / edit action at `pos`. Mutates `level` + `it`.
 * Caller guarantees the puzzle isn't complete, the pointer is pressed, and
 * `pos` is inside the grid. Returns a sound for the caller to play.
 */
export function applyPointer(
  level: Level,
  mode: GameMode,
  activeColorIndex: number,
  pointer: Pointer,
  pos: GridPos,
  it: Interaction,
): Sound | null {
  const { x, y } = pos

  if (mode === 'play') {
    if (pointer.button === 'right') {
      if (pointer.newlyPressed) it.isErasing = level.mark.getAt(x, y) === '1'
      level.mark.setAt(x, y, it.isErasing ? '0' : '1')
      return null
    }
    if (pointer.newlyPressed) it.isErasing = level.paint.getAt(x, y) === String(activeColorIndex)
    const prev = level.paint.getAt(x, y)
    if (!it.isErasing && !+level.mark.getAt(x, y)) {
      const newVal = String(activeColorIndex)
      level.paint.setAt(x, y, newVal)
      if (prev === '0') return level.grid.getAt(x, y) === newVal ? 'bing' : 'boom'
    } else if (it.isErasing) {
      level.paint.setAt(x, y, '0')
    }
    return null
  }

  // edit mode: paint the solution grid
  if (pointer.newlyPressed) it.isErasing = level.grid.getAt(x, y) === String(activeColorIndex)
  const newVal = it.isErasing ? '0' : String(activeColorIndex)
  const curCell = `${x},${y}`
  if (level.grid.getAt(x, y) !== newVal) {
    level.grid.setAt(x, y, newVal)
    if (it.lastCell !== curCell || pointer.newlyPressed) return 'bing'
  }
  return null
}
