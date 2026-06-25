import { style } from '@vanilla-extract/css'
import { colors } from '../theme.css'

export const layout = style({ display: 'flex', gap: 32, alignItems: 'flex-start' })
export const form = style({ flex: 1, maxWidth: 480 })
export const previewCol = style({ width: 200 })

export const formGroup = style({ marginBottom: 16 })

export const label = style({
  display: 'block',
  color: colors.text,
  fontSize: 12,
  marginBottom: 4,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
})

export const input = style({ width: '100%' })

export const textarea = style({ width: '100%', minHeight: 80, resize: 'vertical' })

export const colorRow = style({ display: 'flex', gap: 8, alignItems: 'center' })

export const colorInput = style({
  width: 40,
  height: 34,
  padding: 2,
  border: `1px solid ${colors.border}`,
  borderRadius: 0,
  background: colors.panel,
  cursor: 'pointer',
})

export const presets = style({ display: 'flex', gap: 6, flexWrap: 'wrap' })

export const preset = style({
  width: 24,
  height: 24,
  borderRadius: 0,
  cursor: 'pointer',
  border: '2px solid transparent',
  transition: 'border-color 0.1s',
  ':hover': { borderColor: colors.textBright },
})

export const presetSelected = style({ borderColor: colors.textBright })

export const levelResults = style({
  background: colors.panelHover,
  border: `1px solid ${colors.border}`,
  borderRadius: 0,
  maxHeight: 200,
  overflowY: 'auto',
})

export const levelResult = style({
  padding: '8px 12px',
  cursor: 'pointer',
  color: colors.text,
  fontSize: 13,
  display: 'flex',
  justifyContent: 'space-between',
  ':hover': { background: colors.panelHover },
})

export const packLevels = style({
  listStyle: 'none',
  padding: 0,
  margin: '0 0 12px',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
})

export const packLevelItem = style({
  background: colors.panel,
  border: `1px solid ${colors.border}`,
  padding: '6px 10px',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
})

export const dragHandle = style({ cursor: 'grab', color: colors.textFaint, fontSize: 16 })

export const levTitle = style({ flex: 1, color: colors.text, fontSize: 13 })

export const addLabel = style({ color: colors.textFaint })

export const removeBtn = style({
  background: 'none',
  border: 'none',
  color: colors.textFaint,
  cursor: 'pointer',
  fontSize: 16,
  padding: '0 4px',
  ':hover': { color: colors.danger },
})

export const formActions = style({ display: 'flex', gap: 8, marginTop: 24, alignItems: 'center' })

export const previewLabel = style({
  color: colors.text,
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: 8,
})

export const publishRow = style({ display: 'flex', alignItems: 'center', gap: 10 })

export const publishLabel = style({ textTransform: 'none', fontSize: 14, color: colors.text, letterSpacing: 0, margin: 0, cursor: 'pointer' })

export const status = style({ fontSize: 13, color: colors.textDim })

export const heading = style({
  color: colors.text,
  fontSize: 13,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  margin: '0 0 10px',
})

export const hint = style({ fontSize: 12, color: colors.textDim, marginLeft: 8 })

export const emptyLevels = style({ color: colors.textFaint, fontStyle: 'italic', fontSize: 13, padding: '4px 0' })
