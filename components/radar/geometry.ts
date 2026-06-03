import { AXES, type AxisScores } from '@/lib/scoring';

export interface Point {
  x: number;
  y: number;
}

/** Angle for an axis index, starting at the top and going clockwise. */
export function axisAngle(index: number): number {
  return (-90 + index * (360 / AXES.length)) * (Math.PI / 180);
}

export function pointForValue(
  index: number,
  value: number,
  cx: number,
  cy: number,
  radius: number,
): Point {
  const r = (value / 100) * radius;
  const a = axisAngle(index);
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

/** Axis scores in AXES order, with null mapped to 0 for the filled shape. */
export function scoresToValues(scores: AxisScores): number[] {
  return AXES.map((axis) => scores[axis] ?? 0);
}

export function polygonPoints(
  values: number[],
  cx: number,
  cy: number,
  radius: number,
): string {
  return values
    .map((v, i) => {
      const p = pointForValue(i, v, cx, cy, radius);
      return `${p.x.toFixed(2)},${p.y.toFixed(2)}`;
    })
    .join(' ');
}
