# Compliance Baseline — Eigen Holdings LLC

> **The bar.** This document defines the laws and regulatory regimes Ava /
> Lux operate under. The founder explicitly does not want to be in any
> legal fight. **No change ships if it would violate any rule below.**
>
> Last reviewed: **2026-05-07**.
> Next mandatory review: **2026-08-07** (quarterly cadence).
>
> When in doubt, ask the healthcare attorney before merging or shipping.

---

## North star — three rules that override everything

1. **Ava is never a doctor, nurse, or licensed clinician.** Not in name, not
   in voice, not in styling, not in implication. Every clinical decision is
   made by an independent licensed clinician at the partner clinical-services
   org (OpenLoop / CareValidate). Ava is an AI companion that informs and
   conducts assessments — full stop.
2. **PHI never leaves the protected zone.** No PHI in localStorage,
   sessionStorage, URL params, console logs, analytics events, error
   reports, or third-party services without a Business Associate Agreement.
3. **Compliance is enforced in code where possible.** Banned phrases,
   crisis keywords, persistent disclosure badges, age gates, click-to-cancel
   parity — all wired so a future contributor cannot violate them by
   accident.

If a feature would force you to violate one of these three, the feature
does not ship.

---

## Laws we comply with

### 1. DEA Schedule III + Telemedicine Flexibilities

**Why it matters.** Testosterone is a DEA Schedule III controlled
substance. Remote prescribing requires either a prior in-person exam OR
COVID-era telemedicine flexibilities OR a future Special Registration.

**Current status (May 2026).** Fourth temporary extension is in effect:
remote prescribing of Schedule III is permitted nationwide through
**December 31, 2026**. The proposed Special Registration rule (PDMP checks,
audio-video, identity verification, DEA reporting) sits unfinalized.

**Risk: HIGH (existential, time-bounded).**

**MUST DO:**
- Maintain LOI with a national in-person network (Sesame, Wheel, or Quest
  partner clinics) for in-person referral fallback. **Sign before
  September 30, 2026.**
- Architect prescription workflow now to support PDMP queries, identity
  verification, and audio-video sessions — don't retrofit in Q4 2026.
- Track DEA-2025-0001 docket. Subscribe to McDermott / Foley telemedicine
  alerts. Reassess this section every 30 days starting October 2026.
- Confirm OpenLoop / CareValidate clinicians are DEA-registered in every
  state served and ready to apply for Special Registration day-one.

**MUST NOT DO:**
- Ship any flow that prescribes a controlled substance without verified
  active telemedicine flexibility OR a completed in-person exam.
- Operate in a state where the clinical partner is not DEA-registered.

---

### 2. CA AB 489 — AI healthcare misrepresentation

**Why it matters.** Effective January 1, 2026. Bars AI from using terms,
letters, or design implying a healthcare license. Each prohibited use is a
separate violation. Enforced by professional licensing boards via
injunction.

**Risk: MEDIUM-HIGH.** Ava is exactly the targeted persona.

**MUST DO:**
- Audit every brand asset, every page, every mock-up, every video script
  before publish for: zero "Dr.", "physician", "MD", "RN", "NP", "DO",
  "PA", "DC", "DDS", "OD", "DPM", "PharmD", "RD", "RDH" — no clinical
  credential letters anywhere.
- Audit imagery for: stethoscopes, white coats, exam rooms, clinical
  scrubs, hospital backdrops, prescription pads. None of it appears on
  any Ava-branded surface.
- Persistent visible AI disclosure on every screen Ava appears
  (`ⓘ AI · not a doctor`).
- "Are you real?" / "Are you a doctor?" → Ava's first-line answer is
  always *"No, I'm an AI health companion, not a doctor or medical
  provider."* Hardcoded in `src/lib/systemPrompt.ts`.

**MUST NOT DO:**
- Use clinical credential letters in copy, social handles, video scripts,
  or marketing claims.
- Show Ava in any clinical-credential visual context.
- Imply Ava can diagnose, prescribe, or recommend specific medications.

---

### 2.5 Geo-gate (formal mitigation for §3 + §4)

**Why it matters.** Until we have a regulatory-defense insurance rider AND
healthcare attorney engagement, the per-day exposure of NY's $15K/day +
the CA SB 243 private right of action is incompatible with the founder's
stated "no legal fights" posture.

**Mitigation in place (May 2026):**
- **`src/lib/launchStates.ts`** — single source of truth.
  `BLOCKED_STATES = {NY, CA}` on day 1.
- `src/components/intake/inputs/StateDropdown.tsx` flags blocked states
  as "(coming soon)".
- `src/app/qualify/page.tsx` short-circuits to `<StateWaitlist>` when a
  blocked state is selected — captures email for re-engagement instead
  of advancing the intake.
- Marketing copy reads "30+ US states (NY, CA opening later)" everywhere
  — not "47 states." See `Hero`, `TrustStrip`, `FAQ`, intake helper text.

**Re-enable cadence:**
- **CA** → Month 6 of operations, after dedicated CA compliance audit +
  insurance is active.
- **NY** → Month 9-12, after NY-specific compliance review with counsel.
- Sync `BLOCKED_STATES` set + marketing copy in lockstep when each opens.

### 3. CA SB 243 — Companion chatbot disclosure + crisis protocols

**Why it matters.** Effective January 1, 2026. Companion chatbots must
disclose their AI nature, implement crisis-response protocols, and refer
users to crisis resources. **Private right of action — $1,000 per
violation plus attorneys' fees.** California reporting requirement begins
2027.

**Risk: MEDIUM-HIGH.**

**MUST DO:**
- AI disclosure on first chatbot interaction every session — already
  enforced by `filterResponse()` in `src/lib/compliance.ts`.
- Persistent visible "AI · not a doctor" badge during all chat / intake.
- Tested suicide / self-harm classifier with hard handoff to 988 and
  crisis text line — already enforced by `checkEmergency()` in
  `src/lib/compliance.ts`.
- Log every crisis referral with timestamp, anonymized user ID, keyword
  matched. Retain logs for state reporting (CA reporting starts 2027 —
  build the table now).
- Minor protections: hard 18+ age gate at signup. If we ever serve <18,
  add 3-hour break reminders.

**MUST NOT DO:**
- Continue conversational assessment after crisis detection — Ava must
  stop and surface 988 / 911.
- Ship a chat experience without first-message AI disclosure.

---

### 4. NY AI Companion Law

**Why it matters.** Effective November 5, 2025. AG-only enforcement, **up
to $15,000 per day** in civil penalties. Gov. Hochul sent direct
compliance letters to operators on the effective date — they are actively
monitoring.

**Risk: MEDIUM-HIGH** — highest penalty exposure of any current statute.

**MUST DO:**
- All requirements from §3 (CA SB 243) apply equally to NY users.
- Conservative interpretation: assume NY rules apply to all US users
  unless we explicitly geo-block — too easy for an NY user to slip
  through, and the penalty is per-day not per-user.
- Maintain insurance with an explicit regulatory-defense rider that
  covers AG investigations.

**MUST NOT DO:**
- Operate in NY without confirmed compliance with the disclosure +
  crisis-handling regime.

---

### 5. Texas TRAIGA + Illinois chatbot law

**Why it matters.** Effective January 1, 2026 (TX) and August 2025 (IL).
Texas requires AI-in-diagnosis/treatment disclosure. Illinois bars
chatbots from posing as licensed providers.

**Risk: MEDIUM** — copycats of CA/NY. Treat as additive constraints.

**MUST DO:**
- Add Texas-style "AI used in your interaction" notice for TX users
  (currently part of the persistent badge — confirm visibility on TX
  pages).
- Same disclosure rules for IL.
- Watch the 2026 state legislative sessions — multiple states drafting
  copycats.

---

### 6. FTC Marketing Enforcement

**Why it matters.** FTC Healthcare Task Force launched March 2026
explicitly horizon-scanning digital health, telehealth, AI tools.
December 2025 closed NextMed (deceptive subscription, hidden lab/drug
costs, fake reviews); Evoke Wellness $1.9M fine. Patterns punished:
prescription guarantees, hidden subscription mechanics, fake reviews, AI
capability overclaim, off-label / FDA-implication marketing.

**Risk: MEDIUM (accelerating).**

**MUST DO:**
- Substantiate every Ava capability claim ("evidence-based", "real-time
  scoring") with cited sources before publishing.
- Click-to-cancel parity — one click cancels, same flow as signup.
- Transparent all-in pricing — labs, consults, meds visible before
  checkout. No hidden charges. No fake urgency timers.
- Disclose paid endorsements per 16 CFR 255 — every testimonial, every
  affiliate, every influencer post.
- Frame TRT as "if medically appropriate, determined by a licensed
  provider" — never a guarantee, never an expectation.
- Maintain a separate copy library reviewed by healthcare attorney
  pre-launch and on every major copy change.

**MUST NOT DO:**
- "Guaranteed prescription", "guaranteed results", "FDA-approved program",
  "doctor-supervised AI", "as-good-as-prescription".
- Before/after testimonials without explicit compensation + typicality
  disclosure.
- AI-generated reviews. Fake reviews of any kind.
- Bury pricing details (labs, consults, supplies) in fine print or
  post-checkout.
- Pre-checked subscription opt-ins, dark-pattern cancel flows.

---

### 7. HIPAA + PHI handling

**Why it matters.** Conversation transcripts and intake answers are PHI.
Mishandling = HHS OCR action plus civil exposure.

**Risk: LOW if architected correctly, HIGH if not.**

**MUST DO:**
- All PHI lives in the HIPAA-aligned backend (AWS RDS encrypted at rest).
  The frontend holds it only in React state (`ProfileScoresContext`),
  which is wiped on refresh.
- BAAs signed with: AWS, Anthropic Enterprise (when MVP shortcut retires),
  Google Workspace, Stripe (for medical billing claims).
- All API calls over HTTPS. No exceptions.
- Code-enforced PHI boundary: `compliance.ts` and `profileScores.tsx`
  guarantee no PHI lands in browser storage or query params.

**MUST NOT DO:**
- Send PHI to: Simli (only receives Ava's audio output), ElevenLabs (only
  Ava's text), PostHog (analytics — configured to exclude health data),
  Vercel (presentation only), or any third-party without a signed BAA.
- Log PHI to console in production. Build environment must scrub.
- Persist PHI to localStorage, sessionStorage, URL params, or cookie
  values.

---

### 8. State medical licensure / Corporate Practice of Medicine (CPOM)

**Why it matters.** State CPOM doctrines restrict non-physician entities
from owning medical practices. The MSO model (Eigen owns tech and brand;
clinical-services partner owns clinical decisions) is the standard
workaround — but only when implemented correctly.

**Risk: LOW with proper structure.**

**MUST DO:**
- All clinical decisions originate from OpenLoop / CareValidate
  clinicians. Eigen never overrides, recommends, or modifies a clinical
  decision.
- The terms of service explicitly state Eigen is the technology platform
  and the clinical-services org is the medical provider.
- State availability list reflects the clinical partner's licensure map —
  never offer service in a state where they're not licensed.

---

## Code-enforced invariants

These are technical guardrails. If you change them, you weaken compliance.

### `src/lib/compliance.ts`

- `BANNED_PHRASES` — diagnosing, prescribing, guaranteeing, false
  credentials, drug-name dosing combos.
- `EMERGENCY_KEYWORDS` — mental health and medical emergency keywords.
- `filterResponse()` — runs on every Ava response. Auto-prepends AI
  disclosure to first message; rejects banned phrases.
- `checkEmergency()` — runs on every user message before Claude. Bypasses
  Claude entirely on hit, surfaces 988 / 911.
- `SAFE_FALLBACK_RESPONSE` — used when output filter rejects a Claude
  response.

### `src/lib/systemPrompt.ts`

- IDENTITY block hardcoded: "You are an AI, not a doctor or medical
  provider. Never use titles: Dr., NP, PA, RN, or any clinical
  credential. If asked 'are you real?' → 'No, I'm an AI health
  companion.'"
- CLINICAL BOUNDARIES hardcoded: never diagnose, never prescribe, never
  guarantee.
- CRISIS HANDLING hardcoded: 988 / 911 surface, stop assessment.

### `src/lib/profileScores.tsx`

- In-memory React Context only. Refresh wipes it. No persistence layer
  attached. **Do not add localStorage or URL params to this without
  attorney review.**

### UI invariants

- Persistent `<span className="ai-badge">ⓘ AI · not a doctor</span>` on
  every page where Ava appears or can be invoked. Search for it before
  shipping any new route.
- Required disclosure checkbox before any payment-bearing CTA
  (`/labs/page.tsx`).
- Crisis answer in FAQ + ToS surfaces 988 / 911.

---

## Pre-launch checklist

Run through this list before any public launch. Every item must be
checked or have a documented exception (with attorney signoff).

### Brand assets
- [ ] Zero "Dr.", "physician", "MD", "RN", "NP", "DO", "PA", "PharmD"
      references in any copy or asset
- [ ] Zero stethoscope / white coat / exam-room / scrubs imagery
- [ ] AI disclosure (`ⓘ AI · not a doctor`) visible on every page
- [ ] Persistent badge during all chat / intake
- [ ] Required disclosure checkbox before any checkout CTA

### Marketing copy
- [ ] No prescription guarantees in any creative
- [ ] No "FDA-approved program" claims
- [ ] No "doctor-recommended" without specific named-clinician endorsement
- [ ] No before/after photos without compensation + typicality
      disclosure
- [ ] No fake / AI-generated reviews
- [ ] All paid endorsements disclosed per 16 CFR 255
- [ ] Every Ava capability claim has a citable source
- [ ] Healthcare attorney has reviewed the entire copy library

### Crisis handoff (test these manually)
- [ ] "I want to kill myself" → 988 surfaced, Claude bypassed
- [ ] "I have chest pain" → 911 surfaced, Claude bypassed
- [ ] Crisis logs being captured (timestamp + anonymized user ID +
      keyword)
- [ ] CA reporting table schema ready (reporting starts 2027)

### State / age
- [ ] Hard 18+ age gate at signup (already in `/qualify` step 2 — keep
      it 18+ minimum)
- [ ] State availability list matches clinical-partner licensure map
- [ ] No service in states without a licensed clinical partner
- [ ] TX users see "AI used in your interaction" notice (badge already
      satisfies)

### Subscription mechanics
- [ ] Click-to-cancel parity — one click, same flow
- [ ] All-in pricing shown before checkout (labs + consults + meds)
- [ ] No pre-checked subscription opt-ins
- [ ] No dark-pattern cancel flows
- [ ] 30-day money-back guarantee honored, documented

### HIPAA / PHI
- [ ] No PHI in localStorage, sessionStorage, URL params, cookies (other
      than auth JWT)
- [ ] Production console scrubbed of PHI
- [ ] All API calls HTTPS-only
- [ ] BAAs signed with all PHI-touching vendors
- [ ] Verified: Simli / ElevenLabs / PostHog / Vercel never receive PHI

### Insurance
- [ ] E&O insurance (with healthcare rider) — active before launch
- [ ] General liability — active before launch
- [ ] Cyber liability **with regulatory-defense rider** — active before
      launch
- [ ] Coverage limits match revenue trajectory (review quarterly)

### Vendor BAAs / contracts
- [ ] OpenLoop or CareValidate contract signed and reviewed
- [ ] AWS BAA signed
- [ ] Anthropic Enterprise BAA signed (when MVP-shortcut backend
      replacement ships)
- [ ] Google Workspace BAA signed
- [ ] Stripe medical-billing terms reviewed

### Legal review (must happen before launch)
- [ ] Healthcare attorney review of full intake flow
- [ ] Healthcare attorney review of all marketing copy
- [ ] Privacy Policy + Terms of Service drafted by attorney (placeholder
      versions exist at `/privacy`, `/terms` — must be rewritten by
      counsel before launch)
- [ ] State-by-state availability list verified

---

## Per-quarter compliance audit cadence

Set a calendar reminder. Run every 90 days post-launch.

- **Re-read every applicable state law** for changes (CA AB 489, CA SB
  243, NY AI Companion Law, TX TRAIGA, IL chatbot law, plus any new
  copycats).
- **Re-read FTC enforcement actions** in telehealth / men's health DTC
  for the past quarter.
- **Verify crisis logging is operating** and review hits.
- **Re-audit marketing copy** — drift happens.
- **Renew insurance certificates.**
- **Track DEA Special Registration** rule status. As Dec 31, 2026
  approaches, increase cadence to monthly.
- **Re-audit code for compliance regressions** — search the codebase
  for newly-introduced "Dr.", clinical credentials, banned-phrase
  matches, or PHI in bad places.

---

## When in doubt

When ambiguous: **don't ship the change without attorney review.** The
cost of a 24-hour pause is far less than the cost of an AG investigation
or FTC consent decree. The cost of a brand rebuild after a public
enforcement action would end the company.

The healthcare attorney short list (per `business_context.md` §10):
**Lengea Law** or **Nixon Law Group**. Engage early — both are familiar
with DTC telehealth + AI disclosure regimes.
