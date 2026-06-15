import { style } from '@vanilla-extract/css'
import { colors } from '../theme.css'

export const tabs = style({
  display: 'flex',
  borderBottom: `1px solid ${colors.border}`,
  marginBottom: 24,
})

export const tab = style({
  padding: '8px 20px',
  color: colors.textDim,
  textDecoration: 'none',
  borderBottom: '2px solid transparent',
  marginBottom: -1,
  cursor: 'pointer',
  background: 'none',
  borderTop: 'none',
  borderLeft: 'none',
  borderRight: 'none',
  fontSize: 14,
  ':hover': { color: '#ccc' },
})

export const tabActive = style({
  color: colors.textBright,
  borderBottomColor: colors.accent,
})

export const sortBar = style({
  display: 'flex',
  gap: 8,
  alignItems: 'center',
  marginBottom: 20,
  fontSize: 13,
  color: colors.textDim,
})

export const loadMoreWrap = style({ textAlign: 'center', marginTop: 24 })
