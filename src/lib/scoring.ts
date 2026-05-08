import { HEALTH_CATEGORIES, type HealthScores } from "@/types";

export type SeverityLevel = "good" | "moderate" | "poor" | "severe";

export function classifyScore(score: number): SeverityLevel {
  if (score >= 65) return "good";
  if (score >= 45) return "moderate";
  if (score >= 25) return "poor";
  return "severe";
}

export function severityColor(score: number): string {
  switch (classifyScore(score)) {
    case "good":
      return "var(--score-good)";
    case "moderate":
      return "var(--score-moderate)";
    case "poor":
      return "var(--score-poor)";
    case "severe":
      return "var(--score-severe)";
  }
}

/** Simple unweighted mean across the 6 categories. */
export function overallScore(scores: HealthScores): number {
  const sum = HEALTH_CATEGORIES.reduce((acc, c) => acc + scores[c.key], 0);
  return Math.round(sum / HEALTH_CATEGORIES.length);
}

/** Two lowest categories — used in the profile subtitle. */
export function weakestCategories(
  scores: HealthScores,
  count = 2,
): Array<{ key: keyof HealthScores; label: string; score: number }> {
  return HEALTH_CATEGORIES.map((c) => ({
    key: c.key,
    label: c.label.toLowerCase(),
    score: scores[c.key],
  }))
    .sort((a, b) => a.score - b.score)
    .slice(0, count);
}

export function severityHeadline(level: SeverityLevel): string {
  switch (level) {
    case "good":
      return "mild indicators";
    case "moderate":
      return "moderate indicators";
    case "poor":
      return "significant indicators";
    case "severe":
      return "considerable indicators";
  }
}
