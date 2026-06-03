'use client';
import { AXES, AXIS_META, type RadarProfile } from '@/lib/scoring';
import { pointForValue, polygonPoints, scoresToValues } from './geometry';
import { useAnimatedScores } from './useAnimatedScores';
import { TierBadge } from './TierBadge';

const SIZE = 280;
const CENTER = SIZE / 2;
const RADIUS = 110;
const LABEL_RADIUS = RADIUS + 26;

export function RadarChart({ profile }: { profile: RadarProfile }) {
  const target = scoresToValues(profile.axes);
  const values = useAnimatedScores(target);

  return (
    <div className="flex flex-col items-center gap-4">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label="Wellness radar">
        <defs>
          <radialGradient id="ava-radar-fill" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--accent-2)" stopOpacity="0.55" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.30" />
          </radialGradient>
        </defs>

        {[0.25, 0.5, 0.75, 1].map((ring) => (
          <circle
            key={ring}
            cx={CENTER}
            cy={CENTER}
            r={RADIUS * ring}
            fill="none"
            stroke="var(--fg)"
            strokeOpacity={0.08}
          />
        ))}

        {AXES.map((_, i) => {
          const edge = pointForValue(i, 100, CENTER, CENTER, RADIUS);
          return (
            <line
              key={i}
              x1={CENTER}
              y1={CENTER}
              x2={edge.x}
              y2={edge.y}
              stroke="var(--fg)"
              strokeOpacity={0.08}
            />
          );
        })}

        <polygon
          points={polygonPoints(values, CENTER, CENTER, RADIUS)}
          fill="url(#ava-radar-fill)"
          stroke="var(--accent)"
          strokeWidth={2}
          strokeLinejoin="round"
        />

        {AXES.map((axis, i) => {
          const labelPoint = pointForValue(i, (LABEL_RADIUS / RADIUS) * 100, CENTER, CENTER, RADIUS);
          const score = profile.axes[axis];
          return (
            <text
              key={axis}
              x={labelPoint.x}
              y={labelPoint.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-[var(--fg)] text-[11px]"
            >
              <tspan>{AXIS_META[axis].label}</tspan>
              <tspan dx="4" className="font-semibold">
                {score === null ? '??' : String(score)}
              </tspan>
            </text>
          );
        })}
      </svg>

      <TierBadge overall={profile.overall} tier={profile.tier} />
    </div>
  );
}
