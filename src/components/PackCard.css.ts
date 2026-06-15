import { style } from '@vanilla-extract/css'
import { colors } from '../theme.css'

export const card = style({ width: 160 })

export const cover = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 160,
  height: 160,
  borderRadius: 8,
  textDecoration: 'none',
  transition: 'opacity 0.15s',
  ':hover': { opacity: 0.85 },
})

export const icons = style({
  fontSize: 48,
  lineHeight: 1,
  textAlign: 'center',
  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))',
})

export const info = style({ padding: '8px 2px' })

export const titleLink = style({
  display: 'block',
  color: colors.textBright,
  fontSize: 13,
  fontWeight: 'bold',
  textDecoration: 'none',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  marginBottom: 2,
  ':hover': { color: '#fff' },
})

export const meta = style({
  fontSize: 11,
  color: colors.textDim,
  marginBottom: 6,
})

export const cardActions = style({ display: 'flex', gap: 4 })

export const voted = style({
  color: '#f90',
  borderColor: '#f90',
})

export const grid = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 16,
})
