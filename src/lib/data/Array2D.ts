export class Array2D<T> {
  public readonly width: number;
  public readonly height: number;

  private readonly vals: T[];

  constructor(width: number, height: number, defaultValue: T) {
    this.width = width;
    this.height = height;
    this.vals = new Array<T>(width * height).fill(defaultValue);
  }

  get(x: number, y: number): T {
    return this.vals[y * this.width + x];
  }

  set(x: number, y: number, value: T): void {
    this.vals[y * this.width + x] = value;
  }

  transpose(arr: Array2D<T>): void {
    if (this.width !== arr.height || this.height !== arr.width) {
      throw new Error("transpose: dimension mismatch");
    }

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        arr.set(y, x, this.get(x, y));
      }
    }
  }

  transposed(): Array2D<T> {
    const result = new Array2D<T>(this.height, this.width, this.vals[0]);
    this.transpose(result);
    return result;
  }
}