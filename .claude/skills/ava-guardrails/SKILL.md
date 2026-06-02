---
name: ava-guardrails
description: Use this skill whenever writing or editing any code that calls an LLM, handles a conversation/chat/avatar turn, computes or stores health scores, builds the shareable brag card or Ava video, touches the credit ledger / pricing / refunds / credit expiration, or implements wind-down / data-deletion / liability tracking in the Ava project. It encodes the non-negotiable compliance, cost, and data-safety rules. Trigger on any work in /lib/safeguards, /lib/llm, /lib/scoring, /lib/avatar, /lib/credits, /api/chat, /api/avatar, /api/profile, /api/share, /api/stripe, or any admin/liability/sunset path.
---

# Ava Guardrails Skill

You are building Ava, a general wellness tool (NOT telehealth). Before writing code in any sensitive path, apply these rules. When in doubt, stop and ask — this is a compliance-sensitive, money-handling product.

## 1. No un-safeguarded LLM calls
Every call to Claude (Haiku or Sonnet) and every avatar conversation turn MUST pass through the safeguard pipeline: emergency detection → constitution (system prompt) → LLM → output filter → response validator. If you're about to write a "quick" direct LLM call, don't — route it through `/lib/safeguards`. There is no raw LLM path in this codebase.

## 2. Ava never makes medical claims
No diagnosis, no condition names, no drug names or doses, no "clinical assessment" language. Use "wellness indicators," "many men report," "a provider could help investigate." The output filter enforces this deterministically — but write prompts and copy so it rarely needs to fire. See the allow/deny table in `docs/COMPLIANCE.md`.

## 3. Scores are computed, not invented
The LLM extracts symptom signals into a typed schema. A pure function in `/lib/scoring` maps signals → 0–100 scores. Never ask the LLM to output the score directly. Keep scoring auditable.

## 4. Two artifacts, structurally separated
- Private profile = full, in-account, RLS-protected, includes per-axis scores + report.
- Brag card = reads ONLY from the `share_card_data` view (overall score, progress delta, radar silhouette). It must be *physically unable* to read per-axis 🔒 fields — enforce via DB grants/RLS, not just app code.
- Shareable Ava video = templated render (name/score/delta slots only), script passes the output filter at stricter thresholds. Never a per-user free-text generation.

## 5. Protect the avatar (cost)
- Free tier = text-only. Never give avatar minutes to anonymous/free users.
- Bill avatar by full session wall-clock; decrement the credit ledger server-side per minute.
- Money and credits are integers (cents / whole credits). Never floats.
- At the 20-session concurrency cap → graceful text fallback. Never "all agents busy," never silent paid-session queueing.

## 5A. Credits are a liability, not revenue
- Every credit grant has `expires_at` (default 12 months). Never implement "never expire."
- A refund must reverse the Stripe charge AND remove the corresponding credits **atomically** — a refunded user can't keep credits.
- Technical session failure → auto-refund the consumed credits (it's on us, not the user).
- Track outstanding liability (`sum(remaining credits × unit_price_cents)`); the operator never spends below it. Surface it on the owner-only `/admin/liability` view.
- Subscription cancel = period-end or pro-rated refund. Never take a monthly fee then kill service mid-period.
- Build the wind-down switches (`APP_SUNSET_MODE`, bulk refund, advance notice) as real tested capabilities. See `docs/CREDIT-LIABILITY-AND-EXIT.md`.

## 6. Data safety
- RLS on every table. Encrypt 🔒 health fields at rest. Minimize retention (store summaries, not raw transcripts). Service-role key server-side only.
- **PII and compliance logs live in separate stores.** `compliance_log` is de-identified (event + timestamp + outcome, never symptoms). On wind-down: delete PII, retain compliance logs. Build the separation now so that's one clean operation.

## 7. Geo + state
- Geo-block CA + NY (`GEO_BLOCK_STATES`). Apply disclosure + self-harm protocols everywhere regardless.
- Check user state against partner geo-rules before showing any referral link. Ava uses RevOffers partners only; CrakRevenue is Lux/Phase 3.

## 8. Phase discipline
Build in the order in `docs/BUILD-PLAN.md`. Don't implement Phase 3+ features (Lux, paid ads, wearables) before GATE 2. If a request jumps ahead, flag it.

## Quick self-check before committing sensitive code
- [ ] Does every LLM call go through the safeguard pipeline?
- [ ] Could any path emit a diagnosis/drug/dose? (filter + prompt both cover it)
- [ ] Can the share path read any 🔒 field? (it must not)
- [ ] Is avatar access gated to paid + metered by wall-clock?
- [ ] Are currency/credits integers?
- [ ] Do credit grants have `expires_at`? Do refunds reverse Stripe AND remove credits atomically?
- [ ] Are 🔒 fields encrypted and RLS-protected, and are compliance logs PII-free and in a separate store?
