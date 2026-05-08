# Vendor Call Prep — OpenLoop / CareValidate

> Prep doc for the May 19, 2026 CareValidate intro call (and equivalent
> OpenLoop conversation). Pull this up before the call, work through it
> during, capture answers in the right column.
>
> Goal of the call: confirm the partner can support our launch plan
> (`docs/PRODUCT_ROADMAP.md`) and our compliance posture
> (`docs/COMPLIANCE_BASELINE.md`) — and that the contract terms make the
> $199 / $299 unit economics work.

---

## Self-brief: what they need to know about Ava in 60 seconds

- **Who we are:** Eigen Holdings LLC (Delaware MSO). Two consumer brands —
  Ava (mainstream men's hormonal optimization) + Lux (sexual-performance
  hook). One backend.
- **What's built:** complete Next.js frontend at `withava.co`, AI-avatar
  intake at `/qualify` (9 structured steps, 5 minutes), profile + lab kit
  + chat + legal pages. State-aware (NY + CA geo-blocked day 1; targeting
  ~30 states). Pre-launch.
- **What we need from a clinical partner:** licensed clinicians in 30+
  states, controlled-substance prescribing capacity, pharmacy fulfillment,
  lab partner integration, ongoing patient management.
- **Pricing posture:** $199 base + $299 premium, all-inclusive (labs +
  meds + supplies + clinician access). 30-day money-back. HSA/FSA.
- **Compliance posture:** "no legal fights" — see baseline doc. They will
  see this, so be transparent about it.
- **Stage:** bootstrap, ~$10K total runway. Need a partner that can serve
  20-50 patients in month 1 and scale to 1,000+ by month 12 without us
  rebuilding.

---

## 1. Pre-launch must-haves (blocking)

These confirm the May 2026 competitive analysis recommendations are
deliverable. If any answer is "no" or "extra cost," we have a problem.

| # | Question | Why it matters | Their answer |
|---|---|---|---|
| 1.1 | Which states do you cover for **Schedule III prescribing of testosterone** today? List all. | Sets our actual launch state list. Can't market "30+ states" if real number is 22. | |
| 1.2 | What's your status on **DEA Special Registration** if/when the rule finalizes? Are you positioned to apply day-one? | Existential for us if Dec 31, 2026 flexibility expires. | |
| 1.3 | Is **anastrozole (aromatase inhibitor)** included in the standard TRT protocol when clinically indicated by E2 levels, **at no extra cost to the patient**? | Standard of care. Henry Meds, Marek, Defy all bundle. If you charge extra it makes us non-competitive. | |
| 1.4 | Is **HCG (chorionic gonadotropin)** prescribable as part of TRT to maintain testicular function / fertility? Bundled or add-on cost? | Same as above — standard. | |
| 1.5 | Do you support **enclomiphene** as a fertility-preserving alternative to TRT for men trying to conceive? | Maximus owns this niche. Adding lets us serve the 28-45 cohort that injectable TRT scares off. ~+15-20% TAM expansion. | |
| 1.6 | Confirm what's **included in your per-patient fee**: clinician evaluation, ongoing review, prescription, refills, lab review, patient messaging? What's separately billed? | Pricing transparency for our customers. Henry Meds at $129 includes everything; we need to know what we can match. | |
| 1.7 | What's the **lab panel scope** you support out-of-the-box, and can we customize? Can we run a 17-marker base panel at $199 and a 30+ marker premium panel at $299? | Hone Premium has 40+, Marek has 60-100+. We need depth at premium. | |
| 1.8 | Lab partner — **Quest, LabCorp, both?** Can patients choose at-home kit OR in-person draw? What's per-panel cost to us? | Quest is the prestige partner. At-home kits drive conversion. Pricing affects our gross margin. | |
| 1.9 | Pharmacy partners — **which compounding pharmacies?** What TRT formulations (cypionate, enanthate, oral)? What are 2026 controlled-substance compliance hardenings affecting them? | FDA + DEA scrutiny on compounders is escalating. We need to know who we're depending on. | |
| 1.10 | **Time to first prescription** — from intake submit to clinician approval, what's typical SLA? Henry advertises 48 hours. | Customer expectation. > 72 hrs = drop-off + refund requests. | |

## 2. Compliance & legal

| # | Question | Why it matters | Their answer |
|---|---|---|---|
| 2.1 | Are clinicians **DEA-registered in every state served**? Confirm before signing. | One missing license = one missing state = lost revenue + legal exposure. | |
| 2.2 | Can you sign a **Business Associate Agreement (BAA)**? When? Standard form or negotiated? | HIPAA non-negotiable. | |
| 2.3 | **Crisis-flow handoff** — when our system fires a 988/911 alert because a user typed crisis-keywords, what's the handoff path to your clinical team? | NY/CA AI-companion laws require this. Our `checkEmergency()` hard-stops Claude — we need the clinical follow-up path defined. | |
| 2.4 | **AI disclosure stance** — are you comfortable with our positioning that "Ava is an AI; clinical decisions are by your clinicians"? Any restrictions on how we describe the avatar? | CA AB 489, CA SB 243, NY AI Companion Law all targeting AI in healthcare. They'll have opinions. | |
| 2.5 | **Marketing rights** — can we say "Reviewed by board-certified endocrinologists at [partner]"? Use partner's name in copy? Use a Medical Director name? | We need a real clinician name to substantiate the trust strip. Currently it's "TBD." | |
| 2.6 | **State-by-state tracking** — who keeps the state availability map current? When a state's law changes, who notifies us? | Required for our `BLOCKED_STATES` set + waitlist UX. | |
| 2.7 | **PDMP queries** — built into your prescribing workflow? Reportable to us? | DEA Special Registration likely requires this; we need to know the architecture works today. | |
| 2.8 | **Adverse event reporting** — process when patient reports side effect? FDA MedWatch path? | Required for risk management. | |
| 2.9 | Have any of your clients received **FDA warning letters** or FTC enforcement actions in the past 24 months? | We need to know who we're sharing a regulatory perimeter with. (Reference MEDVi's Feb 2026 warning letter.) | |
| 2.10 | **Insurance / E&O carrier** — who carries malpractice for the clinicians? Does it extend to us via the MSO structure? | Our liability exposure depends on this. | |

## 3. Operational

| # | Question | Why it matters | Their answer |
|---|---|---|---|
| 3.1 | **Lab kit fulfillment** — who ships? Average return turnaround? | UX expectation. Henry advertises 48 hr ship. | |
| 3.2 | **Patient ↔ clinician messaging** — your portal or our portal? Can we white-label? | Brand consistency vs build effort. We'd prefer to own the experience. | |
| 3.3 | **Lab interpretation flow** — how do labs come back to us? PDF, structured data, both? | We need structured data for our radar chart + future longitudinal tracking. | |
| 3.4 | **Refill workflow** — automatic, patient-initiated, clinician-renewed each month? | Customer experience varies by model. | |
| 3.5 | **Dose adjustment process** — patient asks for dose change, what's the path? | Common. Async messaging vs scheduled video. | |
| 3.6 | **Patient files / EHR access** — do we get access to clinical records via API? | For our profile/longitudinal features. Privacy compliance. | |
| 3.7 | **Off-protocol or patient declined** — what's the experience when the clinician decides TRT isn't right? Does the patient get a refund? Retain in waitlist? | Our $199 must include "no, you don't qualify, here's your refund." Customer experience drives Trustpilot rating. | |
| 3.8 | **Onboarding timeline** — from contract sign to first patient? | Burn rate awareness. Each week of delay is ~$2-3k of overhead. | |
| 3.9 | **Test environment** — sandbox API + test pharmacy + test clinician we can develop against? | We need to build our backend integration. | |

## 4. Scope expansion (Phase 2+)

These set up the post-launch roadmap. Even if we don't enable these on day 1, the answers shape our long-term plan.

| # | Question | Phase | Their answer |
|---|---|---|---|
| 4.1 | **ED treatment** (sildenafil/tadalafil) — supported? At what marginal cost? | Phase 2 (Month 3-6) | |
| 4.2 | **Hair loss** (finasteride/minoxidil) — supported? Marginal cost? | Phase 2 | |
| 4.3 | **Sermorelin / NAD+ peptide stack** at premium tier — supported? Compounding-pharmacy concerns post-FDA-bulk-list-changes 2025-2026? | Live (already in copy) | |
| 4.4 | **Advanced biomarker panel** (~30+ markers including ApoB, Lp(a), hs-CRP, HbA1c, fasting insulin, ferritin, B12, IGF-1) — can you bundle this at premium tier? Pricing? | Phase 1.5 | |
| 4.5 | **Quarterly video consult** at premium tier — included in clinician fee or separate? | Live (already in copy) | |
| 4.6 | **Wearable data** — would your clinicians look at Oura/Whoop/Apple Health data alongside labs when reviewing? Any structured intake format? | Phase 2.5 | |
| 4.7 | **CGM data** (Stelo, Lingo) integration into clinical decisions? | Phase 3 — explore | |
| 4.8 | **What you've explicitly told other clients you DON'T support** — get their no-go list. | risk awareness | |

## 5. Tech / API

| # | Question | Why it matters | Their answer |
|---|---|---|---|
| 5.1 | Do you expose **patient state via API**? RESTful, GraphQL, webhook events? Documentation public? | Our backend depends on this. | |
| 5.2 | **Webhook events** — clinician decision made, lab result returned, prescription shipped, patient messaged, adverse event filed. Configurable? | Drives our profile UX update. | |
| 5.3 | **Lab data format** — structured biomarker JSON or PDFs? FHIR-compliant? | We need structured data for our radar chart. PDFs only = we'd need to OCR. | |
| 5.4 | **Patient identity** — do they sign up on your portal first, or ours? SSO between systems? | Brand experience. | |
| 5.5 | **Rate limits / SLAs / uptime** — on the API. | Reliability. | |
| 5.6 | **Versioning** — how often do APIs change? Notice period for breaking changes? | Engineering planning. | |

## 6. Commercial

| # | Question | Why it matters | Their answer |
|---|---|---|---|
| 6.1 | **Per-patient cost breakdown** — exactly what we pay you per active subscriber per month. Itemize: clinician evaluation, ongoing review, prescription, lab cost, pharmacy markup, supplies, shipping. | Determines if our $199 unit economics work. Drug at $30-50 wholesale + their per-patient fee + lab + AI cost should leave 50%+ gross margin. | |
| 6.2 | **Volume tiers / discounts** — at 100, 500, 1000, 5000 patients. | Roadmap pricing. | |
| 6.3 | **Minimums** — month 1 we may have 20-30 patients. Do you have minimum monthly patient counts or fees? | Bootstrap cash flow. | |
| 6.4 | **Onboarding fee / setup cost** — non-refundable? | Burn rate awareness. business_context.md §6 budgeted $2-3k. | |
| 6.5 | **Contract terms** — duration, exit clauses, exclusivity, breach remedies. | Switching cost is the moat-or-trap of this whole strategy. | |
| 6.6 | **Switching / migration support** — if we wanted to move providers in 18 months (e.g. dual-source for risk), what's the patient-data migration path? | Single-vendor risk mitigation. | |
| 6.7 | **Payment terms** — net-30, net-60, prepaid? When does revenue arrive vs cost incur? | Cash flow modeling. | |
| 6.8 | **Price escalators** — annual increases capped? CPI-linked? | Long-term margin stability. | |
| 6.9 | **Termination / wind-down** — if either side leaves the partnership, who's responsible for patient continuity? | Ethical + legal exposure. | |

## 7. Decision criteria — our scoring (after the call)

Score 1-5 each. We pick the partner with highest total, weighted.

| Criterion | Weight | Score |
|---|---|---|
| State coverage breadth | 5x | |
| Per-patient cost (lower = better) | 5x | |
| Anastrozole + HCG bundled (Y/N) | 5x | (Y=5, N=0) |
| Enclomiphene support | 4x | |
| Lab panel customization | 3x | |
| API quality / structured data | 4x | |
| BAA willing + standard | 5x | |
| DEA Special Registration readiness | 5x | |
| Insurance / E&O coverage | 4x | |
| Pharmacy partner credibility | 4x | |
| Sandbox + test environment | 3x | |
| Time-to-first-patient | 3x | |
| Marketing rights to use partner name | 2x | |
| Phase-2 expansion path (ED, hair loss) | 3x | |
| Switching cost (lower = better) | 4x | |
| Existing client base (other TRT clients reference-able?) | 3x | |

## 8. Red flags to listen for

If you hear any of these, slow down and don't sign on the call.

- "We can't sign a BAA" / "We don't sign BAAs" → walk away. HIPAA is non-negotiable.
- "We require minimum 200 patients/month from day 1" → unworkable for a bootstrap.
- "We don't support enclomiphene" → 15-20% TAM gone.
- "Anastrozole is a separate $30/mo charge" → kills our $199 transparency claim.
- "We white-label our portal — patients sign up there first" → kills our brand experience.
- "Our API is on the roadmap" / "We export PDFs" → you'd build a fragile OCR layer.
- "We had a recent FDA warning letter" → ask for details, may be acceptable depending on context, but is a yellow flag.
- "We're not yet operational in NY/CA" → fine, matches our geo-block. But ask about plan.
- "We've never partnered with a bootstrapped DTC under $1M revenue" → operational mismatch.
- "DEA Special Registration? We'll figure that out" → not acceptable. They need a plan.
- "We charge per-conversation/per-message after the first 10" → kills the "unlimited Ava check-ins" claim.
- "Our lab partner is [unknown lab]" → push for Quest or LabCorp. Anything else risks marketing claim defensibility.
- "We need exclusivity" → bootstrap can't commit to exclusivity. Push back.
- Refusal to quote per-patient cost on the call → ask for a follow-up email with the number. Don't move forward without it.

## 9. What we won't compromise on

- **Patient data must come back to us in structured form** (JSON, FHIR, REST). PDFs only is a deal-breaker.
- **AI disclosure language must be supported**. If they want to mandate "Ava is your nurse" or similar, no deal.
- **30-day money-back must be honorable** under their model. If they bill us per-patient on day 1 with no refund window, we eat that cost on cancellations.
- **We must be able to geo-block NY + CA** at the funnel layer, with their explicit comfort. Some partners might insist on full state coverage for contract simplicity.
- **No exclusivity in year 1**. We need optionality to dual-source if scale requires.

## 10. Pre-call checklist (do this morning-of)

- [ ] Re-read this doc + `docs/COMPLIANCE_BASELINE.md` + `docs/business_context.md` §0 audit summary
- [ ] Confirm `docs/PRODUCT_ROADMAP.md` is current
- [ ] Have `src/lib/serviceCatalog.ts` open in a tab — when they ask "what services do you want to offer," walk them through the phased table
- [ ] Have a calendar ready for follow-up commitments
- [ ] Test environment for `withava.co` working — they may want to see the funnel
- [ ] Camera + audio test
- [ ] Prepared answer to "What's your timeline?" — soft launch 30-60 days post-contract; ramp to 100 patients by month 3
- [ ] Prepared answer to "How will you acquire patients?" — TikTok organic + LinkedIn + CrossFit gym partnerships + later affiliate (`docs/business_context.md` §8)
- [ ] Prepared answer to "Have you raised money?" — bootstrapped, $10K personal capital. Reinvest revenue, no VC
- [ ] Prepared answer to "Who is your competitor?" — Hone Health, Henry Meds. Differentiator: AI-led structured intake, not a form

## 11. Post-call to-dos

- [ ] Within 24 hours: send thank-you email recapping their answers + asking for written follow-up on the 5 most important
- [ ] Within 72 hours: complete the §7 scoring against both providers (OpenLoop + CareValidate)
- [ ] Within 1 week: legal pre-review of their proposed contract — bounded healthcare attorney engagement (~$500-1500), see `docs/COMPLIANCE_BASELINE.md`
- [ ] Update `BLOCKED_STATES` set in `src/lib/launchStates.ts` with their actual coverage gaps
- [ ] Update `enabled` flags in `src/lib/serviceCatalog.ts` based on what's confirmed live vs Phase 2+
- [ ] Update `Hero.tsx` / `TrustStrip.tsx` PRE-LAUNCH ATTORNEY REVIEW comments — once partnership signed and Medical Director name confirmed, these claims become substantiable

---

## Appendix A: Cheat sheet of competitor pricing

When they ask "what does the market charge," reference these to argue for a fair per-patient fee.

| Competitor | All-in price | What's included |
|---|---|---|
| TRT Nation | $99/mo | Cypionate, supplies, unlimited consults, labs every 6mo |
| PeterMD | $89-99/mo | Visits, supplies, basic labs |
| Hone HRT | $129/mo | Meds + supplies + clinician + 90-day labs |
| Henry Meds | $129/mo | Visits + labs + meds + supplies + shipping (all-in) |
| Hone Premium | $149/mo + ~$28/mo meds (~$177 effective) | Meds, 40+ markers, unlimited consults |
| Maximus combos | $189-199/mo | Enclomiphene-first, fertility-conscious |
| Fountain TRT | $199/mo | Diagnostics + meds + video consults + supplies bundled |
| **Ava base** | **$199/mo** | AI intake + 17+ marker panel + clinician + TRT + monitoring |
| Marek Health | $225/mo + $250 intake + $450-1700 initial labs | Comprehensive panel, peptides, optimization |
| Defy Medical | $200-250/mo + $149 initial consult | Old-guard concierge, broad menu |
| **Ava premium** | **$299/mo** | Base + peptides + advanced markers + quarterly video |

If their per-patient fee makes $199 unworkable, we either renegotiate or move to $229 base. **Don't sign before running the math.**
