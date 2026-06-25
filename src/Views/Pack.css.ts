import { style } from '@vanilla-extract/css'
import { colors } from '../theme.css'

export const hero = style({
  display: 'flex',
  gap: 24,
  alignItems: 'flex-start',
  marginBottom: 32,
})

export const heroCover = style({
  width: 120,
  height: 120,
  border: `1px solid ${colors.border}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  fontSize: 40,
  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))',
})

export const heroInfo = style({ flex: 1 })

export const heroTitle = style({ margin: '0 0 4px', color: colors.textBright, fontSize: 22 })

export const heroMeta = style({ color: colors.textDim, fontSize: 13, marginBottom: 12 })

export const description = style({ color: colors.text, fontSize: 14, marginBottom: 16 })

export const heroActions = style({ display: 'flex', gap: 8 })

export const listHeading = style({
  color: colors.text,
  fontSize: 14,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  margin: '0 0 12px',
})

export const list = style({
  listStyle: 'none',
  padding: 0,
  margin: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
})

export const item = style({
  background: colors.panel,
  border: `1px solid ${colors.border}`,
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '10px 14px',
})

export const num = style({ color: colors.textFaint, fontSize: 13, minWidth: 24 })

export const itemTitle = style({
  flex: 1,
  color: colors.text,
  textDecoration: 'none',
  fontSize: 14,
  selectors: { '&:hover': { color: colors.textBright } },
})

export const itemMissing = style({ flex: 1, color: colors.textFaint, fontSize: 14, fontStyle: 'italic' })
