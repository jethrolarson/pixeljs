/** Hard cap on levels per pack: keeps the in-session picker single-screen (no
 * pagination) and keeps packs to a finishable sitting. */
export const MAX_PACK_LEVELS = 20

/** Fixed size for an authored pack icon — bigger than a puzzle-solved-art
 * grid typically needs, since it's the only visual identity a pack has. */
export const PACK_ICON_SIZE = 16

/** Same shape as the relevant `LevelData` fields — a pack icon is just a small
 * paintable pixel grid, authored the same way as puzzle solved-art. */
export interface PackIcon {
  x: number
  y: number
  game: string
  palette: string[]
}

export interface PackData {
  id?: string
  title: string
  description?: string
  ownerId: string
  ownerName: string
  levelIds: string[]
  icon: PackIcon | null
  published: boolean
  featured: boolean
  featuredOrder?: number
  upvotes: number
  createdAt?: unknown
  updatedAt?: unknown
}
