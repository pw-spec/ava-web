import {
  HEALTH_CATEGORIES,
  NEUTRAL_SCORES,
  type HealthCategory,
  type HealthScores,
} from "@/types";

/** Raw answer types after the user finishes the 9-step intake. */
export interface IntakeAnswers {
  state?: string;
  age?: number;
  primary_concern?: HealthCategory;
  duration?: "lt1mo" | "1to3mo" | "3to6mo" | "6to12mo" | "gt1yr";
  prior_eval?: "yes" | "no" | "once";
  conditions?: string[];
  medications?: string;
  fertility?: "yes" | "no" | "maybe";
  email?: string;
}

/**
 * Translate intake answers into a starting HealthScores object.
 * This is NOT a clinical scoring — it's the radar baseline before the
 * post-intake conversation refines it. Real numbers come from the lab panel.
 */
export function deriveScoresFromIntake(answers: IntakeAnswers): HealthScores {
  const scores: HealthScores = { ...NEUTRAL_SCORES };

  const concern = answers.primary_concern;
  if (concern && (HEALTH_CATEGORIES.some((c) => c.key === concern))) {
    // Drop the primary concern category by amount based on duration.
    const dropMap: Record<NonNullable<IntakeAnswers["duration"]>, number> = {
      lt1mo: 12,
      "1to3mo": 18,
      "3to6mo": 24,
      "6to12mo": 28,
      gt1yr: 32,
    };
    const drop = answers.duration ? dropMap[answers.duration] : 18;
    scores[concern] = Math.max(15, scores[concern] - drop);
  }

  // If the user has multiple flagged conditions, pull body/recovery slightly.
  const conditionCount = answers.conditions?.filter((c) => c !== "none").length ?? 0;
  if (conditionCount >= 1) {
    scores.body = Math.max(20, scores.body - 8);
    scores.recovery = Math.max(20, scores.recovery - 6);
  }

  // If they've been evaluated before and never followed up, mood gets a small dip.
  if (answers.prior_eval === "once") {
    scores.mood = Math.max(25, scores.mood - 6);
  }

  return scores;
}

export type IntakeAnswerValue =
  | string
  | number
  | string[]
  | undefined;
