import type { ColorRgb } from "./Color";
import type { ColoredRect } from "./Rect";

export interface RectImageFrame {
  rects: ColoredRect[];
  delay: number; // in milliseconds
}

export interface RectImage {
  width: number;
  height: number;
  frames: RectImageFrame[];
  palette: ColorRgb[];
}

export function determineObjectCount(frames: RectImageFrame[]): number {
  return Math.max(...frames.map((frame) => frame.rects.length));
}
