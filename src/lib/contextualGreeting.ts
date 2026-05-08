import type { ChatResponse } from "@/types";
import type { IntakeAnswers } from "@/lib/intakeAnswers";
import { HEALTH_CATEGORY_OPTIONS } from "@/lib/intakeFlow";

const DURATION_PHRASE: Record<NonNullable<IntakeAnswers["duration"]>, string> = {
  lt1mo: "for less than a month",
  "1to3mo": "for the past few months",
  "3to6mo": "for three-to-six months",
  "6to12mo": "for most of this year",
  gt1yr: "for over a year now",
};

const NEUTRAL_GREETING: ChatResponse = {
  message:
    "I'm Ava, an AI health companion — not a doctor or medical provider. " +
    "What's been off lately? Energy, sleep, training — anything's a fine place to start.",
  scores: {},
  phase: "greeting",
  suggestions: ["Energy crashes", "Bad sleep", "Lost my drive"],
  readyToClose: false,
};

/**
 * Builds Ava's first message from the user's intake answers, so /chat feels
 * like a continuation of the conversation rather than a fresh greeting.
 * Returns the neutral greeting when no intake is present.
 */
export function buildContextualGreeting(
  intake: IntakeAnswers | null,
): ChatResponse {
  if (!intake?.primary_concern) return NEUTRAL_GREETING;

  const concern = HEALTH_CATEGORY_OPTIONS.find(
    (o) => o.value === intake.primary_concern,
  );
  if (!concern) return NEUTRAL_GREETING;

  const durationPhrase = intake.duration
    ? DURATION_PHRASE[intake.duration]
    : "lately";

  const message =
    `I went through your responses — thanks for the detail. ` +
    `${concern.label} ${durationPhrase} is something I'd want to dig into a little before your bloodwork. ` +
    `What's the worst version of it? Walk me through a typical bad day.`;

  // Custom suggestion pills based on primary concern.
  const suggestionMap: Record<string, string[]> = {
    energy: [
      "Crashes start mid-afternoon",
      "I drag through workouts",
      "Caffeine doesn't help anymore",
    ],
    recovery: [
      "Sore for 3+ days now",
      "Workouts wreck me",
      "Joints feel stiff",
    ],
    sleep: [
      "I wake up at 3am",
      "Hard to fall asleep",
      "Don't feel rested",
    ],
    drive: [
      "Libido is way down",
      "Lost the edge mentally",
      "Both, honestly",
    ],
    mood: [
      "Short fuse, irritable",
      "Brain fog all day",
      "Less motivated than I used to be",
    ],
    body: [
      "Belly fat, can't shift it",
      "Muscle's harder to build",
      "Weight gain over the year",
    ],
  };

  return {
    message,
    scores: {},
    phase: "assessment",
    suggestions: suggestionMap[intake.primary_concern] ?? [],
    readyToClose: false,
  };
}
