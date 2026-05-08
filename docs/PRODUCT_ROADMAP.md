# Product Roadmap — Ava Health

> Phased plan derived from the May 7, 2026 competitive service-coverage
> analysis. Each phase lists what to add, what's required from vendors,
> the code scaffolding that's already in place, and what's deferred (with
> reasons).
>
> Source: see `docs/business_context.md` §0 audit summary + the
> competitive analysis thread from May 7, 2026 (Hone Health, Henry Meds,
> Marek Health, Defy Medical, Hims, Function Health surveys).
>
> **Status of the catalog:** the canonical service taxonomy lives in
> `src/lib/serviceCatalog.ts`. Each entry has `phase` and `enabled`
> flags. Future code reads from there — not from this doc.

---

## Phase rule of thumb

```
Phase 1   = ships at launch (live in catalog + UI)
Phase 1.5 = ships within 30-90 days of launch — vendor-blocked, code-light
Phase 2   = Month 3-6 — backend integration required
Phase 2.5 = Month 6-9 — wearable / Apple Health (mobile app likely required)
Phase 3   = Month 9-12 — CGM correlation + AI longitudinal pattern detection
Never     = explicit scope rejections (with reasons)
```

---

## Phase 1 (live at launch)

| Service | Status | Vendor dependency | Code scaffolding |
|---|---|---|---|
| Injectable testosterone (cypionate) | ✅ live | OpenLoop / CareValidate clinician + compounding pharmacy | Wired through Pricing + Labs |
| Anastrozole (when clinically indicated, no extra fee) | ⚠️ confirm | OpenLoop protocol must include | Catalog entry, FAQ entry |
| HCG (testicular function during TRT) | ⚠️ confirm | OpenLoop protocol | Catalog entry |
| Enclomiphene (fertility-preserving alternative) | ⚠️ confirm | OpenLoop offers protocol | Catalog entry, FAQ entry, intake question already captures family-planning intent (`/qualify` step 8) |
| 17+ marker hormone panel | ✅ live | Quest (or partner) | `IncludedPanel` component |
| Clinician evaluation + Rx if appropriate | ✅ live | OpenLoop / CareValidate | Wired |
| Quarterly lab monitoring | ✅ live | Quest + clinician review | Pricing copy claims; vendor confirms cadence |
| Premium tier: Sermorelin + NAD+ | ⚠️ confirm | Compounding pharmacy supports | `serviceCatalog.ts` + Pricing premium tier |
| Quarterly video consult (premium) | ⚠️ confirm | OpenLoop video infra | Pricing premium tier copy |
| AI-guided intake (Ava) | ✅ live (us) | none | `/qualify` 9-step flow |
| 30-day money-back | ✅ live (us) | partner must support refund flow | Pricing + Labs copy |
| HSA/FSA accepted | ✅ live (us) | Stripe + payments | Pricing copy |

**Pre-launch action:** the ⚠️ items must be confirmed in the May 19
CareValidate call or equivalent OpenLoop conversation. See
`docs/VENDOR_CALL_PREP.md` §1.

---

## Phase 1.5 (Month 1-3 post-launch — vendor-blocked, code-light)

Goal: bring the $299 Premium tier to feature parity with Hone Premium
($149+ effective with 40+ markers) and Marek's positioning. Today the
Premium has 3 advanced markers (IGF-1, hsCRP, ferritin) on top of base
17 — Hone has 40+, Marek has 60-100+. Not enough air to defend $299.

| Add | Code change | Vendor change | Effort |
|---|---|---|---|
| Expand Premium panel from ~20 to ~30 markers — add ApoB, Lp(a), HbA1c, fasting insulin, B12, vitamin D, total bilirubin | Update `IncludedPanel.tsx` to render Base vs Premium variants. Catalog entry already there (`advanced-panel`, `enabled: false` → flip to `true`). | Quest add markers to panel; OpenLoop confirms clinician will interpret | 4 hrs code, ~2 weeks contract |
| Specific 6-month lab cadence on Base, 90-day on Premium | FAQ + Pricing copy | OpenLoop confirms | 1 hr code |
| Async clinician messaging at Premium tier | Mini chat surface in `/profile` for "send your clinician a note." Lives outside the Ava conversation. | OpenLoop messaging API + BAA | 1 day code |

Catalog entry `advanced-panel` is currently `phase: "phase_1_5", enabled: false`. Flip to `enabled: true` after vendor confirmation, and the Premium panel rendering will pick up the additional markers.

---

## Phase 2 (Month 3-6 — backend integration)

The biggest service expansion. Targets the ~70% of TRT patients who also
want ED Rx and the hormone-mediated hair loss adjacency. Requires real
backend.

| Add | Code change | Vendor change | Effort |
|---|---|---|---|
| ED treatment (sildenafil, tadalafil) | New `/services/ed` page; intake question added ("any ED concerns?"); pricing add-on; pharmacy fulfillment wired | OpenLoop ED protocol; compounding pharmacy adds these meds | 2-3 days code + backend |
| Hair loss (finasteride, minoxidil) | Same pattern | OpenLoop hair protocol; pharmacy adds | 2-3 days code |
| Async patient↔clinician messaging | Real chat surface (not Ava) — `/messages` page, polling or Server-Sent Events from backend | OpenLoop messaging API + BAA | 1 week code |
| Prescription refill self-service | UI to request refill + clinician approval flow | OpenLoop refill API | 3-4 days |
| Crisis-flow handoff to clinical team | When `checkEmergency()` fires, post to OpenLoop's crisis intake endpoint | OpenLoop crisis-intake endpoint | 1 day |

Catalog entries: `ed-treatment`, `hair-loss`, `async-messaging`,
all currently `phase: "phase_2", enabled: false`.

**Why not now:** these all need the backend that hasn't been built. The
MVP-shortcut frontend → Claude direct path doesn't support stateful
clinician messaging, refills, or crisis handoffs.

---

## Phase 2.5 (Month 6-9 — wearable + ambient data)

Where the real moat is. Nobody in TRT does this well. AI as the
*interpretation layer* over symptoms × biomarkers × wearable data is
what makes Ava irreplaceable, not "just another intake form."

| Add | Code change | Vendor change | Effort |
|---|---|---|---|
| Apple Health import (HRV, sleep, activity, weight) | Likely requires native iOS app — HealthKit-on-web is limited. Or use Apple Health Records API for clinical-only subset. | Apple Developer cert + entitlement | 2-3 weeks (full app build) |
| Oura Ring integration | OAuth, periodic sync, store readiness/HRV/sleep in patient state. Stub already in `src/lib/wearables.ts`. | Oura developer API access | 3-4 days |
| Whoop integration | Same pattern | Whoop developer API | 3-4 days |
| Ava conversation references wearable data | Update system prompt to allow her to ask about HRV trend, sleep stages. New context channel into Claude. | Backend stores + summarizes wearable data per patient | 1 week |

Catalog entries: `apple-health`, `oura`, `whoop`,
`phase: "phase_2_5", enabled: false`.

**Strategic priority:** of the three wearable providers, **Oura first**
(OAuth-only, no native app required). Apple Health behind it because of
mobile-app prerequisite.

---

## Phase 3 (Month 9-12 — CGM + AI pattern detection)

Aspirational. Begins to overlap with Levels Health for "metabolic
optimization" — the boundary expansion that makes Ava more than just a
TRT clinic.

| Add | Code change | Vendor change | Effort |
|---|---|---|---|
| CGM correlation (Stelo or Lingo) | Same OAuth pattern as Oura/Whoop. Glucose data into patient state. Catalog entry already stubbed. | Stelo or Lingo developer API | 3-4 days |
| Longitudinal AI pattern detection | "Your free T at 480 looks fine, but your Oura HRV is down 18% over 30 nights and your fasting glucose hit 102 last lab — your recovery isn't a hormone problem, it's a sleep + glycemic problem." | Backend analytics + Claude system-prompt update | 1-2 weeks |
| Before/after radar comparison at Day 90 / Day 180 / Day 365 | UI on `/profile` showing protocol effects | Stored historical biomarkers | 3-4 days |
| Outcome data flywheel — published TRT-completion + symptom-resolution rates | Analytics + content piece | Aggregated patient data + writing | Ongoing |

Catalog entry: `cgm-correlation`,
`phase: "phase_3", enabled: false`.

**Real moat material:** this is where Ava becomes structurally
uncopyable. Hone, Henry, Marek would have to rebuild their stack to
deliver this experience because they don't have the AI conversation
layer.

---

## Never (explicit rejections — record so we don't relitigate)

These come up every quarter as "shouldn't we add X?" — answer is no,
for the reasons below. Listed in `serviceCatalog.ts` with
`phase: "never"`.

| Don't add | Why |
|---|---|
| GLP-1 weight loss | Crowded by Hims + Henry + Hone. Wegovy at $149 destroyed the pricing arbitrage that made it interesting. Regulatory whiplash on compounding (NextMed enforcement Dec 2025; FDA bulk-list scrutiny). Different patient psychology — they want to be "thin," not "optimized." Let competitors burn cash here. |
| Women's HRT | Breaks men-focused brand. Different system prompt, different intake language, different psychology. Hone serves both — let them. Lux is the woman-targeted brand for sexual-performance hook later. |
| Mental health Rx (SSRIs) | Different prescribing comfort, state-by-state controls, no TRT synergy beyond marketing. Hims has it — they bill mental health $49/mo and burn clinician time we don't have. |
| IV therapy / NAD+ in-clinic / ketamine / PRP / aesthetics | Defy's kitchen-sink menu. Requires physical clinics or partner network. Off-brand for digital-first AI product. Hone partners with ivee for IV — partner, don't own. |
| Owned full-body MRI / DEXA | Hone partners with Prenuvo + BodySpec. Capital-intensive. Partner if at all, but skip until Year 2. |
| In-home phlebotomy | Hone bought ivee for $33M to get this. We refer to a partner network (Getlabs, Quest at-home) before owning anything. |
| Native mobile app (Phase 1) | Hone, Marek, Defy, Henry all run web-only. Hims has one but they have $2.4B revenue. Build app when retention data demands it — earliest plausible is Month 12 if Apple Health import becomes critical. |
| Forums / community / podcasts | Marek has Hosstile partnership; Hone has "Hone In" podcast. Content marketing, not service. Defer to Month 9+ if at all. |
| Ketamine / psychedelics | Different specialty entirely. Founder has no domain expertise. |
| Membership perks unrelated to TRT (gym discounts, supplement reseller) | Brand creep. We are a clinical product, not a lifestyle-brand. |

---

## What's already scaffolded in the codebase

```
src/lib/serviceCatalog.ts         — service taxonomy, tier mapping, phase, enabled flag
src/lib/wearables.ts              — provider type stubs (Oura, Whoop, Apple Health, Stelo, Lingo)
src/lib/launchStates.ts           — geo-block (NY, CA day 1; UNAVAILABLE_BY_PARTNER set ready for OpenLoop coverage gaps)
src/lib/profileScores.tsx         — cross-route handoff for intake answers + scores; future expansion target for wearable data
src/lib/intakeFlow.ts             — 9-step intake; new questions land here as bullets
src/components/labs/IncludedPanel.tsx  — biomarker panel preview; will fork into Base/Premium variants in Phase 1.5
src/app/qualify/page.tsx          — intake page; no schema migration needed when new questions added
src/app/profile/page.tsx          — composer, easy to add new sections (e.g. wearable data card in Phase 2.5)
docs/COMPLIANCE_BASELINE.md       — bar; updated each phase
docs/business_context.md          — strategic source; §0 audit log captures phase decisions
docs/VENDOR_CALL_PREP.md          — pre-call agenda
scripts/audit-compliance.sh       — CI guardrail — runs every `pnpm verify`
```

---

## When to revisit this doc

- Quarterly compliance audit (`docs/COMPLIANCE_BASELINE.md` cadence)
- Major vendor change (OpenLoop / CareValidate scope expansion)
- Major regulatory change (DEA Special Registration, new state AI laws)
- Major competitive move (Hims ships avatar, Hone acquires another category)
- After every 3-month review of actual revenue / retention data

If reality diverges from this plan in a material way, **update this doc
and `serviceCatalog.ts` together** — they should never drift.
