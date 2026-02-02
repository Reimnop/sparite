import type { RectImage } from "$lib/algo/RectImage";
import type { Alignment } from "./Alignment";
import type { PrefabType } from "./PrefabType";

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
  speed: number;
  looped: boolean;
  rectImage: RectImage;
}
