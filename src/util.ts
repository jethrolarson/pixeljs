import { hexToRGB } from './color'
import { LevelData } from './level'

export function levelToDataURL(level: LevelData): string {
  const x = level.x ?? 10
  const y = level.y ?? 10
  const game = level.game ?? ''
  const palette = level.palette ?? ['#0000ff']
  const bg = hexToRGB(level.bgcolor ?? '#dddddd')

  const canvas = document.createElement('canvas')
  canvas.width = x
  canvas.height = y
  const ctx = canvas.getContext('2d')!
  const imageData = ctx.createImageData(x, y)

  // game is column-major: game[col * y + row] = cell at (col, row)
  // imageData is row-major: pixel at (col, row) = (row * x + col) * 4
  for (let col = 0; col < x; col++) {
    for (let row = 0; row < y; row++) {
      const colorIdx = parseInt(game.charAt(col * y + row) || '0')
      const color = colorIdx > 0 ? hexToRGB(palette[colorIdx - 1] ?? '#000000') : bg
      const i = (row * x + col) * 4
      imageData.data[i + 0] = color.r
      imageData.data[i + 1] = color.g
      imageData.data[i + 2] = color.b
      imageData.data[i + 3] = 0xff
    }
  }

  ctx.putImageData(imageData, 0, 0)
  return canvas.toDataURL()
}

export function debounce<T extends (...args: unknown[]) => void>(fn: T, wait: number): T {
  let timeout: ReturnType<typeof setTimeout> | null = null
  return ((...args: unknown[]) => {
    if (timeout !== null) clearTimeout(timeout)
    timeout = setTimeout(() => fn(...args), wait)
  }) as T
}
