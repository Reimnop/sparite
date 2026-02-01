import { type ColorRgb, type IndexedColor, getColorRgbKey, indexedColorEquals } from "./Color";
import type { RawImage, RawImageFrame } from "./RawImage";

export type IndexedPixel = IndexedColor | null;

export interface IndexedImageFrame {
  pixels: IndexedPixel[][]; // row-major matrix of pixels, pixels[y][x]
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

  // create indexed frames
	const indexedFrames: IndexedImageFrame[] = frames.map(frame =>
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

function accumulatePaletteMap(color: ColorRgb, paletteMap: Map<number, number>, palette: ColorRgb[]) {
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

  const pixels: IndexedPixel[][] = [];
  for (let y = 0; y < height; y++) {
    const row: IndexedPixel[] = [];
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const r = frame.data[i];
      const g = frame.data[i + 1];
      const b = frame.data[i + 2];
      const a = frame.data[i + 3];

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
	return { pixels, delay: frame.delay };
}
