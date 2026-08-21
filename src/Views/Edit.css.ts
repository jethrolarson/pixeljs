import { style } from '@vanilla-extract/css'
import { term, mono } from './canvasPage.css'

const inputBase = {
  fontFamily: "inherit",
  background: term.bg,
  color: term.text,
  border: `4px solid ${term.dim}`,
  borderRadius: 0,
  padding: "3px 6px",
  selectors: { "&:focus": { outline: "none", borderColor: term.accent } },
} as const;

export const titleInput = style({ ...inputBase, width: '100%' })

export const num = style({ ...inputBase, width: '4em' })

export const label = style({
  fontFamily: "inherit",
  color: term.text,
  fontSize: 20,
});

export const muteRow = style({
  fontFamily: "inherit",
  display: "flex",
  alignItems: "center",
  gap: 4,
  fontSize: 20,
});

export const signinMsg = style({
  fontFamily: "inherit",
  fontSize: 20,
  color: term.dim,
});

export const testLink = style({
  fontFamily: "inherit",
  marginLeft: 8,
  fontSize: 20,
  color: term.name,
});
