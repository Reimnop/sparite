import type { ColorRgb } from "$lib/algo/Color";
import type { ColoredRect } from "$lib/algo/Rect";

export interface RectImage {
  rects: ColoredRect[];
  palette: ColorRgb[];
  width: number;
  height: number;
}
