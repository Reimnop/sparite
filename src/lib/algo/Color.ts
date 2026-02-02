export interface IndexedColor {
  index: number;
  opacity: number;
}

export interface ColorRgb {
  r: number;
  g: number;
  b: number;
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
