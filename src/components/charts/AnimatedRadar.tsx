"use client";

import { useEffect, useState } from "react";
import { RadarChart } from "@/components/charts/RadarChart";
import { NEUTRAL_SCORES, type HealthScores } from "@/types";

interface AnimatedRadarProps {
  scores: HealthScores;
  size?: number;
}

/**
 * Renders a RadarChart that animates from the neutral baseline to the target
 * scores once the component has mounted. Used on /profile so the chart "fills
 * in" as the page loads.
 */
export function AnimatedRadar({ scores, size = 200 }: AnimatedRadarProps) {
  const [current, setCurrent] = useState<HealthScores>(NEUTRAL_SCORES);

  useEffect(() => {
    const t = window.setTimeout(() => setCurrent(scores), 220);
    return () => window.clearTimeout(t);
  }, [scores]);

  return <RadarChart scores={current} size={size} />;
}
