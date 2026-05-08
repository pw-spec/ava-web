import type { HealthCategory } from "@/types";

/**
 * Avatar-led intake flow. 9 steps, single-question-per-screen.
 * Ava narrates each question; the user answers via a structured input.
 * Every answer maps to a column the clinician needs.
 */

export type StepInput =
  | { kind: "state" }
  | { kind: "age"; min: number; max: number; default: number }
  | {
      kind: "single";
      options: ReadonlyArray<{
        value: string;
        label: string;
        helper?: string;
      }>;
    }
  | {
      kind: "multi";
      options: ReadonlyArray<{ value: string; label: string }>;
      noneValue: string;
      noneLabel: string;
    }
  | { kind: "yesno"; options: ReadonlyArray<{ value: string; label: string }> }
  | { kind: "text"; placeholder: string; allowEmpty: boolean }
  | { kind: "email" };

export interface IntakeStep {
  /** Stable id for keying. */
  id: string;
  /** Storage key in the answers map. */
  field: string;
  /** Ava's spoken line — 1-3 sentences, conversational. */
  ava: string;
  /** Optional clarifying line, smaller and dimmer. */
  helper?: string;
  /** The input widget. */
  input: StepInput;
  /** Validation: is the current answer good enough to advance? */
  validate: (value: unknown) => boolean;
}

export const HEALTH_CATEGORY_OPTIONS: ReadonlyArray<{
  value: HealthCategory;
  label: string;
  helper: string;
}> = [
  { value: "energy", label: "Energy", helper: "Afternoon crash, dragging through workouts" },
  { value: "recovery", label: "Recovery", helper: "Sore for days when it used to be one" },
  { value: "sleep", label: "Sleep", helper: "Waking up at 3am, hard to fall back" },
  { value: "drive", label: "Drive", helper: "Lost the edge — libido, ambition, both" },
  { value: "mood", label: "Mood", helper: "Irritable, foggy, can't focus the way you used to" },
  { value: "body", label: "Body", helper: "Weight on, muscle off, can't shift it" },
];

export const INTAKE_FLOW: ReadonlyArray<IntakeStep> = [
  {
    id: "state",
    field: "state",
    ava: "Where do you live? Quick state check before we go anywhere.",
    helper: "Available in 30+ US states. New York and California open later this year.",
    input: { kind: "state" },
    validate: (v) => typeof v === "string" && v.length === 2,
  },
  {
    id: "age",
    field: "age",
    ava: "And how old are you?",
    input: { kind: "age", min: 18, max: 75, default: 38 },
    validate: (v) => typeof v === "number" && v >= 18 && v <= 75,
  },
  {
    id: "primary_concern",
    field: "primary_concern",
    ava: "What's been off lately? Pick the one that's bugging you most.",
    helper: "We'll cover the others too.",
    input: { kind: "single", options: HEALTH_CATEGORY_OPTIONS },
    validate: (v) => typeof v === "string" && v.length > 0,
  },
  {
    id: "duration",
    field: "duration",
    ava: "How long has this been the pattern?",
    input: {
      kind: "single",
      options: [
        { value: "lt1mo", label: "Less than a month" },
        { value: "1to3mo", label: "1-3 months" },
        { value: "3to6mo", label: "3-6 months" },
        { value: "6to12mo", label: "6-12 months" },
        { value: "gt1yr", label: "More than a year" },
      ],
    },
    validate: (v) => typeof v === "string" && v.length > 0,
  },
  {
    id: "prior_eval",
    field: "prior_eval",
    ava: "Has anyone ever evaluated this — bloodwork, doctor visit, anything?",
    input: {
      kind: "yesno",
      options: [
        { value: "yes", label: "Yes — I've been evaluated" },
        { value: "no", label: "No — first time looking at this" },
        { value: "once", label: "Years ago, never followed up" },
      ],
    },
    validate: (v) => typeof v === "string" && v.length > 0,
  },
  {
    id: "conditions",
    field: "conditions",
    ava: "Any history of heart issues, prostate problems, or sleep apnea?",
    helper: "I have to ask — these change what your clinician can prescribe.",
    input: {
      kind: "multi",
      options: [
        { value: "heart", label: "Heart condition or high BP" },
        { value: "prostate", label: "Prostate issues" },
        { value: "sleep_apnea", label: "Sleep apnea" },
        { value: "diabetes", label: "Diabetes (type 1 or 2)" },
        { value: "blood_clots", label: "Blood clots / DVT history" },
        { value: "polycythemia", label: "Polycythemia or high hematocrit" },
      ],
      noneValue: "none",
      noneLabel: "None of these",
    },
    validate: (v) => Array.isArray(v) && v.length > 0,
  },
  {
    id: "medications",
    field: "medications",
    ava: "Currently on any prescription medication?",
    helper: "Brand or generic — your clinician will follow up if needed.",
    input: {
      kind: "text",
      placeholder: "e.g. Lisinopril 10mg, or 'none'",
      allowEmpty: false,
    },
    validate: (v) => typeof v === "string" && v.trim().length > 0,
  },
  {
    id: "fertility",
    field: "fertility",
    ava: "Are you trying to start a family in the next year or two?",
    helper:
      "TRT can affect fertility — we factor this into the protocol if it matters.",
    input: {
      kind: "yesno",
      options: [
        { value: "yes", label: "Yes — actively planning" },
        { value: "no", label: "No — not in the cards" },
        { value: "maybe", label: "Not sure yet" },
      ],
    },
    validate: (v) => typeof v === "string" && v.length > 0,
  },
  {
    id: "email",
    field: "email",
    ava: "Last thing — what's your email, so I can save your profile?",
    helper: "We'll never sell or share it.",
    input: { kind: "email" },
    validate: (v) =>
      typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
  },
];

export const TOTAL_STEPS = INTAKE_FLOW.length;
