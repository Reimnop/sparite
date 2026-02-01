import type { RawImage } from "$lib/algo/RawImage";
import type { Alignment } from "$lib/Alignment";
import type { PrefabType } from "$lib/PrefabType";

export type StaticGenerationFormType = "static";
export type AnimatedGenerationFormType = "animated";

export interface StaticGenerationFormData {
  type: StaticGenerationFormType;
  prefabName: string;
  prefabType: PrefabType;
  prefabDescription: string;
  pixelsPerUnit: number;
  lifetime: number;
  depth: number;
  horizontalAlignment: Alignment;
  verticalAlignment: Alignment;
  useHitObjects: boolean;
  image: RawImage;
}

export interface AnimatedGenerationFormData {
  type: AnimatedGenerationFormType;
  prefabName: string;
  prefabType: PrefabType;
  prefabDescription: string;
  pixelsPerUnit: number;
  lifetime: number;
  depth: number;
  horizontalAlignment: Alignment;
  verticalAlignment: Alignment;
  useHitObjects: boolean;
  speed: number;
  looped: boolean;
  image: RawImage;
}

export type GenerationFormData = StaticGenerationFormData | AnimatedGenerationFormData;