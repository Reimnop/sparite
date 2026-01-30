import type { Alignment } from "$lib/Alignment";
import type { PrefabType } from "$lib/PrefabType";

export interface GenerationFormData {
  prefabName: string;
  prefabType: PrefabType;
  prefabDescription: string;
  pixelsPerUnit: number;
  lifetime: number;
  depth: number;
  horizontalAlignment: Alignment;
  verticalAlignment: Alignment;
  useHitObjects: boolean;
  imageFile: File;
}
