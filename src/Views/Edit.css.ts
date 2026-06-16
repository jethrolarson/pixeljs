import { style } from '@vanilla-extract/css'
import { colors } from '../theme.css'

export const titleInput = style({ width: '100%' })

export const num = style({ width: '4em' })

export const label = style({ color: '#eee', fontSize: 13 })

export const muteRow = style({ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 })

export const signinMsg = style({ fontSize: 11, color: colors.textDim })

export const testLink = style({ marginLeft: 8, fontSize: 13 })
