export interface RawImageFrame {
  data: Uint8ClampedArray; // RGBA format
  delay: number; // in milliseconds
}

export interface RawImage {
  width: number;
  height: number;
  frames: RawImageFrame[];
}