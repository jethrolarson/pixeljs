import { Component, hx } from "@fun-land/fun-web";
import * as styles from "./NumField.css";

/** A plain get/set unit — shaped like `FunState`'s `.get()`/`.set()` without
 * requiring the reactive machinery, for values (e.g. `Level` fields) that
 * aren't backed by FunState. */
export interface Settable<T> {
  get(): T;
  set(v: T): void;
}

export interface NumFieldProps {
  min: number;
  max: number;
  value: Settable<number>;
}

/**
 * Bare `<input type="number">` bound imperatively to `value`: parses the typed
 * input, applies it via `value.set` (a no-op on anything unparseable), then
 * snaps the field back to `value.get()` — covers both invalid input and
 * whatever clamping `set` does internally.
 */
export const NumField: Component<NumFieldProps> = (signal, { min, max, value }) =>
  hx("input", {
    signal,
    props: {
      type: "numeric",
      min: String(min),
      max: String(max),
      value: String(value.get()),
      className: styles.NumField,
    },
    on: {
      change: (e) => {
        let n = parseInt(e.currentTarget.value, 10);
        if (n > max) n = max;
        if (!Number.isNaN(n)) value.set(n);
        e.currentTarget.value = String(value.get());
      },
    },
  });
