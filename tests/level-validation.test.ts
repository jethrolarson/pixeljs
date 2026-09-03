import assert from 'node:assert/strict'
import test from 'node:test'
import { Level, MAX_PALETTE_COLORS, validateLevelData } from '../src/level'

const colors = (count: number): string[] =>
  Array.from({ length: count }, (_, i) => `#${i.toString(16).padStart(6, '0')}`)

const level = (overrides = {}) => ({
  x: 2,
  y: 2,
  game: '0120',
  palette: ['#000000', '#ffffff'],
  art: null,
  ...overrides,
})

test('accepts nine-color puzzle and solved-art encodings', () => {
  const palette = colors(MAX_PALETTE_COLORS)
  const data = level({
    game: '0987',
    palette,
    art: { scale: 1, palette, data: '9870' },
  })

  assert.doesNotThrow(() => validateLevelData(data))
  assert.equal(new Level(data).getGame(), '0987')
})

test('rejects a tenth puzzle or solved-art color', () => {
  assert.throws(
    () => validateLevelData(level({ palette: colors(10) })),
    /Puzzle palette must contain between 1 and 9 colors/,
  )
  assert.throws(
    () => validateLevelData(level({ art: { scale: 1, palette: colors(10), data: '0000' } })),
    /Solved-art palette must contain between 1 and 9 colors/,
  )
})

test('rejects malformed puzzle and solved-art colors', () => {
  const malformedPuzzleColor = level({ palette: ['not-a-color', '#ffffff'] })
  const nonStringPuzzleColor = level({ palette: [42, '#ffffff'] })
  const nonStringArtColor = level({ art: { scale: 1, palette: [{}], data: '0000' } })

  for (const data of [malformedPuzzleColor, nonStringPuzzleColor]) {
    assert.throws(
      () => validateLevelData(data as unknown as Parameters<typeof validateLevelData>[0]),
      /Puzzle palette contains an invalid color/,
    )
  }
  assert.throws(
    () => validateLevelData(nonStringArtColor as unknown as Parameters<typeof validateLevelData>[0]),
    /Solved-art palette contains an invalid color/,
  )
})

test('rejects malformed dimensions and solved-art scales', () => {
  for (const data of [level({ x: 0 }), level({ y: 1.5 }), level({ x: '2' })]) {
    assert.throws(
      () => validateLevelData(data as Parameters<typeof validateLevelData>[0]),
      /dimensions must be positive integers/,
    )
  }

  for (const scale of [0, 1.5, 5]) {
    assert.throws(
      () => validateLevelData(level({ art: { scale, palette: ['#000000'], data: '0000' } })),
      /scale must be an integer from 1 to 4/,
    )
  }
})

test('rejects malformed grid lengths and palette indices', () => {
  assert.throws(() => validateLevelData(level({ game: '010' })), /exactly 4 cells/)
  assert.throws(() => validateLevelData(level({ game: '0130' })), /outside its palette/)
  assert.throws(
    () => validateLevelData(level({ art: { scale: 2, palette: ['#000000'], data: '0'.repeat(15) } })),
    /exactly 16 cells/,
  )
  assert.throws(
    () => validateLevelData(level({ art: { scale: 1, palette: ['#000000'], data: '0020' } })),
    /outside its palette/,
  )
})
