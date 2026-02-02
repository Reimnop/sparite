export function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6D2B79F5;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return (x ^ (x >>> 14)) >>> 0;
  };
}

export function intToId(n: number): string {
  const buf = new ArrayBuffer(4);
  const view = new DataView(buf);
  view.setUint32(0, n, false); // big-endian
  const bytes = new Uint8Array(buf);
  return btoa(String.fromCharCode(...bytes));
}
