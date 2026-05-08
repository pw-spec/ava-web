# Product Specification — Ava Health

> Last revised after the redesign — minimalism front door retired, multi-section
> landing + structured intake adopted to match how every credible telehealth
> brand actually presents themselves to a skeptical patient. See
> `docs/business_context.md` §13 for the strategic principles that drive these
> choices.

## Overview

Ava is an AI health companion for men's hormone optimization. She guides men
through a structured 5-minute assessment, builds a real-time health radar
chart, and connects them with licensed clinicians for TRT (testosterone
replacement therapy) treatment.

The experience is built around two coupled moves:

1. **Credibility shell** — a multi-section landing with HeyGen video
   placements, named-clinician copy, lab-partner trust signals, specific
   pricing, FAQ, and a 30-day money-back guarantee. This is what every
   successful TRT brand (MEDVi, Hone Health, Hims) actually does, and what
   skeptical patients need to see before they hand over body data.
2. **AI avatar inside the funnel** — Ava conducts the actual intake
   conversation, narrates each question, and provides the post-intake
   walkthrough. The avatar isn't the front door (too much friction for trust)
   — it's the differentiated experience inside the proven shell.

> If you remove Ava, the funnel still looks like a real medical service. If
> you remove the credibility shell, no one trusts Ava. Both layers exist
> deliberately.

## Target user

Men 28-55 experiencing symptoms of low testosterone:

- Chronic fatigue, afternoon energy crashes
- Poor recovery from training
- Sleep fragmentation
- Low libido / sexual performance issues
- Brain fog / focus loss
- Unexplained body composition shift
- Mood / irritability changes

Typically health-conscious — gym-goers, CrossFit athletes, weekend warriors —
who suspect something is off but haven't connected the dots to hormonal
health.

---

## The funnel

```
1. /                  Landing  (multi-section scroll, Hone register)
                        ↓ "Talk to Ava — 5 minutes"
2. /qualify           Avatar-led intake  (9 steps, 5 min, Ava narrates)
                        ↓ Finish
3. /profile           Profile  (overall score, intake recap, animated
                                radar, interpretation, dual CTA)
                        ↓ "Get your lab kit"           ↓ "Talk to Ava more"
4. /labs              Lab kit  (panel preview,         /chat  Free-form
                                tier picker, checkbox,        follow-up
                                Stripe — future phase)        layer
                        ↓ Stripe                              ↓ readyToClose
                                                              /profile
```

Cross-page state lives in `ProfileScoresContext` (in-memory React Context).
No PHI is ever persisted to localStorage, sessionStorage, or URL params.

---

## Page 1 — `/` Landing

Multi-section scroll. Built from `src/components/landing/`. Each section
earns its place — no decoration. Sections in order:

### 1. Hero
- Two-column on desktop, stacked on mobile.
- Left: section eyebrow `AVA · TRT, designed by data` (mono, hairline-prefix).
- Hero headline: brand tagline `"You're not lazy. You're depleted."` (Lux:
  `"Can't perform like you used to?"`). Inter, weight 200, clamp(40px, 6.4vw, 72px).
- Subhead: 1-2 sentences explaining the value prop.
- Dual CTA: primary `Talk to Ava — 5 minutes` (gradient teal pill, → `/qualify`),
  secondary `How it works` (ghost pill).
- Trust microline below CTAs: `Reviewed by board-certified endocrinologists ·
  Quest Diagnostics labs · HIPAA-compliant`.
- Right: silent looped HeyGen video placeholder (16:9). Muted autoplay loop,
  ~5-10s, no spoken script — its job is identity in 1 second. Below: 1-line
  caption `Silent looped intro — sound on inside the assessment.`

### 2. How it works
- Three-card row: `01 Talk to Ava` → `02 Get your labs` → `03 Treatment if
  right for you`. Each card has a mono numeral, title, 2-3 line body.

### 3. Hook reel
- Section eyebrow `Where this usually starts`.
- 4 vertical (9:16) HeyGen clip placeholders, addressable by symptom area:
  Energy / Recovery / Sleep / Drive. Each tile = a tappable link to `/qualify`.
  Each clip ends with the same CTA voice fragment: *"Talk to me."* Same
  asset doubles as TikTok / TrafficJunky ad creative.

### 4. What we measure
- Two-column. Left: prose explaining why a single testosterone reading is
  insufficient. Right: panel-preview card showing 17 biomarkers grouped:
  - Hormones — Total T, Free T, SHBG, Estradiol, LH, FSH, DHEA-S, Prolactin
  - Thyroid — TSH, Free T3, Free T4
  - Metabolic — Fasting glucose, HbA1c, Lipid panel, ALT/AST, Vitamin D, PSA
- Card has mono panel ID (`AVA-HRP-01`), border, gold-accented group headings.

### 5. See it in action
- Centered heading + 60-second click-to-play HeyGen demo video (16:9, large).
- Demo shows Ava asking a sample intake question, user answering, transition.

### 6. Trust strip
- Slim row across the page: `Reviewed by · Lab partner · Compliance ·
  Coverage · Guarantee`. 5-column on desktop, 2-column on mobile.

### 7. Pricing
- Two cards side-by-side: `Base $149/mo` + `Premium $249/mo` (gold-accented).
- Each card: tier name, big tabular price, what's included list, CTA.
- Subline: `HSA/FSA approved · Cancel anytime · 30-day money-back`.

### 8. Testimonials
- 6 cards, 3-col × 2-row on desktop. Each card: 5-star (gold), quote,
  `Name · age · state`. Disclaimer note below: *"Quotes shown are
  representative placeholders pending real customer launch."*

### 9. FAQ
- 8 expandable native `<details>` accordions:
  - Is Ava a doctor?
  - How long until I get results?
  - Will I definitely get a prescription?
  - Why test 17 markers?
  - Difference between Base and Premium?
  - Privacy / data storage?
  - Which states do you cover?
  - What if I'm in a crisis?
- The crisis answer always points to 988 / 911.

### 10. Footer
- Brand block, `Service / Legal / Contact` columns, AI badge, copyright.
- Privacy / Terms / state availability links.

---

## Page 2 — `/qualify` Avatar-led structured intake

The differentiating experience. Single-question-per-screen. Ava narrates each
question; the user answers via a structured input. Every answer maps to a
clinician-facing field.

### Layout

```
[━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━] hairline progress
┌─────────────────────────────────────────────┐
│ ← Save & exit                       01 / 09 │  topbar
├─────────────────────────────────────────────┤
│                                             │
│   ◉  AVA                                    │
│      "Where do you live? Quick state        │
│       check before we go anywhere."         │
│      We're licensed in 47 US states.        │
│                                             │
│      [ Choose your state…           ▾ ]     │
│                                             │
│   [← Back]              [ Continue → ]      │
├─────────────────────────────────────────────┤
│         ⓘ AI · not a doctor · 100% private  │
└─────────────────────────────────────────────┘
```

### The 9 questions

| # | Ava's line | Input | Field |
|---|---|---|---|
| 1 | "Where do you live? Quick state check before we go anywhere." | State `<select>` (50 US) | `state` |
| 2 | "And how old are you?" | Big tabular numeral + range slider 18-75 | `age` |
| 3 | "What's been off lately? Pick the one that's bugging you most." | 6 single-select cards | `primary_concern` |
| 4 | "How long has this been the pattern?" | 5 single-select cards | `duration` |
| 5 | "Has anyone ever evaluated this — bloodwork, doctor visit, anything?" | yes / no / once | `prior_eval` |
| 6 | "Any history of heart issues, prostate problems, or sleep apnea?" | Multi-select with mutually-exclusive "None of these" | `conditions[]` |
| 7 | "Currently on any prescription medication?" | Free text or "none" | `medications` |
| 8 | "Are you trying to start a family in the next year or two?" | yes / no / maybe | `fertility` |
| 9 | "Last thing — what's your email, so I can save your profile?" | Email input | `email` |

Total time: 4-5 minutes. Definitions live in `src/lib/intakeFlow.ts` as a
typed array — single source of truth, easy to tune without touching the page.

### Behavior

- Progress bar reflects current step (1-indexed) over 9.
- "Continue" disabled until current answer passes step's `validate(value)`.
- "Back" goes to previous step (state preserved in component memory).
- Enter key advances when valid (except in textarea).
- Each step re-mounts via `key={stepId}` so the question fades in cleanly
  and the orb pulses once to signal "Ava is speaking."
- "Save & exit" returns to landing. (Resume support: future phase.)

### Score derivation on finish

`deriveScoresFromIntake(answers)` in `src/lib/intakeAnswers.ts`:

- All categories start at neutral 50.
- Primary concern category drops by 12-32 points based on duration:
  `lt1mo: -12, 1to3mo: -18, 3to6mo: -24, 6to12mo: -28, gt1yr: -32`.
- 1+ flagged condition: `body -8, recovery -6`.
- Prior eval = "once" (lapsed): `mood -6`.

This is **not** a clinical score — it's the radar baseline before the lab
panel returns. Real numbers come from bloodwork.

On finish, both scores and raw intake answers are written to
`ProfileScoresContext` and the user navigates to `/profile`.

---

## Page 3 — `/profile` Health profile

Multi-section. Reads from `ProfileScoresContext`. If the user lands here
without completing intake, scores default to neutral and a "demo profile —
take the assessment" hint is shown.

### Sections

**Top bar** — Ava wordmark left, AI badge right.

**Hero** — Two-column.
- Left: section eyebrow `02 · Your assessment`, large heading `Your health
  profile.`, big tabular score (88px Inter weight 200, severity-colored),
  severity subtitle (e.g. *"moderate indicators — especially recovery,
  energy"*), severity chip pill.
- Right: `<AnimatedRadar size={260}>` — fills in from neutral on mount.

**Intake recap card — "What you told us"**
- Card-elevated. Top header has `Edit →` link back to `/qualify`.
- Two-column dl with: Primary concern · duration / Location / Age / Prior
  evaluation / Conditions / Medications / Family planning.
- Primary concern row gets emphasized weight + accent color.

**Score breakdown**
- Section eyebrow `By category`.
- 6 ScoreBars stacked. The user's primary-concern category gets a 2px teal
  left rail to mark "we heard you — this is what you said mattered most."

**Interpretation card** — `What this might mean`
- Severity-aware paragraph. 4 distinct tones for good / moderate / poor /
  severe, referencing user's actual concern + duration when known.
- Disclaimer: *"This is informational only. Treatment decisions are made by
  licensed clinicians after reviewing your bloodwork."*

**Next steps**
- Heading + 1-sentence pitch for the lab panel.
- Dual CTA: primary `Get your lab kit` (→ `/labs`) + secondary
  `Talk to Ava more` (→ `/chat`).
- Microcopy: *"At-home or Quest in-person · Results in 3-5 days · Treatment
  if medically appropriate."*

**Footer** — slim. Privacy / Terms / copyright.

---

## Page 4 — `/labs` Lab kit & checkout

### Sections

**Top bar** — same as `/profile`.

**Hero** — Two-column.
- Left: section eyebrow `03 · Lab kit`, large heading
  `Your hormone panel, properly measured.`, body explaining the 17+
  marker scope, trust microline (CLIA-certified · Quest partner · 3-5 days).
- Right: lab kit visual card — faux illustration: stacked rounded plates
  (`AVA · HRP-01 / Lancets x6 / Microvette / Return mailer`) + scanline
  texture. Placeholder until real product photography.

**What's in the panel** — same panel-preview card as the landing's
`What we measure`, but compact.

**5-step process**
1. Lab kit ships
2. 5-minute collection
3. Clinician review
4. Walkthrough with Ava
5. Treatment if appropriate

**Tier picker**
- Two radio cards: `Base $149/mo` and `Premium $249/mo` (gold accents).
- Selecting a tier updates the CTA text dynamically:
  `Start my Base plan — $149/mo` or `Start my Premium plan — $249/mo`.
- HSA/FSA · 30-day money-back microcopy.

**Required disclosure + CTA**
- Card-styled checkbox: *"I understand that Ava is an AI and that all
  treatment decisions will be made by a licensed provider."*
- CTA disabled with `pointer-events: none` and 0.4 opacity until checked.
- On click: shows a `role="status"` notice that Stripe checkout is queued.

**Footer** — slim. Privacy / Terms.

---

## Page 5 — `/chat` Free-form follow-up

Now positioned as a sub-experience after structured intake, **not** the
funnel's front door. Reads `intake` and `hasProfileScores` from
`ProfileScoresContext`.

### Behavior

- Top bar: `← Profile` (when intake exists) or `← Home` (when not), then
  vertical divider, then orb + Ava name + AI badge + status, then mini radar
  on the right.
- Greeting is contextual (`buildContextualGreeting(intake)` in
  `src/lib/contextualGreeting.ts`):
  - With intake: `"I went through your responses — thanks for the detail.
    {Concern} {duration phrase} is something I'd want to dig into a little
    before your bloodwork. What's the worst version of it? Walk me through
    a typical bad day."`
  - Without intake: neutral `"I'm Ava, an AI health companion — not a
    doctor or medical provider. What's been off lately?"`
- Suggestion pills are concern-specific when intake is present (e.g. for
  energy: "Crashes start mid-afternoon" / "I drag through workouts" /
  "Caffeine doesn't help anymore").
- Input placeholder: `"Anything else worth telling Ava?"` (with intake) or
  `"Talk to Ava…"` (without).
- Footer disclosure: AI disclaimer + (when no intake) a link to `/qualify`.
- The legacy 6-message anonymous gate has been retired — this is no longer
  the front door.
- `readyToClose` from Ava transitions the user back to `/profile` after a
  short loading state.

### MVP Claude integration

Frontend calls Claude directly (per `docs/ARCHITECTURE.md` MVP shortcut)
when `NEXT_PUBLIC_ANTHROPIC_API_KEY` is set. Otherwise `mockClaude(turn)` in
`src/lib/claude.ts` returns a scripted ChatResponse so the funnel demos
end-to-end with zero API spend.

Every Claude response runs through:
1. `filterResponse()` — banned phrase scan, auto-prepend AI disclosure on
   first message.
2. Crisis fallback if a banned phrase fires.

Every user message is pre-screened by `checkEmergency()` — mental-health or
medical-emergency keywords bypass Claude entirely and surface 988 / 911.

---

## Health categories (radar axes)

```
energy    ⚡  fatigue, afternoon crashes
recovery  💪  post-exercise recovery
sleep     🌙  quality, fragmentation
drive     🔥  libido, motivation
mood      🧠  irritability, focus
body      📊  composition, weight
```

Hexagonal radar layout, top-clockwise:
- 12 o'clock: Energy ⚡
- 2 o'clock: Recovery 💪
- 4 o'clock: Sleep 🌙
- 6 o'clock: Drive 🔥
- 8 o'clock: Mood 🧠
- 10 o'clock: Body 📊

Each scored 0-100. Severity thresholds (`src/lib/scoring.ts`):

| Range | Severity | Color token |
|---|---|---|
| ≥ 65 | Good (mild indicators) | `--score-good` (#10b981) |
| 45-64 | Moderate | `--score-moderate` (#f59e0b) |
| 25-44 | Poor | `--score-poor` (#ef4444) |
| < 25 | Severe | `--score-severe` (#dc2626) |

---

## System prompt — Ava

Lives in `src/lib/systemPrompt.ts` and is brand-aware (Ava vs Lux). Shape:

```
You are Ava, an AI men's health optimization companion.
Athletic, warm, evidence-based — like a sharp friend who happens
to understand endocrinology.

IDENTITY:
- You are an AI, not a doctor or medical provider
- You MUST disclose this in your first message every conversation
- Never use titles: Dr., NP, PA, RN
- "Are you real?" → "No, I'm an AI health companion."

RESPONSE FORMAT: ONLY valid JSON.
{
  "message": "1-3 sentences, warm and direct",
  "scores": {
    "energy" 0-100, "recovery" 0-100, "sleep" 0-100,
    "drive" 0-100, "mood" 0-100, "body" 0-100
  },
  "phase": "greeting|assessment|education|close",
  "suggestions": ["short reply 1", "short reply 2"],
  "readyToClose": false
}
You may omit categories from "scores" the user hasn't discussed yet.

CONVERSATION FLOW:
- Start with warm greeting + AI disclosure
- One symptom area per message — no rapid-fire
- After 3-4 areas, set readyToClose: true
- Close: "I've got a clear picture. Let me show you your profile."

CLINICAL BOUNDARIES:
- NEVER diagnose: "you have X" → "commonly associated with"
- NEVER prescribe: "take X mg" → "a doctor might discuss options"
- NEVER guarantee: "you'll feel better" → "many men report improvement"
- NEVER promise prescription: "we'll get you" → "if medically appropriate"

CRISIS HANDLING:
- Suicide/self-harm → 988 Lifeline
- Chest pain / breathing / emergency → 911
- Stop assessment after crisis

PERSONALITY:
- 1-3 sentences max
- Reference fitness/training naturally
- Warm but not cheesy. Direct but not cold.
- Use "commonly" / "often" / "many men report" — never definitive claims
```

The `mockClaude()` script in `src/lib/claude.ts` mirrors this contract for
local testing without an API key.

---

## Radar chart component

`src/components/charts/RadarChart.tsx`:

- Custom SVG, 6 axes in hexagonal pattern (Energy ⚡ top, clockwise).
- Background hexagonal rings at 25%, 50%, 75%, 100% — `--border-ring`,
  0.5px stroke.
- Axis lines from center to each tip — `--border-subtle`, 0.5px.
- Score polygon: `--accent-primary` fill at 12% opacity, 2px stroke,
  rounded line joins.
- Vertex dots: 3px teal fill with 1.25px dark stroke (kisses the bg color).
- Emoji labels at each axis tip when `showLabels`.
- Tweens between target states via `requestAnimationFrame` (`<polygon>`
  `points` is not a CSS-animatable property). Easing: cubic ease-in-out
  approximation, 800ms.
- Honors `prefers-reduced-motion`.
- `liveRef` tracks the latest visible value so mid-tween updates start from
  the current visual position (not from the original "from").

`<AnimatedRadar>` wraps `<RadarChart>` and animates from `NEUTRAL_SCORES` to
the target on mount — used on `/profile` so the chart "fills in" as the
page loads.

---

## Shareable health card

Out of scope for the current build. Spec stands:

- Aggregate score only (e.g. `47/100`)
- Radar shape
- Ava branding + link
- **Never:** name, symptoms, clinical data, anything that could be PHI
- Always opt-in, never auto-shared
- Not incentivized with discounts on health data sharing (FTC concern)
- Standard referral program is fine: "Refer a friend, both get $20 off"

---

## Mobile-first

All designs target 375px first. Scale up to 1280px+. Specific notes:

- Hero in `/`: stacks (text on top, video below).
- `/qualify`: single column. Orb + question header stays inline-row even on
  small screens (orb 56px, question 20-22px Inter).
- `/profile`: hero stacks, intake recap card stays single column at narrow
  widths (sm:grid-cols-2 above 640px).
- `/labs`: tier picker stacks below md.
- Multi-section landing is fully responsive — every section verified at
  375px during the redesign pass.
