export function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

export function lerpArray(from: number[], to: number[], t: number): number[] {
  return to.map((v, i) => lerp(from[i] ?? 0, v, t));
}
