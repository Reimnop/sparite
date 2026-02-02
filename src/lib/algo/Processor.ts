import { Array2D } from "$lib/data/Array2D";
import { indexedPixelEquals, type IndexedImage, type IndexedPixel } from "./IndexedImage";
import type { ColoredRect, Rect } from "./Rect";
import type { RectImage } from "./RectImage";

export function convertIndexedImageToRectImage(image: IndexedImage): RectImage {
	const rectFrames = image.frames.map(frame => {
		const rects = convertIndexedImageToColoredRects(frame.pixels);
		return {
			rects,
			delay: frame.delay
		};
	});
	return {
		width: image.width,
		height: image.height,
		frames: rectFrames,
		palette: image.palette
	};
}

function convertIndexedImageToColoredRects(pixels: Array2D<IndexedPixel>): ColoredRect[] {
	// convert image into rects
	// using a greedy algorithm
	const flags = new Array2D<boolean>(pixels.width, pixels.height, false);

	const result: ColoredRect[] = [];

	for (let y = 0; y < pixels.height; y++) {
		for (let x = 0; x < pixels.width; x++) {
			// skip if already covered
			if (flags.get(x, y)) {
				continue;
			}

      const color = pixels.get(x, y);
      
      // skip transparent pixels
      if (!color) {
        flags.set(x, y, true);
        continue;
      }

			// expand rect
      const rect = expandRect(pixels, flags, x, y);

			// mark covered
			markRectAsCovered(flags, rect);

      // add to result
			result.push({ ...rect, color });
		}
	}

	return result;
}

function markRectAsCovered(
  flags: Array2D<boolean>,
  rect: Rect
): void {
  for (let y = rect.y; y < rect.y + rect.height; y++) {
    for (let x = rect.x; x < rect.x + rect.width; x++) {
      flags.set(x, y, true);
    }
  }
}

function expandRect(
  pixels: Array2D<IndexedPixel>,
	flags: Array2D<boolean>,
	x: number, 
	y: number
): Rect {
  let width = 1, height = 1;

  // expand on both directions
  while (canBeARect(pixels, flags, x, y, width + 1, height + 1)) {
    width++;
    height++;
  }

  // expand width
  while (canBeARect(pixels, flags, x, y, width + 1, height)) {
    width++;
  }

  // expand height
  while (canBeARect(pixels, flags, x, y, width, height + 1)) {
    height++;
  }

  return {
    x,
    y,
    width,
    height
  };
}

function canBeARect(
	pixels: Array2D<IndexedPixel>,
	flags: Array2D<boolean>,
	x0: number,
	y0: number,
	w: number,
	h: number
): boolean {
	// check if we're in bounds
	if (x0 + w > pixels.width || y0 + h > pixels.height) {
		return false;
	}

	// check if all pixels are the same and not already covered
	const firstPixel = pixels.get(x0, y0);

	for (let y = y0; y < y0 + h; y++) {
		for (let x = x0; x < x0 + w; x++) {
			const pixel = pixels.get(x, y);
			if (flags.get(x, y) || !indexedPixelEquals(pixel, firstPixel)) {
				return false;
			}
		}
	}

  return true;
}
