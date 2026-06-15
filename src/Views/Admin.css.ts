import { style } from '@vanilla-extract/css'
import { colors } from '../theme.css'

export const sectionTitle = style({
  fontSize: 15,
  color: colors.textBright,
  margin: '24px 0 12px',
})

export const row = style({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  background: colors.panel,
  borderRadius: 6,
  padding: '8px 12px',
  marginBottom: 6,
})

export const cover = style({
  width: 40,
  height: 40,
  borderRadius: 6,
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 20,
})

export const titleBox = style({ flex: 1, minWidth: 0 })

export const titleLink = style({
  color: '#ccc',
  textDecoration: 'none',
  fontSize: 14,
  fontWeight: 'bold',
  ':hover': { color: colors.textBright },
})

export const sub = style({ color: colors.textDim, fontSize: 11 })

export const controls = style({ display: 'flex', alignItems: 'center', gap: 10 })

export const ctrlLabel = style({
  fontSize: 12,
  color: colors.text,
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  cursor: 'pointer',
})

export const orderInput = style({ width: '3.5em' })
