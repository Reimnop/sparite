export interface IndexedColor {
  index: number;
  opacity: number;
}

export interface ColorRgb {
  r: number;
  g: number;
  b: number;
}

export interface ColorOklch {
  l: number;
  c: number;
  h: number;
}

export function getColorRgbKey(color: ColorRgb): number {
  const r = color.r & 0xff;
  const g = color.g & 0xff;
  const b = color.b & 0xff;
  return (r << 16) | (g << 8) | b;
}

export function getColorHex(color: ColorRgb): string {
  const r = color.r & 0xff;
  const g = color.g & 0xff;
  const b = color.b & 0xff;
  const rHex = r.toString(16).padStart(2, "0");
  const gHex = g.toString(16).padStart(2, "0");
  const bHex = b.toString(16).padStart(2, "0");
  return `#${rHex}${gHex}${bHex}`;
}

export function indexedColorEquals(c1: IndexedColor, c2: IndexedColor): boolean {
  return c1.index === c2.index && c1.opacity === c2.opacity;
}

export function colorRgbEquals(c1: ColorRgb, c2: ColorRgb): boolean {
  return c1.r === c2.r && c1.g === c2.g && c1.b === c2.b;
}

export function rgbToOklch({ r, g, b }: ColorRgb): ColorOklch {
  const R = srgbToLinear(r / 255);
  const G = srgbToLinear(g / 255);
  const B = srgbToLinear(b / 255);

  // linear RGB -> LMS
  const l = 0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B;
  const m = 0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B;
  const s = 0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B;

  // cube root
  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);

  // LMS -> OKLab
  const L =  0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_;
  const a =  1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_;
  const b2 = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_;

  // OKLab -> OKLCH
  const C = Math.sqrt(a * a + b2 * b2);
  let h = Math.atan2(b2, a);
  if (h < 0) h += 2 * Math.PI;

  return { l: L, c: C, h };
}

function srgbToLinear(c: number): number {
  return c <= 0.04045
    ? c / 12.92
    : Math.pow((c + 0.055) / 1.055, 2.4);
}
