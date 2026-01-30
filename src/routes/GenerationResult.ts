import type { ColorRgb } from "$lib/algo/Color";
import type { ColoredRect } from "$lib/algo/Rect";
import type { PrefabType } from "$lib/PrefabType";

export interface GenerationResult {
  prefabName: string;
  prefabDescription: string;
  prefabType: PrefabType;
  pixelsPerUnit: number;
  lifetime: number,
	depth: number,
	useHitObjects: boolean,
  rects: ColoredRect[];
  palette: ColorRgb[];
  width: number;
  height: number;
}
