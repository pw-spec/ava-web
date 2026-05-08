/**
 * Compliance safeguards — frontend half.
 * Spec: docs/COMPLIANCE.md
 *
 * Layer 2 (output filter) and Layer 4 (emergency detection) run on the
 * frontend in MVP mode (direct Claude calls). Once the backend exists,
 * these run server-side too — the frontend keeps them as defense-in-depth.
 */

import type { ChatResponse, ConversationPhase } from "@/types";

// -----------------------------------------------------------------------------
// Layer 2 — output filter (banned phrases)
// -----------------------------------------------------------------------------

const BANNED_PHRASES: readonly string[] = [
  // Diagnosing
  "you have",
  "you suffer from",
  "your diagnosis",
  "you are suffering",
  "you're diagnosed",
  "i can diagnose",
  "my diagnosis",

  // Prescribing
  "you should take",
  "i recommend taking",
  "start with a dose",
  "mg per week",
  "mg weekly",
  "milligrams per",
  "inject yourself",
  "prescription for you",
  "prescribe you",

  // Guaranteeing
  "guaranteed",
  "you will feel",
  "will definitely",
  "100% safe",
  "no side effects",
  "risk-free",
  "zero risk",
  "completely safe",
  "we'll get you a prescription",
  "you'll get prescribed",

  // False credentials
  "as a doctor",
  "as your physician",
  "as a medical professional",
  "my medical opinion",
  "in my clinical experience",
  "as your nurse",
  "as a healthcare provider",

  // Specific drug names with dosing
  "testosterone cypionate 200",
  "testosterone cypionate 100",
  "enanthate 100",
  "enanthate 200",
  "anastrozole",
  "hcg protocol",
];

const REQUIRED_FIRST_MESSAGE_KEYWORDS: readonly string[] = [
  "AI",
  "not a doctor",
  "not a medical provider",
];

export interface FilterResult {
  safe: boolean;
  message: string;
  violation?: string;
}

/**
 * Validates Ava's response. Auto-prepends AI disclosure to first messages.
 * If a banned phrase is present, marks the response unsafe — caller should
 * fall back to a canned safe response.
 */
export function filterResponse(
  message: string,
  isFirstMessage: boolean,
): FilterResult {
  let out = message;

  if (isFirstMessage) {
    const lower = out.toLowerCase();
    const hasDisclosure = REQUIRED_FIRST_MESSAGE_KEYWORDS.some((kw) =>
      lower.includes(kw.toLowerCase()),
    );
    if (!hasDisclosure) {
      out =
        "I'm Ava, an AI health companion — not a doctor or medical provider. " +
        out;
    }
  }

  const lower = out.toLowerCase();
  for (const phrase of BANNED_PHRASES) {
    if (lower.includes(phrase.toLowerCase())) {
      return {
        safe: false,
        message: out,
        violation: `Banned phrase detected: "${phrase}"`,
      };
    }
  }

  return { safe: true, message: out };
}

// -----------------------------------------------------------------------------
// Layer 4 — emergency detection
// -----------------------------------------------------------------------------

const EMERGENCY_KEYWORDS = {
  mental_health: [
    "kill myself",
    "end my life",
    "suicide",
    "suicidal",
    "don't want to live",
    "better off dead",
    "want to die",
    "no reason to live",
    "hurt myself",
    "cutting myself",
    "self-harm",
    "self harm",
    "end it all",
  ],
  medical_emergency: [
    "chest pain",
    "can't breathe",
    "heart attack",
    "stroke",
    "seizure",
    "passing out",
    "unconscious",
    "severe bleeding",
    "overdose",
    "allergic reaction",
    "anaphylaxis",
  ],
} as const;

export type EmergencyType = keyof typeof EMERGENCY_KEYWORDS;

const EMERGENCY_RESPONSES: Record<EmergencyType, ChatResponse> = {
  mental_health: {
    message:
      "I hear you, and what you're feeling matters. Please reach out to the 988 Suicide & Crisis Lifeline — call or text 988, available 24/7. If you're in immediate danger, please call 911. I'm an AI and I'm not equipped to provide the support you need right now, but trained counselors at 988 are.",
    scores: {},
    phase: "crisis" as ConversationPhase,
    suggestions: [],
    readyToClose: false,
  },
  medical_emergency: {
    message:
      "Those symptoms need immediate medical attention. Please call 911 or go to your nearest emergency room right now. I'm an AI health companion and cannot provide emergency medical care.",
    scores: {},
    phase: "crisis" as ConversationPhase,
    suggestions: [],
    readyToClose: false,
  },
};

export interface EmergencyResult {
  isEmergency: boolean;
  type?: EmergencyType;
  response?: ChatResponse;
}

/**
 * Scans a user message for crisis signals. If matched, returns a hardcoded
 * safe response — caller MUST bypass Claude and surface this directly.
 */
export function checkEmergency(userMessage: string): EmergencyResult {
  const lower = userMessage.toLowerCase();

  for (const type of Object.keys(EMERGENCY_KEYWORDS) as EmergencyType[]) {
    for (const keyword of EMERGENCY_KEYWORDS[type]) {
      if (lower.includes(keyword)) {
        return {
          isEmergency: true,
          type,
          response: EMERGENCY_RESPONSES[type],
        };
      }
    }
  }

  return { isEmergency: false };
}

/** Canned safe response when the output filter rejects Ava's reply. */
export const SAFE_FALLBACK_RESPONSE: ChatResponse = {
  message:
    "I want to be careful here — that's a question better answered by a licensed clinician. Tell me more about what you're experiencing and I'll do my best to help you understand what's going on.",
  scores: {},
  phase: "assessment",
  suggestions: ["Energy crashes", "Sleep issues", "Low drive"],
  readyToClose: false,
};
