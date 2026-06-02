# Phase 1A — Radar + Landing — Design

**Date:** 2026-06-02
**Phase:** 1 (Ava MVP) — first slice (1A)
**Status:** Approved for planning

## Context

Phase 1 is large (landing, radar, scoring, chat, auth, credits, profile, brag card, Stripe, avatar,
referrals, legal). It is decomposed into slices 1A–1G; this spec covers **1A only** — the first
**visible** slice, chosen because it is the product's signature visual, needs no accounts/keys, and
lands the deterministic scoring logic the whole product depends on.

Builds on the committed Phase 0 safeguard core. Nothing in 1A calls an LLM, so the safeguard
pipeline is not invoked here — but the non-diagnostic framing (CLAUDE.md rule #2, COMPLIANCE) still
governs all copy.

## Scope

**In scope**
- `/lib/scoring`: deterministic signals → six-axis scores + overall + tier (pure, tested).
- Radar chart component (hand-rolled SVG, warm aesthetic, smooth animation, `??` for unscored axes).
- Landing page: warm hero + one CTA + an **interactive teaser** (3 sample questions → live radar).
- **Email-capture** CTA: form + `/api/waitlist` route (zod-validated) → dev-only local store.
- Persistent "AI · not medical advice" disclaimer (lightweight Layer-5 surface).
- Tests: scoring (Vitest/node) + real UI tests (Vitest + jsdom + Testing Library).

**Out of scope (later slices)**
- Auth, the full accepted-checkbox disclosure gate, geo-block → **1B**.
- Durable email/waitlist storage (Supabase table or marketing tool) → **1B**.
- Real chat / LLM-populated signals, live radar from a conversation → **1C**.
- Credits, Stripe, profile report, brag card, avatar, referrals → **1D–1G**.

## Architecture decision

**Hand-rolled SVG radar + a requestAnimationFrame lerp hook** — no charting library, no animation
library. Polygon points are computed from scores; transitions are produced by interpolating the
score *values* in React state each frame. Rationale: full control over the warm look, the `??`
gaps, and accessibility; avoids a generic chart-library aesthetic; minimal dependencies.

Rejected: chart libs (recharts/visx) — generic look, awkward `??` handling; Canvas — harder to test
and make accessible.

## Module layout

```
/lib/scoring
  types.ts        Axis, Severity, Signals, AxisScores, RadarProfile, Tier
  scoring.ts      computeAxisScores() · computeOverall() · tierForOverall() · computeProfile()
  index.ts        public exports
/lib/waitlist
  validate.ts     parseWaitlistEmail(input) -> { ok, email } | { ok: false, error }  (zod)
  store.ts        appendEmail(email) -> Promise<void>  (dev-only file store)
/components/radar
  RadarChart.tsx        SVG hexagon radar; 6 axes; soft gradient fill; renders ?? for null axes
  useAnimatedScores.ts  RAF lerp hook: animates current scores toward target
  TierBadge.tsx         overall score (credit-score style) + non-diagnostic tier label
/components/teaser
  RadarTeaser.tsx       3 sample questions -> Signals -> live RadarChart + email-capture CTA
  EmailCapture.tsx      validated email form with idle/submitting/success/error states
/app
  page.tsx              landing: hero + RadarTeaser + disclosure footer (replaces placeholder)
  api/waitlist/route.ts POST handler: parse -> store -> respond
/test
  scoring/scoring.test.ts        Vitest (node)
  waitlist/validate.test.ts      Vitest (node)
  components/radar-chart.test.tsx Vitest + jsdom (per-file env) + Testing Library
  components/radar-teaser.test.tsx
  components/email-capture.test.tsx
```

Each file has one responsibility. `/lib/scoring` and `/lib/waitlist/validate` are pure and
unit-tested; components consume them.

## Scoring model

Six axes: `energy, strength, sleep, drive, focus, body`. Each axis is described by a small set of
**signals** (PRODUCT-SPEC), each a `Severity` (`0 | 1 | 2 | 3 | 4`, higher = healthier):

| Axis | Signals |
|---|---|
| energy | fatigue, afternoon-crash, endurance |
| strength | recovery, performance |
| sleep | quality, duration, waking |
| drive | libido, motivation, ambition |
| focus | brain-fog, irritability, clarity |
| body | composition, weight, appearance |

Representation (kept simple per "good enough for now, revisit later"):

```ts
type Severity = 0 | 1 | 2 | 3 | 4;
type Signals = Partial<Record<Axis, Severity[]>>; // documented signal order per axis
```

Deterministic mapping (pure functions, the LLM never produces the number — ARCHITECTURE §Profile
computation):
- `computeAxisScores(signals)`: for each axis with a non-empty severity array,
  `score = round(mean(severities) / 4 * 100)` → integer 0–100; axes with no signals → `null`.
- `computeOverall(axisScores)`: `round(mean(non-null axis scores))`, or `null` if none scored.
- `tierForOverall(n)`: exact PRODUCT-SPEC thresholds —
  `>=80 Optimized · >=65 Solid · >=50 Room to Grow · >=35 Needs Attention · >=20 Flagged · else Critical`.
- `computeProfile(signals)`: `{ axes: AxisScores, overall, tier }`.

`null` axes render as `??` (the engagement gap). Tier **labels are non-diagnostic** (compliance);
they are descriptive, never a medical assessment.

## Interaction + aesthetic

**Direction: warm & human** (per brainstorm) — sand/off-white background, terracotta/warm-gold
accent, humanist sans, soft gradient radar fills. Consistent with Ava's warm companion tone.

- **Hero:** short warm headline + subhead + one primary CTA.
- **Teaser:** 3 tap-style questions (Energy? Sleep? Drive?), each a quick choice mapped to a
  `Severity`. Each answer animates its axis in (RAF lerp); the other 3 axes stay `??`. An overall
  score appears credit-score-style with the `TierBadge`.
- **CTA → email-capture:** "Get your full profile" reveals the `EmailCapture` form. The
  radar should feel **attractive and interactive** — smooth vertex animation, hover/active
  affordances on the questions, a satisfying score count-up.

## Email capture

- `EmailCapture.tsx`: controlled input, client-side validity hint, states idle → submitting →
  success → error. On submit, POST `{ email }` to `/api/waitlist`.
- `/api/waitlist/route.ts` (POST): `parseWaitlistEmail` (zod `.email()`); on failure → `400` with a
  safe message; on success → `appendEmail(email)` then `200 { ok: true }`. No LLM call (safeguard
  pipeline not required); does not log the raw email beyond the store write.
- `appendEmail` (dev store): append `{ email, ts }` as one JSON line to `.data/waitlist.jsonl`
  (gitignored). **Dev-only.** Durable storage + privacy handling (double-opt-in, retention) is
  **Slice 1B** — noted here so it is not forgotten.

## Compliance touches

- Persistent footer: **"AI · not medical advice"** and "Wellness indicators, not a medical
  assessment." (The full one-time accepted-checkbox gate / Layer-5 is Slice 1B.)
- No diagnosis, condition names, drug names, or "clinical assessment" language in any copy. Tier
  labels are the non-diagnostic set from PRODUCT-SPEC.

## Testing

- **Scoring (Vitest, node):** mean→score mapping incl. extremes (all 0 → 0, all 4 → 100), rounding,
  `null` for absent axes, `overall` = mean of scored-only and `null` when none, exact tier
  boundaries (79/80, 64/65, 49/50, 34/35, 19/20).
- **Waitlist validate (Vitest, node):** valid email passes; missing/`""`/`"not-an-email"`/non-string
  fail with `ok: false`.
- **Components (Vitest + jsdom via per-file `// @vitest-environment jsdom`, Testing Library):**
  - RadarChart renders 6 axis labels; shows `??` for `null` axes; applies the tier label for a given
    overall.
  - RadarTeaser: answering a question updates the rendered axis (no longer `??`) and shows an overall
    score.
  - EmailCapture: invalid email shows the error state and does not submit; valid email transitions to
    success (fetch mocked).
- New dev deps: `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`. Global Vitest env
  stays `node`; component tests opt into jsdom per-file.

## Branch & commits

New branch `phase-1a/radar-landing` off `main`. TDD throughout; `phase-1:` commit prefix, one
concern per commit.

## Acceptance criteria

- [ ] `/lib/scoring` pure functions implemented; Vitest green incl. tier-boundary + `??` cases.
- [ ] RadarChart renders all 6 axes with smooth animation and `??` for unscored; warm aesthetic.
- [ ] Landing page: hero + interactive teaser (3 questions drive the live radar) + disclosure footer.
- [ ] Email-capture form works against `/api/waitlist` (zod-validated; dev store); success/error UI.
- [ ] Real UI tests (jsdom + Testing Library) green for radar, teaser, and email form.
- [ ] `npm run lint` clean, `npm run build` succeeds, `npm run test` green.
- [ ] No medical-claim language anywhere in copy.

## Deferred (explicit)

Auth + accepted-checkbox disclosure gate + geo-block (1B); durable waitlist storage (1B); real chat
+ LLM-populated signals (1C); credits/Stripe/profile/brag card/avatar/referrals (1D–1G).
