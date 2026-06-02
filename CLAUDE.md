# CLAUDE.md — Ava (Eigen Holdings)

This file is loaded automatically by Claude Code on every session. It is the single source of truth for *how* to build this project. Read it fully before writing code.

## What we're building

**Ava** is an AI wellness companion for men's health. A man talks to an AI avatar (face + voice + personality) and gets a real-time "wellness profile" — a six-axis radar chart — based on self-reported symptoms. We monetize via session sales, subscriptions, and (as upside) affiliate referrals.

**We are NOT a telehealth company.** We do not diagnose, prescribe, or treat. We are a *general wellness tool* under the FDA's Jan 2026 guidance. This positioning is legally load-bearing and constrains what the product may say (see `docs/COMPLIANCE.md`).

Full business context lives in `docs/business-strategy.md`. The technical contract lives in `docs/ARCHITECTURE.md`, `docs/DATA-MODEL.md`, `docs/COMPLIANCE.md`, `docs/CREDIT-LIABILITY-AND-EXIT.md`, and `docs/PRODUCT-SPEC.md`. The phased plan with gates lives in `docs/BUILD-PLAN.md`.

## Product north star (the goal behind every build decision)

**The business goal is revenue, and the primary driver of revenue is retention: users who stay attached to Ava and spend more time with the product are worth more.** When a product or design decision is otherwise a toss-up, choose the option that deepens the user's ongoing relationship with Ava — longer sessions, more return visits, subscription continuation, and habit formation. Ask of every feature: *does this give the user a reason to come back tomorrow and to keep coming back?*

Make it concrete in the build: memory that carries between sessions so Ava feels like it knows them; progress and trends over time (which require history → a reason to subscribe); the radar "??" gaps that pull toward completion; brag cards and progress cards that bring users back; and an avatar relationship genuinely worth returning to. Engagement, retention, and LTV are first-class success metrics, not afterthoughts.

**This goal operates within the non-negotiable rules below — and that is what protects the goal, not what limits it.** Ava is a companion chatbot serving men who may be vulnerable, regulated by AI-companion laws (CA SB 243, NY) that carry a private right of action. Attachment must be *earned* through real value and a relationship the user actually wants — never manufactured through manipulation, false medical hope, fabricated urgency, or dark patterns that exploit distress. Those tactics are the most direct path to the lawsuit or the loss-of-wellness-tool-status that would erase the revenue this north star exists to grow. Compliant, value-earned engagement is the only kind that compounds; retention that triggers SB 243 is negative revenue. When an engagement tactic and a compliance/safety rule conflict, the safety rule wins.

## Non-negotiable rules (these override convenience)

1. **Compliance before features.** The five-layer safeguard system (`docs/COMPLIANCE.md` §Safeguards) is built in Phase 0, before any paid feature. No conversation code ships without emergency detection + output filter + response validator wrapping it.
2. **Ava never makes medical claims.** No diagnosis ("you have low testosterone"), no dosing, no condition naming, no "clinical assessment" language. The output filter enforces this deterministically — but write prompts so it rarely has to fire. See the allow/deny table in `docs/COMPLIANCE.md`.
3. **The avatar is the most expensive thing in the system.** Never give it to anonymous traffic. The free tier is **text-only**. The shareable video is a **templated render**, never a per-user generation. Meter every avatar minute (see `docs/DATA-MODEL.md` credit ledger).
4. **Sensitive health data is encrypted at rest** and minimized. Never log raw symptom transcripts beyond what summarization needs. See `docs/DATA-MODEL.md` §Security.
5. **Two profile artifacts, never merged.** The *private profile* (full, informative, in-account only) and the *brag card* (sensitive data stripped, shareable). Sensitive content must never reach the brag card. See `docs/PRODUCT-SPEC.md` §Profile Artifacts.
6. **Geo-block CA + NY** at launch (AI companion laws). Apply disclosure + self-harm protocols **everywhere**, not just blocked states.
7. **Don't spend ahead of proof.** Build strictly in phase order (`docs/BUILD-PLAN.md`). Don't build Phase 3 (Lux, paid ads, wearables) until Phase 2's gate is met. If asked to skip ahead, flag it.
8. **Prepaid credits are a liability, not revenue.** Every credit grant has an expiry (`docs/CREDIT-LIABILITY-AND-EXIT.md`). Refund paths must reverse the Stripe charge AND remove credits atomically. The product must always be able to refund every outstanding balance and wind down cleanly (delete PII, retain de-identified compliance logs). Build the exit switches now, not on shutdown day.

## Tech stack (fixed — do not substitute without flagging)

- **Frontend + API:** Next.js (App Router) on Vercel, TypeScript
- **Styling:** Tailwind CSS
- **DB + Auth:** Supabase (PostgreSQL, Row Level Security ON, encryption at rest for health fields)
- **Text chat LLM:** Claude Haiku (cheap, fast)
- **Summaries + reports LLM:** Claude Sonnet
- **Avatar:** HeyGen LiveAvatar (Lite mode, Essential plan)
- **Voice + conversational agent:** ElevenLabs Conversational AI (STT + TTS + bundled LLM at launch)
- **Payments:** Stripe
- **Affiliate tracking:** RevOffers (Ava). CrakRevenue is Lux-only (Phase 3) — do not wire it into Ava.

> **Open architecture decision (flag before implementing avatar conversation):** the live avatar LLM is either (a) ElevenLabs' bundled LLM, or (b) Claude Sonnet routed separately. Default to (a) at launch. Do not silently pick (b) — it changes COGS. See `docs/ARCHITECTURE.md`.

## Repo conventions

- TypeScript strict mode on. No `any` without a `// reason:` comment.
- All secrets via environment variables. Never hardcode keys. See `.env.example`.
- Every route that calls an LLM must import and call the safeguard pipeline — there is no "raw" LLM call path in this codebase.
- Money/credits are integers (cents, whole credits). Never floats for currency.
- Commit messages: `phase-N: short description`. One concern per commit.
- Before implementing anything in a `docs/*` spec, if the spec is ambiguous, ask rather than guess — this is a compliance-sensitive product.

## Cost discipline (the numbers that protect the business)

- Realistic blended COGS: **$0.24–0.32 per avatar session-minute** (full wall-clock, not speech-only). Budget against the high end.
- Hard pricing floor: **$0.75/credit** for standard sales. $0.55 is Max-subscriber-only and volume-capped.
- Text message COGS: ~$0.0005 (Haiku). This is why free = text-only.
- At concurrency cap (20 sessions on Essential), **fall back to text-only gracefully** — never show "all agents busy," and never queue paid avatar sessions silently.
- **Credits expire** (`CREDIT_EXPIRY_MONTHS`, default 12) and are a tracked liability — never spend the bank balance below total outstanding credit value. See `docs/CREDIT-LIABILITY-AND-EXIT.md`.

## How to work in this repo

- Start each task by checking `docs/BUILD-PLAN.md` for the current phase and its acceptance criteria.
- Read the relevant spec doc before coding the feature it describes.
- The skills in `.claude/skills/` (and the public skills listed in `docs/SKILLS.md`) encode environment-specific best practices — consult the relevant SKILL.md before generating files of that type.
- When you finish a feature, update the checklist in `docs/BUILD-PLAN.md`.
