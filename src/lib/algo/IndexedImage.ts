import { type ColorRgb, type IndexedColor, getColorRgbKey, indexedColorEquals } from "./Color";

export type IndexedPixel = IndexedColor | null;

export interface IndexedImage {
  width: number;
  height: number;
  pixels: IndexedPixel[][]; // row-major matrix of pixels, pixels[y][x]
  palette: ColorRgb[];
}

export interface RawImage {
  width: number;
  height: number;
  data: Uint8ClampedArray; // RGBA format
}

export function createIndexedImage(rawImage: RawImage): IndexedImage {
  const { width, height, data } = rawImage;

  const length = width * height * 4;
  if (data.length !== length) {
    throw new Error(`Data length ${data.length} does not match expected length ${length}`);
  }

  // create palette
  const paletteMap = new Map<number, number>();
  const palette: ColorRgb[] = [];
  for (let i = 0; i < length; i += 4) {
    const color: ColorRgb = {
      r: data[i],
      g: data[i + 1],
      b: data[i + 2]
    };
    const colorKey = getColorRgbKey(color);
    if (!paletteMap.has(colorKey)) {
      paletteMap.set(colorKey, palette.length);
      palette.push(color);
    }
  }

  // create pixel matrix
  const pixels: IndexedPixel[][] = [];
  for (let y = 0; y < height; y++) {
    const row: IndexedPixel[] = [];
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      
      if (a === 0) {
        row.push(null); // transparent pixel
        continue;
      }

      const color: ColorRgb = { r, g, b };
      const colorKey = getColorRgbKey(color);
      const index = paletteMap.get(colorKey);

      if (index === undefined) {
        row.push(null); // should not happen
        continue;
      }

      row.push({ index, opacity: a / 255 });
    }
    pixels.push(row);
  }

  return {
    width,
    height,
    pixels,
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
