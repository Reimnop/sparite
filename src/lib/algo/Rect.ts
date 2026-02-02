import type { IndexedColor } from "./Color";

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ColoredRect extends Rect {
  color: IndexedColor;
}
