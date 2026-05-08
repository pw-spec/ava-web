"use client";

import { useEffect, useRef, useState } from "react";
import { HEALTH_CATEGORIES, type HealthScores } from "@/types";

interface RadarChartProps {
  scores: HealthScores;
  size?: number;
  showLabels?: boolean;
  className?: string;
  /** Disable the smoothing animation (testing, reduced-motion). */
  animate?: boolean;
}

const ANGLE_STEP_DEG = 60;
const RING_LEVELS = [25, 50, 75, 100];
const TWEEN_MS = 800;

function vertex(cx: number, cy: number, r: number, i: number) {
  const rad = ((i * ANGLE_STEP_DEG - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

/** Approximation of CSS cubic-bezier(0.4, 0, 0.2, 1). */
function easeInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Tweens scores via rAF rather than CSS transitions, because <polygon> `points`
 * is not animatable as a CSS property. Honors prefers-reduced-motion.
 */
function useTweenedScores(target: HealthScores, durationMs: number): HealthScores {
  const [current, setCurrent] = useState<HealthScores>(target);
  const liveRef = useRef<HealthScores>(target);
  const targetKey = HEALTH_CATEGORIES.map((c) => target[c.key]).join("|");

  useEffect(() => {
    if (durationMs <= 0) {
      liveRef.current = target;
      setCurrent(target);
      return;
    }
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      liveRef.current = target;
      setCurrent(target);
      return;
    }

    const from = liveRef.current;
    const start = performance.now();
    let frameId = 0;

    const step = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const e = easeInOut(t);
      const next = {} as HealthScores;
      for (const cat of HEALTH_CATEGORIES) {
        next[cat.key] = from[cat.key] + (target[cat.key] - from[cat.key]) * e;
      }
      liveRef.current = next;
      setCurrent(next);
      if (t < 1) frameId = requestAnimationFrame(step);
    };

    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
    // Intentional: targetKey is a stringified hash of every category in
    // `target`. Listing the raw `target` object would re-run the effect on
    // every render due to identity changes; targetKey gives us a value-based
    // dependency that stabilizes when the actual scores haven't changed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetKey, durationMs]);

  return current;
}

export function RadarChart({
  scores,
  size = 160,
  showLabels = true,
  className = "",
  animate = true,
}: RadarChartProps) {
  const tweened = useTweenedScores(scores, animate ? TWEEN_MS : 0);

  const cx = 100;
  const cy = 100;
  const maxR = showLabels ? 68 : 82;
  const labelR = 90;

  const polyPoints = HEALTH_CATEGORIES.map((cat, i) => {
    const score = Math.max(0, Math.min(100, tweened[cat.key]));
    const r = (score / 100) * maxR;
    return vertex(cx, cy, r, i);
  });

  const ringPolyPoints = (level: number) =>
    HEALTH_CATEGORIES.map((_, i) => vertex(cx, cy, (level / 100) * maxR, i))
      .map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`)
      .join(" ");

  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Health profile radar chart"
      style={{ display: "block" }}
    >
      {/* Background rings — concentric hexagons */}
      {RING_LEVELS.map((level) => (
        <polygon
          key={level}
          points={ringPolyPoints(level)}
          fill="none"
          stroke="var(--border-ring)"
          strokeWidth="0.5"
        />
      ))}

      {/* Axis lines from center to each tip */}
      {HEALTH_CATEGORIES.map((cat, i) => {
        const tip = vertex(cx, cy, maxR, i);
        return (
          <line
            key={cat.key}
            x1={cx}
            y1={cy}
            x2={tip.x}
            y2={tip.y}
            stroke="var(--border-subtle)"
            strokeWidth="0.5"
          />
        );
      })}

      {/* Score polygon */}
      <polygon
        points={polyPoints
          .map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`)
          .join(" ")}
        fill="var(--accent-primary)"
        fillOpacity="0.12"
        stroke="var(--accent-primary)"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* Vertex dots */}
      {polyPoints.map((p, i) => (
        <circle
          key={HEALTH_CATEGORIES[i].key}
          cx={p.x}
          cy={p.y}
          r="3"
          fill="var(--accent-primary)"
          stroke="var(--bg-primary)"
          strokeWidth="1.25"
        />
      ))}

      {/* Emoji labels at axis tips */}
      {showLabels &&
        HEALTH_CATEGORIES.map((cat, i) => {
          const tip = vertex(cx, cy, labelR, i);
          return (
            <text
              key={cat.key}
              x={tip.x}
              y={tip.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="14"
              style={{ userSelect: "none" }}
              aria-hidden
            >
              {cat.emoji}
            </text>
          );
        })}
    </svg>
  );
}
