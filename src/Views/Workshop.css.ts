import { style } from '@vanilla-extract/css'
import { colors } from '../theme.css'

export const sections = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 40,
})

export const grid = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 16,
})

export const card = style({ width: 160 })

export const thumbLink = style({
  display: 'block',
  width: 160,
  height: 160,
  borderRadius: 0,
  overflow: 'hidden',
  border: `1px solid ${colors.border}`,
  background: colors.panel,
})

export const thumb = style({
  width: '100%',
  height: '100%',
  objectFit: 'contain',
  imageRendering: 'pixelated',
})

export const cardInfo = style({ padding: '8px 2px' })

export const cardTitle = style({
  display: 'block',
  color: colors.textBright,
  fontSize: 13,
  fontWeight: 'bold',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  marginBottom: 6,
})

export const cardActions = style({ display: 'flex', gap: 4 })
