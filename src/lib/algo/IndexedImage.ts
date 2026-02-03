import { Array2D } from "$lib/data/Array2D";
import { type ColorRgb, type IndexedColor, getColorRgbKey, indexedColorEquals, rgbToOklch } from "./Color";
import type { RawImage, RawImageFrame } from "./RawImage";

export type IndexedPixel = IndexedColor | null;

export interface IndexedImageFrame {
  pixels: Array2D<IndexedPixel>;
  delay: number; // in milliseconds
}

export interface IndexedImage {
  width: number;
  height: number;
  frames: IndexedImageFrame[];
  palette: ColorRgb[];
}

export function createIndexedImage(rawImage: RawImage): IndexedImage {
  const { width, height, frames } = rawImage;

  // create palette
  const palette = createPalette(frames);

  // sort palette by oklch
  palette.sort((a, b) => {
    const aOklch = rgbToOklch(a);
    const bOklch = rgbToOklch(b);

    if (aOklch.l !== bOklch.l) {
      return aOklch.l - bOklch.l;
    }

    if (aOklch.c !== bOklch.c) {
      return aOklch.c - bOklch.c;
    }
    
    return aOklch.h - bOklch.h;
  });

  // create palette map
  const paletteMap = new Map<number, number>();
  palette.forEach((color, index) => {
    const colorKey = getColorRgbKey(color);
    paletteMap.set(colorKey, index);
  });

  // create indexed frames
  const indexedFrames: IndexedImageFrame[] = frames.map((frame) =>
    createIndexedImageFrame(frame, width, height, paletteMap)
  );

  return {
    width,
    height,
    frames: indexedFrames,
    palette
  };
}

export function indexedPixelEquals(p1: IndexedPixel, p2: IndexedPixel): boolean {
  if (p1 === p2) {
    return true;
  }
  if (!p1 || !p2) {
    return false;
  }
  return indexedColorEquals(p1, p2);
}

function createPalette(frames: RawImageFrame[]): ColorRgb[] {
  const paletteMap = new Map<number, number>();
  const palette: ColorRgb[] = [];
  for (const frame of frames) {
    for (let i = 0; i < frame.data.length; i += 4) {
      const r = frame.data[i];
      const g = frame.data[i + 1];
      const b = frame.data[i + 2];
      const a = frame.data[i + 3];
      if (a === 0) {
        continue; // transparent pixel
      }
      const color: ColorRgb = { r, g, b };
      accumulatePaletteMap(color, paletteMap, palette);
    }
  }
  return palette;
}

function accumulatePaletteMap(
  color: ColorRgb,
  paletteMap: Map<number, number>,
  palette: ColorRgb[]
) {
  const colorKey = getColorRgbKey(color);
  if (!paletteMap.has(colorKey)) {
    paletteMap.set(colorKey, palette.length);
    palette.push(color);
  }
}

function createIndexedImageFrame(
  frame: RawImageFrame,
  width: number,
  height: number,
  paletteMap: Map<number, number>
): IndexedImageFrame {
  const length = width * height * 4;
  if (frame.data.length !== length) {
    throw new Error("RawImageFrame data length does not match width and height");
  }

  const pixels = new Array2D<IndexedPixel>(width, height, null);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const r = frame.data[i];
      const g = frame.data[i + 1];
      const b = frame.data[i + 2];
      const a = frame.data[i + 3];

      if (a === 0) {
        pixels.set(x, y, null); // transparent pixel
        continue;
      }

      const color: ColorRgb = { r, g, b };
      const colorKey = getColorRgbKey(color);
      const index = paletteMap.get(colorKey);

      if (index === undefined) {
        pixels.set(x, y, null); // should not happen
        continue;
      }

      pixels.set(x, y, { index, opacity: a / 255 });
    }
  }
  return { pixels, delay: frame.delay };
}
