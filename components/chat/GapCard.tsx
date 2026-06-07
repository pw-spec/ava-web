'use client';
import { AXES, AXIS_META, type RadarProfile } from '@/lib/scoring';
import { pointForValue, polygonPoints, scoresToValues } from '@/components/radar/geometry';
import { scoredAxisCount } from '@/lib/chat/gap';
import { Button } from '@/components/ui/button';
import { AvaBubble } from '@/components/chat/AvaBubble';

const SIZE = 180;
const C = SIZE / 2;
const R = 56;
const LABEL_R = R + 18;

/**
 * The Gap reveal — an inline, frozen snapshot of the radar shown once the user has mapped
 * 4 of 6 axes. Unscored axes render `??` with terracotta emphasis so the blanks pull the eye.
 * Soft teaser only; the purchase Decision CTA is a separate (later) beat.
 */
export function GapCard({ profile, onKeepGoing }: { profile: RadarProfile; onKeepGoing: () => void }) {
  const values = scoresToValues(profile.axes);
  const blanks = AXES.length - scoredAxisCount(profile);

  return (
    <AvaBubble className="max-w-[85%] p-4">
      <p className="text-sm font-medium">Here&apos;s where you&apos;re landing so far.</p>

        <div className="my-3 flex justify-center">
          <svg
            width={SIZE}
            height={SIZE}
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            role="img"
            aria-label="Wellness radar so far"
          >
            {[0.5, 1].map((ring) => (
              <circle key={ring} cx={C} cy={C} r={R * ring} fill="none" stroke="var(--fg)" strokeOpacity={0.08} />
            ))}

            {AXES.map((axis, i) => {
              const edge = pointForValue(i, 100, C, C, R);
              const isGap = profile.axes[axis] === null;
              return (
                <line
                  key={axis}
                  x1={C}
                  y1={C}
                  x2={edge.x}
                  y2={edge.y}
                  stroke={isGap ? 'var(--brand)' : 'var(--fg)'}
                  strokeOpacity={isGap ? 0.5 : 0.08}
                  strokeDasharray={isGap ? '3 3' : undefined}
                />
              );
            })}

            <polygon
              points={polygonPoints(values, C, C, R)}
              fill="var(--brand-2)"
              fillOpacity={0.3}
              stroke="var(--brand)"
              strokeWidth={2}
              strokeLinejoin="round"
            />

            {AXES.map((axis, i) => {
              const lp = pointForValue(i, (LABEL_R / R) * 100, C, C, R);
              const score = profile.axes[axis];
              const isGap = score === null;
              return (
                <text
                  key={axis}
                  x={lp.x}
                  y={lp.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className={isGap ? 'fill-brand text-[9px] font-semibold' : 'fill-[var(--fg)] text-[9px]'}
                >
                  <tspan>{AXIS_META[axis].label}</tspan>
                  <tspan dx="3" className="font-semibold">
                    {isGap ? '??' : String(score)}
                  </tspan>
                </text>
              );
            })}
          </svg>
        </div>

        <p className="text-sm font-semibold text-brand">{blanks} still blank.</p>
        <p className="mt-1 text-sm">
          Your full profile fills in all six — with a written read on what they mean together.
        </p>

      <Button onClick={onKeepGoing} variant="outline" className="mt-3 w-full">
        Keep going →
      </Button>
    </AvaBubble>
  );
}
