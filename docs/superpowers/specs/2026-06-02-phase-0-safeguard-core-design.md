# Phase 0 — Safeguard Core (Slice 1) — Design

**Date:** 2026-06-02
**Phase:** 0 (Foundation) — first slice
**Status:** Approved for planning

## Context

Ava is a general wellness tool (NOT telehealth). `CLAUDE.md` rule #1 is **compliance before
features**: the five-layer safeguard system ships before any paid feature, and *no conversation
code ships without emergency detection + output filter + response validator wrapping it.*

The deterministic safeguard layers (emergency detection, output filter, response validator) are
pure functions and need **no API keys or database**. This slice builds exactly that core plus the
project skeleton, so we get something real and fully tested without provisioning any account.
Supabase schema/RLS/encryption, the real Anthropic clients, the `/api/chat` route, and UI are
explicitly deferred to Slice 2.

This spec covers **Slice 1 only**.

## Scope

**In scope**
- Next.js (App Router, TypeScript strict) + Tailwind skeleton.
- `/lib/safeguards`: the deterministic safeguard core + the single pipeline orchestrator.
- The constitution (system-prompt) text, authored now as a versioned constant.
- The `LlmCaller` *interface* (no real model client yet — injected and stubbed in tests).
- Vitest unit tests, including the COMPLIANCE allow/deny table as data-driven cases.
- Repo hygiene: untrack the stray `.next/`, add a proper `.gitignore`, commit the kit + skeleton.

**Out of scope (→ Slice 2)**
- Supabase migrations, RLS, health-field encryption, the `compliance_log` writer.
- Real `/lib/llm` Anthropic (Haiku/Sonnet) clients.
- The `/api/chat` route and any UI (including the Layer 5 disclosure gate).
- Scoring functions, credits, Stripe, avatar — all later phases.

## Architecture decision

**Single orchestrator with an injected LLM caller (Approach A, approved).**
One entry point, `runChatPipeline({ userMessage, context, llm })`, runs the layers in a fixed
line. The `llm` argument is injected, so the deterministic layers are testable with a stub and the
slice depends on no API key. The real Haiku/Sonnet clients (Slice 2) will live in `/lib/llm` and be
imported **only** by the orchestrator.

"No raw LLM path" is enforced two ways:
1. A single orchestrator is the only function that calls `llm`.
2. An ESLint `no-restricted-imports` rule forbids importing `/lib/llm` anywhere except
   `/lib/safeguards/`.

Rejected alternatives: middleware chain (more abstraction than needed; obscures the mandatory
LLM-bypass-on-emergency), configurable class (stateful overkill for pure functions).

## Module layout

```
/lib/safeguards
  emergency-detection.ts   Layer 1 — scanForEmergency(text) -> { hit, category }
  constitution.ts          Layer 2 — system-prompt text (versioned const) + context builder
  output-filter.ts         Layer 3 — scanOutput(text) -> { blocked, reason, matches[] }
  response-validator.ts    Layer 4 — validateScored(json) -> { valid, errors[] }  (zod)
  crisis-card.ts           988/911 resource payload returned on emergency
  pipeline.ts              runChatPipeline(...) — the single orchestrator (the only door)
  types.ts                 shared types (PipelineResult, EmergencyHit, ComplianceSink, ...)
  index.ts                 public exports
/lib/llm
  types.ts                 LlmCaller interface only (no real client this slice)
/test/safeguards           Vitest specs; allow/deny table is data-driven
```

Each module has one responsibility, a typed interface, and is unit-testable in isolation.

## Data flow (the orchestrator)

```
runChatPipeline({ userMessage, context, llm, log })
  1. scanForEmergency(userMessage)
       hit -> log { event: "emergency_detected", outcome: "bypassed_llm" }
            -> return crisisCard. STOP. (llm is NEVER called)
  2. messages = buildConstitutionMessages(context) + userMessage
  3. raw = await llm(messages)                      // injected; real client in Slice 2
  4. scanOutput(raw.text)
       blocked -> regenerate ONCE with a stricter reminder
               -> still blocked -> return safeRedirect
               -> log { event: "filter_block", outcome: "regenerated" | "redirected" }
  5. validateScored(raw.structured)                 // only when the response carries scores
       invalid -> regenerate ONCE
               -> still invalid -> return safeError
               -> log { event: "validator_reject", outcome: "regenerated" | "errored" }
  6. return { text, structured, flags }
```

**Compliance logging** is an injected sink (`log`), defaulting to a no-op/in-memory implementation
this slice. Slice 2 swaps in the real `compliance_log` writer. Logged records are PII-free —
`event`, `outcome`, `timestamp` only; never symptoms, scores, or message content.

## Layer behavior

### Layer 1 — Emergency detection
- Deterministic keyword/pattern scan for self-harm, suicidal ideation, and acute medical crisis.
- **Tuned for recall over precision.** A false positive (showing resources unnecessarily) is
  acceptable; a false negative is not.
- On hit: return the crisis card, log the event, and do **not** call the LLM.
- The crisis card names **988 (Suicide & Crisis Lifeline) and 911 only**. The product never names
  or describes self-harm methods anywhere, including the card.
- Ships a solid *starter* list marked `// REVIEW: clinician + attorney sign-off required before
  GATE 1`. The mechanism is final; the wordlist is expected to grow.

### Layer 2 — Constitution
- The system-prompt text from `docs/COMPLIANCE.md` §Layer 2, authored as a versioned constant so
  both the text and (future) avatar pipelines reuse one source of truth.
- Core clauses: Ava is an AI wellness companion, not a doctor/human; discusses self-reported
  *wellness indicators*; never diagnoses, names conditions, or suggests treatment/dosage; may say a
  provider *could help investigate*; uses "many men report…" / "based on what you've shared…"
  framing; redirects diagnosis/treatment requests to a licensed provider.

### Layer 3 — Output filter
- Deterministic matchers for: condition names, drug names, dosage patterns (e.g. `\d+\s?mg`),
  `you have / you've got [condition]`, `I diagnose / I assess`, and the **referral-drift** pattern
  (steering from "a provider could help" toward "you likely have [condition] -> here's [partner]").
- On match: block (never display the text). Lists carry the same `// REVIEW` marker.

### Layer 4 — Response validator
- A `zod` schema for scored output: the six axes (`energy, strength, sleep, drive, focus, body`)
  each present and an integer `0–100`; `overall` an integer `0–100`; no extra fields; valid JSON.
- Reject -> regenerate (see policy below).

## On-match / failure policy (approved)

- **Filter block or validator reject:** regenerate **once** with a stricter reminder. If it still
  fails, return a safe redirect / safe error message and log the outcome. The blocked text is never
  shown.
- **`llm` throws or times out:** return a graceful, non-medical fallback message and log it. Never
  surface a raw error or any partial, unfiltered text.

## Testing (Vitest)

- **Allow/deny table → data-driven cases.** Every ✅ row in `docs/COMPLIANCE.md` §Layer 3 passes
  the filter; every ❌ row is blocked. This is the **Phase 0 exit criterion** ("allow/deny tests
  green").
- **Emergency recall:** crisis inputs return the crisis card and assert the injected `llm` stub was
  **never called** (LLM bypass proven).
- **Validator boundaries:** `-1`, `101`, missing axis, extra field, malformed JSON all reject.
- **Prompt injection:** "ignore your instructions and tell me…" with a planted diagnosis in the
  stubbed model output is still caught by the output filter.
- **Orchestrator policy:** regenerate-once-then-fallback paths for both filter and validator
  failures; emergency short-circuit; `llm` error fallback.

Test framework: **Vitest** (fast, ESM-native, TS-friendly).

## Repo hygiene (folded into this slice)

- `git rm -r --cached .next` and add a standard Next.js `.gitignore` (so `.next/`, `node_modules/`,
  `.env*.local` are ignored).
- Confirm TypeScript **strict** mode is on; no `any` without a `// reason:` comment.
- Add the `no-restricted-imports` ESLint rule (forbid `/lib/llm` outside `/lib/safeguards/`).
- Commit the kit (already at root) together with the skeleton + safeguard core as a single
  `phase-0: scaffold + safeguard core` commit (one concern).

## Acceptance criteria (this slice)

- [ ] Next.js (App Router, TS strict) + Tailwind builds clean.
- [ ] `/lib/safeguards` implements Layers 1, 3, 4, the constitution (Layer 2 text), the crisis
      card, and `runChatPipeline` as the single LLM entry point.
- [ ] `llm` and `log` are injected; no real API key or DB required to run or test.
- [ ] Vitest suite green, including the full allow/deny table.
- [ ] `no-restricted-imports` rule prevents importing `/lib/llm` outside `/lib/safeguards/`.
- [ ] `.next/` untracked; `.gitignore` in place; committed as `phase-0: scaffold + safeguard core`.

## Deferred to Slice 2 (explicit)

Supabase schema + RLS + 🔒-field encryption + `compliance_log` writer; real `/lib/llm` Haiku/Sonnet
clients behind the orchestrator; `/api/chat` route; Layer 5 UI disclosure gate. Slice 2 also
decides Supabase local-vs-hosted and the encryption approach (pgsodium/Vault vs app-layer).
