import type { Alignment } from "$lib/Alignment";
import type { RectImage } from "$lib/data/RectImage";
import type { PrefabType } from "$lib/PrefabType";

export interface GenerationResult {
  prefabName: string;
  prefabDescription: string;
  prefabType: PrefabType;
  pixelsPerUnit: number;
  lifetime: number;
	depth: number;
  horizontalAlignment: Alignment;
  verticalAlignment: Alignment;
	useHitObjects: boolean;
  rectImage: RectImage;
}
