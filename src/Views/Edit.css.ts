import { style } from '@vanilla-extract/css'
import { inputBase, term } from "../common/inputBase";

export const titleInput = style({ ...inputBase, width: '100%' })

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
