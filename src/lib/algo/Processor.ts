import { indexedPixelEquals, type IndexedImage } from "./IndexedImage";
import type { ColoredRect } from "./Rect";
import type { RectImage } from "./RectImage";

export function convertIndexedImageToRectImage(image: IndexedImage): RectImage {
  const rectFrames = image.frames.map((frame, frameIndex) => {
    const rects = convertIndexedImageToColoredRects(image, frameIndex);
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

function convertIndexedImageToColoredRects(image: IndexedImage, frameIndex: number): ColoredRect[] {
  // convert image into rects
  // using a greedy algorithm
  const flags: boolean[][] = Array.from({ length: image.height }, () =>
    new Array(image.width).fill(false)
  );

  const coloredRects: ColoredRect[] = [];

  for (let y = 0; y < image.height; y++) {
    for (let x = 0; x < image.width; x++) {
      // skip if already covered
      if (flags[y][x]) {
        continue;
      }

      let w = 1;
      let h = 1;

      // expand on both direction until we can't anymore
      while (canBeARect(image, frameIndex, flags, x, y, w + 1, h + 1)) {
        w++;
        h++;
      }

      // expand on width until we can't anymore
      while (canBeARect(image, frameIndex, flags, x, y, w + 1, h)) {
        w++;
      }

      // expand on height until we can't anymore
      while (canBeARect(image, frameIndex, flags, x, y, w, h + 1)) {
        h++;
      }

      // mark covered
      for (let yy = y; yy < y + h; yy++) {
        for (let xx = x; xx < x + w; xx++) {
          flags[yy][xx] = true;
        }
      }

      const color = image.frames[frameIndex].pixels[y][x];
      if (color) {
        coloredRects.push({
          x,
          y,
          width: w,
          height: h,
          color
        });
      }
    }
  }

  return coloredRects;
}

function canBeARect(
  image: IndexedImage,
  frameIndex: number,
  flags: boolean[][],
  x0: number,
  y0: number,
  w: number,
  h: number
): boolean {
  // check if we're in bounds
  if (x0 + w > image.width || y0 + h > image.height) {
    return false;
  }

  const frame = image.frames[frameIndex];

  // check if all pixels are the same and not already covered
  const firstPixel = frame.pixels[y0][x0];

  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) {
      const pixel = frame.pixels[y][x];
      if (flags[y][x] || !indexedPixelEquals(pixel, firstPixel)) {
        return false;
      }
    }
  }

  return true;
}
