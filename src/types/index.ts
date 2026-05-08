/**
 * Core domain types for the Ava / Lux frontend.
 * These mirror the Claude response contract documented in docs/SPEC.md.
 */

export type Brand = "ava" | "lux";

export type HealthCategory =
  | "energy"
  | "recovery"
  | "sleep"
  | "drive"
  | "mood"
  | "body";

export type HealthScores = Record<HealthCategory, number>;

export type ConversationPhase =
  | "greeting"
  | "assessment"
  | "education"
  | "close"
  | "crisis";

export type ChatRole = "user" | "ava";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
}

/** The JSON contract Ava returns from /chat. */
export interface ChatResponse {
  message: string;
  scores: Partial<HealthScores>;
  phase: ConversationPhase;
  suggestions: string[];
  readyToClose: boolean;
}

export interface BrandConfig {
  name: string;
  domain: string;
  tagline: string;
  cta: string;
  accent: string;
  personality: string;
}

export const HEALTH_CATEGORIES: ReadonlyArray<{
  key: HealthCategory;
  label: string;
  emoji: string;
}> = [
  { key: "energy", label: "Energy", emoji: "⚡" },
  { key: "recovery", label: "Recovery", emoji: "💪" },
  { key: "sleep", label: "Sleep", emoji: "🌙" },
  { key: "drive", label: "Drive", emoji: "🔥" },
  { key: "mood", label: "Mood", emoji: "🧠" },
  { key: "body", label: "Body", emoji: "📊" },
];

export const NEUTRAL_SCORES: HealthScores = {
  energy: 50,
  recovery: 50,
  sleep: 50,
  drive: 50,
  mood: 50,
  body: 50,
};

/** State-availability status — see src/lib/launchStates.ts. */
export type LaunchStateStatus =
  | "available"
  | "deferred" // we'll launch here later, capture waitlist
  | "no_partner" // clinical partner isn't licensed
  | "unknown";
