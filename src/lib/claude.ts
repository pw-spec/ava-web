import type { ChatMessage, ChatResponse, ConversationPhase } from "@/types";

/**
 * MVP-only Claude API client. Direct browser → Anthropic API.
 * Per docs/ARCHITECTURE.md "MVP Shortcut", this is replaced by the backend
 * /chat endpoint before production. The API key is exposed to the client —
 * acceptable only for early demo, NEVER for production traffic.
 */

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-6";

interface CallClaudeArgs {
  systemPrompt: string;
  history: ChatMessage[];
  userMessage: string;
}

export class ClaudeError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
    this.name = "ClaudeError";
  }
}

export function hasClaudeKey(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY);
}

/**
 * Calls Claude directly from the browser. Returns parsed ChatResponse.
 * Throws ClaudeError on transport / parse failure — caller should fall back
 * to a safe canned response.
 */
export async function callClaude({
  systemPrompt,
  history,
  userMessage,
}: CallClaudeArgs): Promise<ChatResponse> {
  const apiKey = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new ClaudeError("NEXT_PUBLIC_ANTHROPIC_API_KEY is not set");
  }

  const messages = [
    ...history.map((m) => ({
      role: m.role === "ava" ? ("assistant" as const) : ("user" as const),
      content: m.content,
    })),
    { role: "user" as const, content: userMessage },
  ];

  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 800,
      system: systemPrompt,
      messages,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ClaudeError(
      `Anthropic API error: ${res.status} ${text.slice(0, 200)}`,
      res.status,
    );
  }

  const data = (await res.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };
  const text =
    data.content
      ?.filter((b) => b.type === "text")
      .map((b) => b.text ?? "")
      .join("")
      .trim() ?? "";

  return parseClaudeJson(text);
}

/** Strips ```json fences if present and parses the JSON envelope. */
function parseClaudeJson(text: string): ChatResponse {
  let body = text.trim();
  // Defensive — model occasionally wraps despite instructions.
  if (body.startsWith("```")) {
    body = body
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch (err) {
    throw new ClaudeError(
      `Could not parse Claude JSON: ${(err as Error).message}`,
    );
  }
  return normalizeResponse(parsed);
}

function normalizeResponse(raw: unknown): ChatResponse {
  if (!raw || typeof raw !== "object") {
    throw new ClaudeError("Claude response was not an object");
  }
  const r = raw as Record<string, unknown>;

  const message = typeof r.message === "string" ? r.message : "";
  if (!message) throw new ClaudeError("Claude response missing 'message'");

  const phase: ConversationPhase = isPhase(r.phase) ? r.phase : "assessment";

  const suggestions = Array.isArray(r.suggestions)
    ? r.suggestions.filter((s): s is string => typeof s === "string").slice(0, 4)
    : [];

  const readyToClose = r.readyToClose === true;

  const scores: ChatResponse["scores"] = {};
  if (r.scores && typeof r.scores === "object") {
    for (const [k, v] of Object.entries(r.scores as Record<string, unknown>)) {
      if (typeof v === "number" && Number.isFinite(v)) {
        scores[k as keyof ChatResponse["scores"]] = Math.max(
          0,
          Math.min(100, v),
        );
      }
    }
  }

  return { message, scores, phase, suggestions, readyToClose };
}

function isPhase(v: unknown): v is ConversationPhase {
  return (
    v === "greeting" ||
    v === "assessment" ||
    v === "education" ||
    v === "close" ||
    v === "crisis"
  );
}

// -----------------------------------------------------------------------------
// Mock mode — used when NEXT_PUBLIC_ANTHROPIC_API_KEY is missing.
// Lets the funnel be demoed end-to-end without burning Claude credits.
//
// Two scripts:
//   - "intake"   : 5-turn arc when /chat is hit directly with no intake data.
//                  Walks through energy → recovery → sleep → close. Returns
//                  scoped scores so the radar updates during the demo.
//   - "follow_up": 2-turn arc when the user came from /qualify. Does NOT
//                  return scores (they're already set from intake derivation
//                  and overwriting them would clobber real data). Closes with
//                  readyToClose so the transition back to /profile fires.
// -----------------------------------------------------------------------------

export type MockMode = "intake" | "follow_up";

const INTAKE_SCRIPT: ChatResponse[] = [
  {
    message:
      "I'm Ava, an AI health companion — not a doctor or medical provider. Tell me what's been off lately. Energy, sleep, training — anything's a fine place to start.",
    scores: {},
    phase: "greeting",
    suggestions: ["Energy crashes", "Bad sleep", "Lost my drive"],
    readyToClose: false,
  },
  {
    message:
      "That afternoon crash is something I hear from a lot of men who train hard. How long has this been the pattern — weeks, months, longer?",
    scores: { energy: 32 },
    phase: "assessment",
    suggestions: ["A few months", "Over a year", "Came on suddenly"],
    readyToClose: false,
  },
  {
    message:
      "Got it. Let's talk recovery — after a hard session, are you bouncing back the next day, or is the soreness sticking around 2-3 days?",
    scores: { energy: 30 },
    phase: "assessment",
    suggestions: ["Sticks around", "Bounce back fine", "Used to bounce back"],
    readyToClose: false,
  },
  {
    message:
      "That kind of recovery delay is commonly associated with hormonal shifts. Last piece — sleep. Are you sleeping through the night or waking up at 3am?",
    scores: { recovery: 28 },
    phase: "assessment",
    suggestions: ["Wake up early", "Hard to fall asleep", "Sleep is fine"],
    readyToClose: false,
  },
  {
    message:
      "I've got a clear enough picture. Let me show you your profile — these patterns are common, and a simple blood test tells us exactly where you stand.",
    scores: { sleep: 38, drive: 42, mood: 44, body: 46 },
    phase: "close",
    suggestions: [],
    readyToClose: true,
  },
];

const FOLLOW_UP_SCRIPT: ChatResponse[] = [
  // Index 0 is consumed by buildContextualGreeting on /chat — never used here.
  // The hook calls mockClaude(turnIndex) where turnIndex is the count of
  // existing Ava messages, so the first follow-up reply is index 1.
  {
    message:
      "Greeting placeholder — never used in follow-up mode. The contextual greeting from /chat replaces it.",
    scores: {},
    phase: "greeting",
    suggestions: [],
    readyToClose: false,
  },
  {
    message:
      "Got it — that lines up with what I'd expect for what you described. Anything else you didn't get a chance to mention?",
    scores: {},
    phase: "assessment",
    suggestions: ["Family history", "Current supplements", "Sleep schedule"],
    readyToClose: false,
  },
  {
    message:
      "Helpful context. Let me put this in your profile so the clinician sees it before reviewing your bloodwork.",
    scores: {},
    phase: "close",
    suggestions: [],
    readyToClose: true,
  },
];

export function mockClaude(
  turnIndex: number,
  mode: MockMode = "intake",
): ChatResponse {
  const script = mode === "follow_up" ? FOLLOW_UP_SCRIPT : INTAKE_SCRIPT;
  const idx = Math.min(turnIndex, script.length - 1);
  const r = script[idx];
  // Clone so callers can safely mutate scores.
  return { ...r, scores: { ...r.scores }, suggestions: [...r.suggestions] };
}
