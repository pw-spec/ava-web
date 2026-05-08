# Ava Web — Project Guide

## ⚠️ Compliance is the baseline (read first)

**`docs/COMPLIANCE_BASELINE.md` is the bar this codebase operates under.** The
founder explicitly does not want to be in any legal fight. No change ships
if it would violate any law in that doc. Before any UI / copy / data /
flow change, verify against the compliance baseline.

The three rules that override everything:

1. **Ava is never a doctor, nurse, or licensed clinician** — not in name,
   voice, styling, or implication. Clinical decisions belong to the
   partner clinical-services org (OpenLoop / CareValidate).
2. **PHI never leaves the protected zone** — no localStorage,
   sessionStorage, URL params, console logs, analytics events, third-party
   services without a BAA.
3. **Compliance is enforced in code where possible** — banned phrases,
   crisis keywords, persistent disclosure badges, age gates, click-to-cancel
   parity all wired so accidental violations are hard.

Heightened-risk items currently active:
- 🔴 **DEA telemedicine flexibilities expire Dec 31, 2026** — existential
  if not extended. No in-person backup yet. See baseline §1.
- 🔴 **NY AI Companion Law — $15K/day exposure** since Nov 5, 2025. AG
  actively monitoring. See baseline §4.
- 🟡 **CA SB 243 — private right of action** + $1K/violation since Jan 1,
  2026. See baseline §3.
- 🟡 **FTC Healthcare Task Force** — launched March 2026, horizon-scanning
  AI telehealth. See baseline §6.

When in doubt, ask the healthcare attorney before merging or shipping.

## What is this?

Next.js frontend for **withava.co** — an AI-powered men's health optimization companion focused on TRT (testosterone replacement therapy). Ava is the AI companion that guides men through a conversational health assessment, builds a real-time health radar chart, and connects them with licensed clinicians for treatment.

**The avatar IS the differentiator inside a credible medical funnel.** Ava conducts the structured intake at `/qualify`, narrates the post-result walkthrough on `/profile`, and runs the optional free-form follow-up at `/chat`. She's not the front door (that's the multi-section landing with credibility content) — she's the experience inside the proven shell. If you remove Ava, the funnel still looks like a real medical service. If you remove the credibility shell, no one trusts Ava. Both layers exist deliberately. *(See `docs/SPEC.md` for the redesign rationale; the original "avatar is the front door" framing was retired.)*

This codebase ships **two consumer brands** off the same backend:

- **Ava** (`withava.co`) — mainstream/high-performer hook. Tagline: *"You're not lazy. You're depleted."*
- **Lux** (`withlux.co`) — sexual/performance hook. Tagline: *"Can't perform like you used to?"*

Same lab panel, same clinician, same prescription, same `$199/month` base. **Different doors** for different psychologies. The CrossFit guy who can't recover and the man who can't perform are often the same condition (low T) reached via different ad surfaces.

## Source-of-truth docs

Read these in order when you need deeper context — they sit in `docs/`:

| Doc | When to consult |
|---|---|
| `business_context.md` | **Primary strategic source.** Why TRT, why dual-brand, MSO model, pricing, compliance posture, founder context. Treat as the "why" behind every product decision. |
| `COMPLIANCE_BASELINE.md` | **The bar.** Per-law compliance rules + pre-launch checklist + audit cadence. `pnpm verify` enforces a subset in CI. |
| `PRODUCT_ROADMAP.md` | Phased plan (Phase 1 / 1.5 / 2 / 2.5 / 3 / Never). Mirrors `src/lib/serviceCatalog.ts`. |
| `VENDOR_CALL_PREP.md` | Pre-call agenda for OpenLoop / CareValidate. Read before any clinical-partner conversation. |
| `SPEC.md` | Page-by-page UX spec. Layouts, component sizes, copy, system prompt. |
| `DESIGN.md` | Color/typography/animation tokens. CSS variables in `src/app/globals.css` mirror this. |
| `ARCHITECTURE.md` | Frontend ↔ backend split, PHI boundary, MVP shortcut, multi-brand wiring. |
| `COMPLIANCE.md` | Engineering implementation of the 5-layer safeguards. Banned phrases, emergency keywords, judge pattern. |

## Owner & business context

- **Entity:** Eigen Holdings LLC (Delaware, filed Apr 6, 2026, file #10574078). MSO model — owns tech, brands, customer relationship; **does NOT practice medicine**. Clinical infra is rented from OpenLoop / CareValidate.
- **Founder:** Peng Wei. Staff ML Engineer at Veradigm (healthcare IT). CrossFit athlete — IS the target customer. Solo, bootstrapped (~$7-10K total startup investment).
- **Stage:** Pre-launch. Phase 1 = text-only chat. Phase 2 = live avatar (Simli) once revenue justifies it.
- **Veradigm IP separation:** Day-job is healthcare IT at Veradigm. Keep this codebase fully separate — separate GitHub account, separate machine, no Veradigm code/IP touches this repo.

## Tech stack (as built)

- **Framework:** Next.js 15.5 (App Router), React 19
- **Language:** TypeScript 5 (strict)
- **Styling:** Tailwind CSS v4 + CSS custom properties for theme tokens
- **Fonts:** Inter (display + body) + JetBrains Mono (tabular numbers, eyebrows, panel IDs) via `next/font/google`. Cormorant Garamond + DM Sans were retired in the Hone-register redesign.
- **Charts:** Custom SVG radar (no chart library) — full control over the score-tween animation
- **Package manager:** **pnpm** (pinned via `packageManager` in `package.json`)
- **Deployment:** Vercel
- **State:** React hooks + `ProfileScoresContext` for chat→profile handoff. **No localStorage / sessionStorage / URL params for PHI.**
- **API path (MVP):** Frontend calls Claude directly with `anthropic-dangerous-direct-browser-access`. Mock fallback when no key. **Replaced by AWS-hosted backend before production** — see `docs/ARCHITECTURE.md`.

### Phase 1 vs Phase 2

| | Phase 1 (now) | Phase 2 (revenue-funded) |
|---|---|---|
| Chat | Text only, animated orb | Live avatar (Simli) |
| Backend | None — frontend → Claude direct | AWS Lambda/RDS, HIPAA zone |
| Cost/conversation | ~$0.003 (Claude only) | ~$0.21 (Whisper + Claude + ElevenLabs + Simli) |
| Avatar gate | n/a | Earned: 3+ symptom areas covered, 5-min cap |

## Geo-availability — formal compliance mitigation

Implemented in `src/lib/launchStates.ts`. Single source of truth.

| State | Day 1 status | Reason |
|---|---|---|
| **NY** | **Blocked** | NY AI Companion Law $15K/day exposure. Re-enable after counsel + insurance, target Month 9-12 |
| **CA** | **Blocked (deferred)** | CA SB 243 PRA + AB 489 require careful implementation review. Re-enable after CA-specific compliance audit, target Month 6 |
| Other 48 | Available | Subject to clinical-partner license map (filled in once OpenLoop signs) |

When a blocked-state user picks their state on `/qualify` step 1, the flow short-circuits to `<StateWaitlist>` — friendly note, email capture, "pick a different state" fallback. No Claude calls, no scoring, no advancement. The waitlist email is currently `console.warn`'d in dev — wire to backend when one exists.

**To re-enable a state:** edit `BLOCKED_STATES` in `src/lib/launchStates.ts`. Run the pre-launch checklist for that state in `docs/COMPLIANCE_BASELINE.md` first. Update marketing copy ("30+ states") in lockstep — `Hero`, `TrustStrip`, `FAQ`, `intakeFlow.ts` helper text.

## Pricing

- **Base:** $199/month — TRT + clinician access + lab monitoring + AI companion (all-inclusive)
- **Premium:** $299/month — base + peptides/longevity stack (Sermorelin, NAD+) + advanced markers + quarterly video consult
- **Blended ARPU target:** ~$219/month (assumes 20% upgrade)
- **Positioning (post May 2026 audit):** Above the contested $129-179 mid-market band (Henry Meds $129 all-in, Hone Premium effective $177), below concierge (Defy $200-250+, Marek $225+). The pricing pivot from $149/$249 to $199/$299 was made on May 7, 2026 after research showed $149 wasn't differentiated from Henry's $129 all-inclusive offering.
- Both tiers are visible on the landing per FTC transparent-pricing rule. HSA/FSA approved. 30-day money-back. Premium reframes Base as the value option from day 1.

## Design system — Hone register (post-redesign)

- **Theme:** Dark only. Premium clinical wellness, warm-dark. Hone Health × Function Health × Whoop, NOT luxury spa. Multi-section landing with credibility content + avatar inside the funnel.
- **BG:** `#0a0d12` warm-dark gradient (`#0a0d12 → #0e1218 → #0c1016`). No film-grain overlay (retired with the original aesthetic).
- **Accent (Ava):** Teal `#14a89a` / `#2dd4bf` — slightly warmer than original. **Gold:** `#c8a873` / `#d9bb88` — used sparingly for premium tier, milestones, 5-star ratings. **(Lux):** Purple `#8b5cf6` / `#a78bfa` — flips via `[data-brand="lux"]` on `<html>`, no JS branching.
- **Text:** Warm cream tones — primary `#f5f1e8`, secondary `#b8b3a8`, muted `#8a8579`. Replaces the original cool blue-white.
- **Type:** **Inter** for display + body (weight 200 for hero headlines, 400 for body, 500 for buttons). **JetBrains Mono** for tabular numbers, section eyebrows, panel IDs, status pills. Cormorant Garamond + DM Sans were retired.
- **Buttons:** Pill shape (radius 100px). Three styles — `.cta-primary` (gradient teal, dominant), `.cta-secondary` (transparent w/ neutral border), `.ghost-button` (legacy, kept for backward compat).
- **Section eyebrow pattern:** mono uppercase 11px label with hairline `--` prefix. Anchors every section heading consistently. Borrowed from Stripe Press / NEJM editorial register.
- **Radar:** 6 axes (energy ⚡ / recovery 💪 / sleep 🌙 / drive 🔥 / mood 🧠 / body 📊). Polygon morphs via `requestAnimationFrame` tween (not CSS — `<polygon>` `points` is not animatable). 800ms cubic-bezier. Honors `prefers-reduced-motion`.
- **Float animation retired** — was the most "toy-like" tell on the original landing. Hero is static now; orb only animates inside the intake (`orb-speak` pulse on each `<AvaQuestion>` mount).

## Compliance — five built-in safeguards

> Full per-law detail and the pre-launch checklist live in
> `docs/COMPLIANCE_BASELINE.md`. This section is the engineering summary.

Implementation lives in `src/lib/compliance.ts` (frontend half) and the system prompt in `src/lib/systemPrompt.ts`. The backend will add layers 3 and the second copy of layers 2/4 once it exists.

1. **System prompt constitution** — hardcoded rules forbidding diagnosis, prescription, guarantees, clinical credentials. Crisis handling (988 / 911) baked in.
2. **Output filter** — deterministic banned-phrase scan on every Claude response. Auto-prepends AI disclosure to first message if missing.
3. **Judge pattern** — Claude Haiku reviews each response (~$0.0005/check, ~200ms). Backend-only.
4. **Emergency detection** — keyword scan on every user message *before* Claude sees it. Mental health → 988; medical → 911. Bypasses Claude entirely. Logged for state reporting (CA reporting starts 2027).
5. **UI disclosure** — landing footer, first chat message, persistent "ⓘ AI · not a doctor" badge in chat top bar + intake shell + profile + labs, required disclosure checkbox before checkout, ToS, privacy.

### Pre-merge gate (verify before any change ships)

Run through this whenever you touch UI, copy, or chat behavior:

- [ ] No new "Dr.", "physician", "MD", "RN", "NP", "DO", "PA", "PharmD" anywhere
- [ ] No new stethoscope / white-coat / exam-room / scrubs imagery
- [ ] AI disclosure (`ⓘ AI · not a doctor` badge) still visible on every page Ava appears
- [ ] If you added a new chatbot surface: `filterResponse()` runs on Ava output, `checkEmergency()` runs on user input
- [ ] If you touched marketing copy: no "guaranteed", no "FDA-approved program", no before/after without compensation/typicality
- [ ] If you touched checkout: click-to-cancel still works, all-in pricing still visible, disclosure checkbox still required
- [ ] If you touched score / intake handoff: PHI still stays in `ProfileScoresContext` (in-memory) — never localStorage / URL / cookie

### Why this matters legally (active statutes as of May 2026)

| Law | Effective | Exposure | Risk |
|---|---|---|---|
| **CA AB 489** | Jan 1, 2026 | Each prohibited use = separate violation; injunction | MEDIUM-HIGH |
| **CA SB 243** | Jan 1, 2026 | Private right of action, $1,000/violation + attorneys' fees | MEDIUM-HIGH |
| **NY AI Companion Law** | Nov 5, 2025 | AG enforcement, **$15,000/day** | MEDIUM-HIGH |
| **TX TRAIGA** | Jan 1, 2026 | AI-in-diagnosis disclosure required | MEDIUM |
| **IL chatbot law** | Aug 2025 | Chatbots cannot pose as licensed providers | MEDIUM |
| **FTC** | Active | Healthcare Task Force launched March 2026, horizon-scanning AI telehealth | MEDIUM |
| **DEA Sched III + telemed flex** | Through Dec 31, 2026 | Existential if not extended | HIGH (time-bounded) |
| **HIPAA** | Active | HHS OCR + civil exposure | LOW with proper architecture |

## Avatar persona

| | Ava | Lux |
|---|---|---|
| Personality | Athletic, warm, evidence-based — like a sharp friend who understands endocrinology | Confident, direct, zero judgment — sees you clearly without flinching |
| Hook | "You're not lazy. You're depleted." | "Can't perform like you used to?" |
| Channels | TikTok, LinkedIn, CrossFit gyms | TrafficJunky, Reddit NSFW, late-night YouTube |
| Entry symptoms | Energy, recovery, sleep, brain fog | Libido, ED, stamina, performance anxiety |

**She NEVER:** diagnoses, prescribes, guarantees outcomes, claims medical credentials, predicts that the user "will" feel better.
**She CAN:** educate ("commonly associated with"), ask about symptoms, update health scores, recommend lab testing, redirect to 988/911 in a crisis.

### Banned language patterns

- "you have [condition]" → "these symptoms are commonly associated with"
- "take X mg" / dosing → "a doctor might discuss options"
- "you'll feel better" / guarantees → "many men report improvement"
- "we'll get you a prescription" → "if medically appropriate"
- Never use "Dr.", "physician", "as a medical professional"

## Project structure (as built)

```
ava-web/
├── CLAUDE.md                  ← You are here
├── README.md                  ← Setup instructions
├── docs/
│   ├── business_context.md   ← Primary strategic source
│   ├── SPEC.md               ← Full product specification
│   ├── ARCHITECTURE.md       ← Technical architecture
│   ├── COMPLIANCE.md         ← Legal safeguards & rules
│   ├── DESIGN.md             ← Design system details
│   └── CLAUDE_CODE_BUILD_GUIDE.md  ← Phased build walkthrough
├── src/
│   ├── app/                  ← Next.js App Router routes
│   │   ├── layout.tsx        ← Root: fonts, metadata, ProfileScoresProvider
│   │   ├── globals.css       ← Design tokens (CSS vars) + animations
│   │   ├── page.tsx          ← Landing (orb + tagline + Talk to me)
│   │   ├── chat/page.tsx     ← Chat experience (Phase 4)
│   │   ├── profile/page.tsx  ← Radar + score breakdown + Get your lab kit
│   │   ├── labs/page.tsx     ← Lab kit details + required disclosure + CTA
│   │   ├── privacy/page.tsx  ← Privacy policy
│   │   └── terms/page.tsx    ← Terms of service
│   ├── components/
│   │   ├── avatar/AvaOrb.tsx           ← SVG iris/aurora — scales 36-200px
│   │   ├── charts/RadarChart.tsx       ← rAF-tweened polygon
│   │   ├── charts/AnimatedRadar.tsx    ← Mounts at neutral, animates to target
│   │   ├── charts/ScoreBar.tsx         ← Severity-colored bar
│   │   ├── chat/ChatTopBar.tsx         ← Orb + name + AI badge + status + mini radar
│   │   ├── chat/MessageBubble.tsx
│   │   ├── chat/SuggestionPills.tsx
│   │   ├── chat/ChatInput.tsx
│   │   └── chat/TypingDots.tsx
│   ├── hooks/
│   │   └── useChat.ts        ← Messages, scores, phase, send(), mock fallback
│   ├── lib/
│   │   ├── brand.ts          ← BRAND env + brandConfig (Ava + Lux)
│   │   ├── claude.ts         ← MVP-only direct Anthropic call + mockClaude
│   │   ├── compliance.ts     ← Banned phrases + emergency keywords + filter
│   │   ├── profileScores.tsx ← Context for chat → profile score handoff
│   │   ├── scoring.ts        ← classify, severityColor, overall, weakest
│   │   └── systemPrompt.ts   ← Brand-aware Ava system prompt
│   └── types/index.ts        ← HealthScores, ChatMessage, ChatResponse, etc.
├── eslint.config.mjs
├── next.config.ts
├── postcss.config.mjs
├── tsconfig.json
├── package.json              ← pnpm-pinned
└── .env.example
```

## Environment

```env
# .env.local (never commit)
NEXT_PUBLIC_BRAND=ava                         # ava | lux
NEXT_PUBLIC_API_URL=http://localhost:3001     # Backend API (Phase 2+)
NEXT_PUBLIC_ANTHROPIC_API_KEY=                # MVP only — direct browser→Claude. Remove for prod.
NEXT_PUBLIC_SIMLI_API_KEY=                    # Live avatar (Phase 2)
```

When `NEXT_PUBLIC_ANTHROPIC_API_KEY` is unset the chat falls back to `mockClaude()` — the funnel demos end-to-end with zero API spend.

## The funnel — graduated cost gates (post-redesign)

Each tier earns the next. Don't give everyone the most expensive experience.

| Tier | Route | Cost / visitor | Purpose |
|---|---|---|---|
| 1 | `/` | $0 | Multi-section landing. Credibility shell — orb teased small, video placeholders ready, pricing visible. ~70% bounce here. |
| 2 | `/qualify` | $0 | Avatar-led structured intake — 9 steps, ~5 min, pure client-side flow. No Claude calls. Email captured at step 9. |
| 3 | `/profile` → `/labs` | $0 | Profile recap + lab kit page. Static. ~5-10% convert to `$199/month` base or `$299/month` premium. |
| 4 | `/chat` (free-form) | ~$0.003/msg | Optional Claude conversation post-intake. Contextual greeting from intake answers. |
| 5 | Live avatar session (Phase 2) | ~$0.25 | Simli + ElevenLabs. Activates after 3+ free-form turns. 5-min cap. |

### Hard cost ceilings (non-negotiable)

- 5-min avatar session cap (Phase 2)
- Daily AI budget: $100/day
- Concurrency: 50 simultaneous avatar sessions
- No avatar for repeat non-converters (3+ visits without purchase)
- The original "6 free messages anonymous + 12 signed-up" gate was front-door semantics for the open-chat-as-landing experience. Retired in the redesign — `/qualify` (structured, no Claude) is the new front door, and `/chat` is opt-in.

## Working principles

1. **TRT durability over GLP-1 hype.** Testosterone is a 40-year-old generic — there is no Novo Nordisk moment coming. Customers pay for the *experience*, not the molecule.
2. **The avatar IS the product.** Every page must justify itself relative to that. No feature bloat.
3. **Credibility shell + avatar inside.** Multi-section landing carries the proof (clinician, lab partner, pricing, FAQ, money-back). The AI avatar lives inside the funnel — `/qualify` for structured intake, `/chat` for free-form follow-up — where the differentiation actually lands. The original "minimalism IS the product" stance was retired during the redesign because skeptical TRT patients need credibility before aesthetic refinement.
4. **Compliance built into code, not policy docs.** Every safeguard must be enforceable at runtime.
5. **Cost architecture from day one.** Graduated funnel + hard ceilings + text fallback.
6. **Retention over acquisition.** Three layers: biological (TRT itself), visible progress (radar diff at Day 90), ongoing relationship (monthly Ava check-ins).
7. **Never call ourselves an "AI company."** We're a men's health optimization platform. The AI is the experience, not the pitch.

## HIPAA / privacy posture

- **No PHI in the frontend** at rest. React state only — refresh wipes it.
- **No localStorage, sessionStorage, URL params, or analytics events** carrying health content.
- **Score handoff** between routes uses `ProfileScoresContext` (in-memory, lost on reload). PHI never enters the URL bar.
- **All API calls over HTTPS.** Production backend lives in a HIPAA zone (AWS, BAA in place).
- **Console:** never log conversation content in production.
- **PHI flow boundary:** Simli, ElevenLabs, PostHog, and Vercel never see user symptoms — only Ava's output (Simli/EL) or scrubbed funnel events (PostHog).

## Commands

```bash
pnpm install            # First-time setup
pnpm dev                # Dev server on localhost:3000
pnpm build              # Production build
pnpm lint               # ESLint (next/core-web-vitals + next/typescript)
pnpm type-check         # tsc --noEmit
pnpm audit:compliance   # docs/COMPLIANCE_BASELINE.md regression check
pnpm verify             # composite: type-check + lint + audit:compliance
```

**Run `pnpm verify` before any commit or merge.** It runs static checks and the compliance audit script (`scripts/audit-compliance.sh`) which fails the build on regressions like a re-introduced "Dr." reference, missing AI disclosure badge, NY/CA accidentally re-enabled, or banned marketing copy. See `docs/COMPLIANCE_BASELINE.md` for the rule list.

## Working with this project

- **Mobile-first.** Design at 375px, scale up. Most traffic comes from TikTok (Ava) or NSFW networks (Lux) — both mobile-heavy.
- **Server components by default.** Add `"use client"` only when the file actually needs hooks/events.
- **Brand-swappable copy.** Anything user-facing must read from `brandConfig` (or a per-brand file) so Lux can ship the same code with different words.
- **No backwards-compat shims.** Pre-launch — change code freely, no migrations to preserve.
- **Test the full funnel after any UI change.** Landing → qualify → profile → labs (with `/chat` as optional side trip). Broken funnels lose customers, not just users.
- **Don't commit unless explicitly asked.** The repo is the founder's source-of-truth — let them decide checkpointing.
