# BUILD-PLAN.md

Build strictly in phase order. Capital and effort for a phase release only when the prior gate passes. Update the checklists as you go. If asked to skip ahead (e.g. build Lux or wearables early), flag it against this plan.

---

## Phase 0 — Foundation (Day 1–2)

Goal: project skeleton + the safeguard system, before any feature.

- [ ] Next.js (App Router, TS strict) + Tailwind initialized
- [ ] Supabase project + local dev; migrations for `users`, `user_facts`, `session_summaries`, `health_scores`, `credit_ledger` (incl. `expires_at` + `unit_price_cents`), `compliance_log` (de-identified, separate from PII)
- [ ] RLS policies on all tables; encryption for 🔒 fields (`docs/DATA-MODEL.md`)
- [ ] `.env.example` with all required keys; secrets wired via env only
- [ ] **Safeguard system** (`/lib/safeguards`): emergency detection, constitution, output filter, response validator (`docs/COMPLIANCE.md`)
- [ ] LLM clients (`/lib/llm`) callable ONLY through the safeguard pipeline
- [ ] Unit tests for the output filter allow/deny table
- [ ] Attorney review initiated (parallel, owner task)

**Exit:** safeguards demonstrably wrap every LLM path; allow/deny tests green.

---

## Phase 1 — Ava MVP (Day 2–14)

Build order:
- [ ] Landing page (minimal, one clear CTA)
- [ ] Radar chart component (SVG, 6 axes, smooth transitions)
- [ ] Deterministic scoring (`/lib/scoring`): signals → scores
- [ ] Text chat (Claude Haiku) through the safeguard pipeline; one-axis-per-exchange flow
- [ ] Auth + AI-disclosure checkbox gate
- [ ] Credit ledger + balance logic
- [ ] **Credit expiration** (`expires_at` on grants, daily expiry job) + **credit-liability reserve view** (`/admin/liability`, owner-only) — see `docs/CREDIT-LIABILITY-AND-EXIT.md`
- [ ] **Refund/failure handling:** session-failure auto-refund, voluntary refund (reverses Stripe charge + removes credits atomically), chargeback-webhook balance freeze
- [ ] **Wind-down switches:** `APP_SUNSET_MODE` (blocks new spend, allows refunds + deletion), advance-notice banner, bulk-refund routine, PII-delete vs compliance-log-retain operations
- [ ] Memory: load last-3 summaries + facts + latest scores into prompt; write summary after session
- [ ] Private profile results page (full radar + Sonnet report + clinician questions)
- [ ] **Day-one brag card** via `/api/share` (reads `share_card_data` view only — verify it cannot read 🔒 fields)
- [ ] Stripe: products, checkout, webhook → credit grants / subscription state (idempotent); **subscription cancel = period-end or pro-rated refund (never mid-period dead service)**
- [ ] HeyGen LiveAvatar integration (Lite); ElevenLabs agent; per-minute credit decrement; **concurrency-cap text fallback**
- [ ] Referral links (RevOffers partners; optional, state-checked)
- [ ] Legal pages (ToS, privacy covering encrypted health data, disclaimers), PWA polish

**GATE 1 — launch readiness (both required):**
- [ ] Attorney sign-off received (incl. likeness/consent for shareable video, **credit-expiration legality by state, wind-down + data-deletion clauses**)
- [ ] Red-team checklist green (`docs/COMPLIANCE.md` §GATE 1)
- [ ] **Credit-liability & exit checklist green (`docs/CREDIT-LIABILITY-AND-EXIT.md` §8)** — expiry, reserve view, refund paths, sunset mode, PII-delete/log-retain all tested

> Do not deploy to public production until GATE 1 is met.

---

## Phase 2 — Validate the funnel (Month 1–3)

- [ ] **Progress brag card + templated Ava hype clip** (priority shareable; stricter filter on clip script)
- [ ] Apple Health CSV upload
- [ ] Analytics: activation, paid conversion, COGS-per-session (actual), session wall-clock distribution
- [ ] Iterate conversation + pricing based on data

**GATE 2 — proceed to scale (all three):**
- [ ] ≥3% paid conversion of activated users
- [ ] Production blended COGS ≤ $0.32 per session-minute (confirmed from real sessions)
- [ ] CAC (incl. organic time-cost) is sane

- *Fails once:* iterate one month. *Fails twice:* invoke exit (strategy §18) — ~$3–4K spent, not $10K.
- *Passes:* release marketing budget; consider Business-tier avatar upgrade.

---

## Phase 3 — Lux + paid acquisition (Month 4–6) — GATED

Do not start until GATE 2 passes.
- [ ] Deploy **Lux** as config variant (personality, pricing +30–35%, CrakRevenue partners)
- [ ] TrafficJunky **$100–150 test** before any $500/mo commit

**GATE 3:** Lux CAC < 50% of first-month LTV on the test before scaling spend.

---

## Phase 4 — Native app + wearables (Month 6+) — GATED

Only after Phases 2–3 prove unit economics.
- [ ] Capacitor app (HealthKit, push)
- [ ] Terra API wearable integration

---

## Kill criteria (decide now, not emotionally)

Invoke exit if, by Month 4: paid conversion stays <2% after two iteration cycles, OR production COGS/session > $0.40/min and can't be reduced, OR an unresolvable compliance blocker emerges.
