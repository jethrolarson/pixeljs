import { style } from '@vanilla-extract/css'
import { inputBase, term } from "../common/inputBase";

export const titleInput = style({ ...inputBase, width: '100%' })

export const label = style({
  fontFamily: "inherit",
  color: term.text,
});

export const muteRow = style({
  fontFamily: "inherit",
  display: "flex",
  alignItems: "center",
  gap: 4,
});

export const signinMsg = style({
  fontFamily: "inherit",

  color: term.dim,
});

export const testLink = style({
  fontFamily: "inherit",
  marginLeft: 8,

  color: term.name,
});
