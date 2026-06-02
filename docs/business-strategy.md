# Eigen Holdings — Business Strategy Plan
## Ava / Lux: AI Wellness Companion for Men's Health

**Version:** 4.0 — June 2026 (revised for robustness, realism, and reduced risk)
**Founder:** Peng Wei | **Entity:** Eigen Holdings LLC (Delaware)
**Status:** Pre-launch, bootstrapped ($10K)

> **What changed from v3.0:** This revision corrects three financial/legal assumptions that flattered the model, replaces the optimistic projections with a conservative base case, sequences the launch behind explicit decision gates so capital is never spent ahead of proof, and narrows the launch to a single brand. The concept is unchanged. The discipline around it is new.

---

## 0. Operating Principles for This Revision

Five rules govern every decision in this plan:

1. **Anchor to the conservative case.** All projections below use a 3-5% subscription rate and a 1-3% referral-conversion rate. If reality beats that, it's upside — never planned-on.
2. **Never spend ahead of proof.** Each phase has a decision gate. Money for the next phase is released only when the prior gate's metric is hit. (See §16.)
3. **Sessions and subscriptions must stand alone.** Referral commissions are treated as upside, not base-case revenue. If the business only works *with* referral income, it doesn't work.
4. **Protect the expensive component.** The live avatar is the single largest variable cost. It is never given to anonymous traffic and never sold below a hard floor.
5. **Compliance is a feature, not a tax.** The safeguard system is also the legal moat. Build it first, lean on it in marketing, audit it continuously.

---

## 1. Executive Summary

Ava is an AI wellness companion that helps men understand their health through live avatar conversations. A man talks face-to-face with Ava — an AI avatar powered by Claude, ElevenLabs, and HeyGen's LiveAvatar — and receives a real-time wellness profile (radar chart) based on his self-reported symptoms.

The business monetizes through three streams, in priority order: **(1) session sales** (wellness profiles, $9-49), **(2) monthly subscriptions** ($12.99-49/mo for memory and tracking), and **(3) affiliate referral commissions** (treated as upside). Streams 1 and 2 must be profitable on their own.

This is **not** a telehealth company. We don't prescribe, diagnose, or treat. We operate as a general wellness tool under the FDA's January 2026 guidance — a positioning that holds only as long as we maintain strict conversational discipline (§10).

**Lux**, the performance-focused second brand, is **deferred to Phase 3** and launches only after Ava's funnel is validated (§4, §16).

---

## 2. The Problem

Men over 30 experience declining energy, strength, drive, sleep quality, and body composition. Most know something is "off" but don't act because seeing a doctor feels like admitting weakness, they don't know which symptoms matter or what to ask for, intake forms feel clinical and impersonal, and they don't want to commit to treatment before understanding the problem.

The result: millions of men suffer in silence with addressable conditions because the front door to men's health is designed for people who already know what's wrong.

## 3. The Solution

Ava is the front door. Instead of a form, men talk to an AI companion with a face, a voice, and a personality. The conversation naturally explores what's going on. A real-time radar chart builds as they talk, showing their health patterns visually. When the conversation reveals patterns that warrant professional evaluation, Ava can connect them with licensed clinical partners — naturally, never pushily, always optional.

The AI companion IS the product. The radar chart IS the hook. The subscription is the retention engine. The referral is the upside.

---

## 4. Brand Strategy — Phased, Not Parallel

**v3.0 launched two brands at once. v4.0 launches one, proves it, then clones.**

### Phase 1-2: Ava only (withava.co) — Mainstream men's health optimization

Personality: Athletic, warm, evidence-based — a sharp friend who understands health optimization. Tagline: "Let's figure out what's going on."

Channels: TikTok organic, Instagram, YouTube, LinkedIn, Reddit, SEO. All organic or near-zero cost.

**Why single-brand first:** A solo founder on a $529/mo budget cannot build, market, and stay compliant across two brands, two ad networks (CrakRevenue vs RevOffers, with conflicting content rules), and two audiences in week one. The codebase supports both — your attention does not. Validate the funnel on Ava, then deploy Lux as a config change.

### Phase 3: Lux (withlux.co) — Performance and vitality *(deferred — see gate in §16)*

Personality: Confident, direct, zero judgment. Tagline: "Things aren't working like they used to?"

Channels: TrafficJunky (adult display), Reddit. Priced 30-35% above Ava. **Launched only after Ava clears its Phase 2 gate.** Same product, same codebase, different personality and channels — deploy once, serve two markets, but *sequentially*.

---

## 5. Revenue Model

### 5.1 Revenue Streams (priority order)

| Priority | Stream | Products | Margin | Role |
|---|---|---|---|---|
| 1 | Wellness profiles | Starter ($9), Profile ($29), Deep ($49) | 55-70% | Core funnel |
| 2 | Subscriptions | Plus ($12.99/mo), Pro ($29/mo), Max ($49/mo) | 65-80% | Retention engine |
| 3 | Credit top-ups | 10/$11.99, 30/$29.99, 60/$54.99 | 45-60% | Power users |
| 4 | Affiliate referrals | CPA on conversion (~$30-75 Hone, ~$40 ED) | ~100% | **Upside only** |

> **Margin revision:** v3.0 listed 67-83% margins. Those assumed COGS was lighter than reality. The corrected margins above reflect full session wall-clock billing, the stacked voice layer, Stripe fees, free-preview leakage, and retries. They are still healthy — just honest.

### 5.2 Pricing Philosophy

Sell the wellness OUTCOME, not avatar minutes. Users buy a "private wellness profile," not "15 minutes with an AI." The Live Credit system meters the expensive avatar experience while subscriptions sell memory, tracking, and progress monitoring (which cost almost nothing to deliver).

**Hard pricing floor (revised): minimum $0.75/credit effective rate** for all standard sales. The deep-discount $0.55/min rate is reserved for Max subscribers only and capped in monthly volume. Never sell a standard credit below $0.75. (v3.0's $0.55 floor was too thin against realistic COGS — see §5.4.)

### 5.3 Detailed Pricing — Ava

**One-Time Products (no commitment):**

| Product | Price | Live Credits | Includes | Realistic COGS | Margin |
|---|---|---|---|---|---|
| Free | $0 | **Text-only, no avatar** | 8-10 text msgs/day, partial radar | ~$0.02 | Activation |
| Starter Check-In | $9 | 8 | Guided check-in, basic radar | ~$3.20 | 64% |
| Wellness Profile ⭐ | $29 | 12 | Full radar, report, clinician questions | ~$4.80 | 83% |
| Deep Wellness Profile | $49 | 25 | Full report, 7-day text follow-up | ~$10.00 | 80% |

> **Two changes from v3.0:** (1) The free tier is now **text-only** — the 60-second avatar preview is removed. The avatar is the most expensive component and is no longer given to anonymous traffic. The avatar becomes the first *paid* unlock. (2) The hero $29 Wellness Profile drops from 15 to 12 included credits to protect margin against longer real-world session wall-clock.

The $29 Wellness Profile remains the hero product: highest margin, clearest value, natural referral point.

**Subscriptions (recurring, memory + tracking):**

| Plan | Price/mo | Credits/mo | Key Value | COGS | Margin |
|---|---|---|---|---|---|
| Ava Plus | $12.99 | 4 | Memory, weekly tracking | ~$1.60 | 79% |
| Ava Pro | $29 | 16 | Monthly report, trends | ~$5.60 | 75% |
| Ava Max | $49 | 40 | Advanced tracking, priority | ~$13.00 | 70% |

Subscriptions sell SOFTWARE VALUE (memory, tracking, reports) that costs nearly nothing. The included avatar credits are a small bonus, not the core value.

**Top-Up Credit Packs (revised pricing — floor raised to $0.75):**

| Pack | Price | Effective Rate | COGS | Margin |
|---|---|---|---|---|
| 10 Credits | $11.99 | $1.20/min | ~$3.50 | 71% |
| 30 Credits | $29.99 | $1.00/min | ~$10.50 | 65% |
| 60 Credits | $54.99 | $0.92/min | ~$21.00 | 62% |
| 150 Credits | $112 | $0.75/min | ~$52.50 | 53% |

Subscriber discounted rates: Plus $0.85/min, Pro $0.80/min, Max $0.75/min (Max can access $0.55/min only on a capped volume). High-volume packs (150) shown after 3+ top-up purchases.

**Lux Pricing (Phase 3):** 30-35% premium over Ava. Performance Profile $39, Lux Pro $39/mo, Lux Max $59/mo.

### 5.4 Unit Economics — Corrected

**The critical correction.** v3.0 budgeted COGS against *avatar-speech minutes*. You are billed against *session wall-clock* (the user pauses, reads, types — all streamed, all billed). The realistic blended COGS per *sold* minute:

| Component | Cost/min (realistic) |
|---|---|
| HeyGen LiveAvatar Lite (full session wall-clock) | $0.10 |
| ElevenLabs Conversational AI (STT + TTS + bundled LLM) | $0.08-0.12 |
| Infrastructure + safety buffer | $0.02-0.04 |
| Retries + logging + failed-session overhead | $0.04-0.06 |
| **Blended realistic COGS** | **$0.24-0.32/min** |

> **Architecture decision required:** Either (a) use ElevenLabs' bundled LLM (cost is inside the $0.08-0.12 above), or (b) route to your own Claude separately and add ~$0.01-0.03/min. You cannot have both. v4.0 assumes **(a) bundled** at launch for simplicity, migrating to **(b) Claude-routed** only if conversation quality demands it. Pick one and re-cost before launch.

**Text chat cost:** ~$0.0005/message (Claude Haiku, no avatar). This is why the free tier is text-only.

**Implication:** Your "conservative" $0.30 is your *realistic* number. There is little hidden buffer. Hence the $0.75 floor and the text-only free tier — both protect the one cost that can quietly erode the business. The shareable Ava video is a **templated render**, not a per-user generation, for the same reason (§6.5).

---

## 6. The Radar Chart — Product Core

### 6.1 Six Dimensions

| Category | Icon | What It Means to Him | Scoring Based On |
|---|---|---|---|
| Energy | ⚡ | "Why am I dead by 2pm?" | Fatigue, crashes, endurance |
| Strength | 💪 | "Why can't I build muscle?" | Recovery, physical performance |
| Sleep | 🌙 | "I sleep 8 hours and still tired" | Quality, duration, waking patterns |
| Drive | 🔥 | "Things aren't working like before" | Libido, motivation, ambition |
| Focus | 🧠 | "I can't think straight anymore" | Brain fog, irritability, clarity |
| Body | 📊 | "I gained 20 lbs doing nothing" | Composition, weight, appearance |

### 6.2 Scoring Tiers

| Overall Score | Label | Color |
|---|---|---|
| 80-100 | Optimized | Green |
| 65-79 | Solid | Light green |
| 50-64 | Room to Grow | Amber |
| 35-49 | Needs Attention | Orange |
| 20-34 | Flagged | Red |
| 0-19 | Critical | Dark red |

Most men score 35-55 on first assessment — the "I need to fix this" zone. Urgent enough to act, not so low it feels hopeless.

> **Compliance note:** Scores are wellness indicators, never clinical measurements. The labels deliberately avoid diagnostic language ("Needs Attention," not "Likely Hypogonadal"). This wording is load-bearing for the FDA general-wellness positioning (§10).

### 6.3 Engagement Mechanics

The radar chart is a game mechanic, not a medical assessment: incomplete profiles ("??" gaps drive the Zeigarnik effect), trend arrows (progress dopamine), a shareable score card (viral loop, see §6.4), and a single 0-100 score that sticks like a credit score.

### 6.4 Two Artifacts: The Private Profile and the Brag Card

The profile is one of our core products, so it must do two jobs that pull in opposite directions: be **informative enough to be worth paying for**, and be **shareable enough that a man wants to post it**. These goals conflict — the more a men's-health profile reveals, the less a man will publicly attach his name to it. No man shares "my Drive score is 28." Resolving this requires **two distinct artifacts from the same session**, not one.

**Artifact 1 — The Private Profile (the paid deliverable, where "informative" lives).**
Full radar across all six dimensions, the written report, specific patterns, and clinician questions. Rich, personal, private. Never designed for sharing. This is what justifies the $29 and is delivered to the user's account only.

**Artifact 2 — The Brag Card (the shareable artifact, where "show off" lives).**
Designed to be *aspirational, not diagnostic* — modeled on how people share Strava, Whoop, and Oura results. Men post their **commitment and progress**, never their deficits. The brag card therefore strips all sensitive content and leans on:

- **The overall score as a clean, abstract number** (credit-score style — no symptom detail).
- **Progress over time** ("+14 since I started" — far more shareable than any absolute score).
- **The radar *silhouette*, not the axis labels** — the shape reads as "data-driven self-improvement" without spelling out "libido" or "ED."
- **An optional Ava video clip** framed as a hype/coaching moment, not a readout of his problems.

| | Private Profile | Brag Card |
|---|---|---|
| Audience | The user only | His social feed |
| Content | Full radar + report + patterns + clinician Qs | Overall score, progress delta, radar silhouette |
| Sensitive data | Yes (private) | **None — stripped** |
| Personal identifiers | In-account | Name/handle optional, opt-in only |
| Purpose | Justify the $29 | Drive the viral loop |

### 6.5 The Ava Video Clip — High Value, Highest Risk

A shareable Ava video is a strong growth lever and the most legally and financially sensitive component on the platform, because a public video is **permanent and screenshot-able** in a way an ephemeral chat is not. Three hard constraints govern it:

1. **Compliance:** The video script passes through the same output filter as all conversation (§10.2). Ava on a public clip must say something motivating and **generic enough to be safe** — e.g., *"Mark's been putting in the work — his energy's up 14 points this month"* — and must **never** narrate symptoms, conditions, or anything diagnosis-adjacent. Video output is audited more strictly than chat, precisely because it persists publicly.
2. **Cost:** A freshly generated avatar video per user is real LiveAvatar COGS and a margin leak at scale. The shareable clip is therefore a **templated render** — a pre-built Ava performance with the name, score, and progress delta swapped in — not a unique generation each time. This caps per-share cost to near-zero and is decided at build time.
3. **Consent & likeness:** Terms of service must explicitly grant the user the right to re-share Ava's likeness publicly, and must cover the user's own appearance/handle if included. Reviewed by the attorney (§10.5).

### 6.6 Day-One Card vs. Progress Card

The artifact differs by *when* the user shares:

- **Day-one card** (first session): leads with the abstract overall score and the radar silhouette, framed as *"I just got my baseline — let's see where this goes."* Lower share rate (men are wary of posting a first weak score) but captures early enthusiasm.
- **Progress card** (after weeks of tracking): leads with the **delta** (*"+14 in 6 weeks"*) and an Ava hype clip. This is the **higher-converting, lower-risk** share, and it only exists if the user has been tracking over time — which is exactly what the **subscription** sells.

**Design priority:** build the **progress card first**. It is the safer artifact, the more shareable one, and it directly reinforces subscription value (you can only show progress if you've subscribed and tracked). The day-one card is a fast follow.

---

## 7. Conversation Design

### 7.1 Flow Structure

| Phase | Messages | What Happens |
|---|---|---|
| Opening | 1-2 | Warm greeting + AI disclosure + open question about energy |
| Exploration | 6-10 | Cover 3-4 of 6 categories, score updates after each |
| The Gap | 2-3 | Show radar with "??" gaps, tease full profile |
| Decision | 1 | CTA: Wellness Profile ($29) / Starter ($9) / Continue text / optional referral |
| Close | 2-3 | Complete chart (if paid), optional referral, share card |

### 7.2 Key Design Principles

- Ava asks about ONE category per exchange, not rapid-fire.
- Each question flows naturally from what the user just said.
- Leave 2-3 categories unscored in the free (text) session to create completion urgency.
- Referral links are always *available* but never pushed, always with a "not right now" option.
- **Referral-adjacent language is audited.** The conversation must never drift from "a provider could help investigate this" toward "you likely have low testosterone." This drift is the single thing that flips you from wellness tool to regulated medical-claim-maker (§10.3). The output filter flags and logs all referral-context language for review.

### 7.3 Wearable Integration Path

| Phase | Approach | Cost |
|---|---|---|
| Launch | Ask user about wearable data verbally | $0 |
| Phase 2 | Apple Health CSV upload | $0 |
| Phase 3+ | Terra API integration (Garmin, Whoop, Oura, Fitbit) | $200-500/mo |

---

## 8. Memory System

Memory is what makes the subscription worth paying for. Without memory, Ava is a stranger every session. With memory, she's the health companion who knows your story.

### 8.1 Architecture

| Component | Storage | Injection |
|---|---|---|
| User facts (age, symptoms, lifestyle) | Supabase `user_facts` (encrypted at rest) | Loaded into system prompt |
| Session summaries (150 words each) | Supabase `session_summaries` (encrypted) | Last 3 included in prompt |
| Health score history | Supabase `health_scores` (encrypted) | Latest scores in prompt |

Before each session: load facts + summaries + scores, inject into system prompt. After each session: Claude Sonnet generates a summary and extracts new facts. Cost: ~$0.01 per summary.

### 8.2 Data Security (new in v4.0)

You are storing self-reported, sensitive men's-health data (libido, ED, weight, mental-health signals). Even as a "wellness" product, a breach of "users + their drive/libido scores" is a reputational and legal catastrophe. Therefore:

- **Encrypt all health-adjacent fields at rest.**
- **Store the minimum necessary.** Don't retain raw transcripts longer than needed for summarization.
- **Privacy policy must explicitly cover this data** and be reviewed by the attorney (§10.5).
- This is cheap insurance against an existential downside.

### 8.3 Memory Budget

~950 tokens per request. Cost: ~$0.0002/message extra. Negligible.

---

## 9. Technical Architecture

### 9.1 Stack

| Layer | Service | Monthly Cost |
|---|---|---|
| Frontend + API | Next.js on Vercel | $0-20 |
| Database + Auth | Supabase (PostgreSQL, encryption enabled) | $0-25 |
| AI (text chat) | Claude Haiku | ~$20-50 |
| AI (avatar + reports) | Claude Sonnet via ElevenLabs (or direct — see §5.4) | ~$30-80 |
| Live Avatar | HeyGen LiveAvatar (Essential, Lite Mode) | $100 + overage |
| Voice + Agent | ElevenLabs Conversational AI | $5-99 |
| Payments | Stripe | 2.9% + $0.30/tx |
| Affiliate tracking | RevOffers (Ava) / CrakRevenue (Lux, Phase 3) | Free |

Total infrastructure at launch: ~$200-400/mo.

### 9.2 Avatar Pipeline

ElevenLabs Conversational AI Agent connects to HeyGen LiveAvatar via plugin: User speaks/types → ElevenLabs Agent (STT → LLM → TTS) → LiveAvatar renders lip-synced video → WebRTC stream to browser.

**Concurrency safeguard (new):** Essential plan caps at 20 concurrent sessions. If a viral spike maxes concurrency, the system must **gracefully fall back to text-only** rather than showing "all agents busy." This protects both UX and COGS during traffic spikes. The Business-plan upgrade trigger is pre-configured (§9.4).

Text chat uses a separate, fully-safeguarded pipeline: User types → API route → emergency detection → Claude Haiku → output filter → response validator → response.

### 9.3 LLM Routing

| Task | Model | Why |
|---|---|---|
| Live text conversation | Claude Haiku | Fast, cheap |
| Live avatar conversation | ElevenLabs bundled LLM (launch) → Claude Sonnet (if quality demands) | Cost vs quality, decided per §5.4 |
| Session summary | Claude Sonnet | Accuracy for memory |
| Wellness report generation | Claude Sonnet | Quality for deliverable |
| Safety classification | Deterministic rules | No LLM cost |

### 9.4 LiveAvatar Scaling

| Stage | Plan | Concurrency | Trigger |
|---|---|---|---|
| Launch | Essential ($100/mo, 1,000 credits) | 20 | Phase 1 |
| Growth | Business / volume plan | 40+ | Sustained >800 paid avatar-min/mo OR repeated concurrency-cap hits |
| Scale | Enterprise (custom) | 100+ | >30 concurrent sessions sustained |

---

## 10. Compliance & Legal — Strengthened

### 10.1 Regulatory Positioning

General wellness tool under the FDA's **January 6, 2026 General Wellness guidance**. Not a medical device. Self-reported wellness indicators, not clinical measurements. The guidance broadens exemptions for products that provide information without disease claims — but is explicit that implying diagnosis, treatment, or substitution for a cleared device flips you into regulated territory. Our entire conversational discipline (§7.2, §10.3) exists to stay on the right side of that line.

### 10.2 Five-Layer Safeguard System

| Layer | Function | Runs When |
|---|---|---|
| Emergency Detection | Crisis keywords → 988/911, bypasses LLM entirely | Before every LLM call |
| System Prompt Constitution | Defines what Ava can/cannot say | Every LLM call |
| Output Filter | Catches banned phrases + referral-drift deterministically; **applies to shareable video scripts with stricter thresholds (public + permanent)** | After every LLM response, before any render |
| Response Validator | Validates JSON, scores, fields | After every LLM response |
| UI Disclosure | AI badge, footer, checkbox on every page | Always visible |

This system is built **first** (Phase 0-1), before any paid feature. It is also the legal moat — the AI Companion laws below *require* exactly this.

### 10.3 What Ava Can and Cannot Say

| Can Say | Cannot Say |
|---|---|
| "Your energy score is 32" | "You have low testosterone" |
| "Many men with similar patterns..." | "You should take 200mg weekly" |
| "A provider could help investigate" | "You have hypogonadism" |
| "Based on what you've shared" | "Based on my clinical assessment" |

### 10.4 State & AI Companion Law Exposure — Corrected

**This section is materially stronger than v3.0, which understated the risk.**

Your product **is** a "companion chatbot" under current law — adaptive, human-like, sustains a relationship across sessions (via memory), uses an anthropomorphic avatar. You cannot argue out of the definition; it *is* your value prop. Therefore:

- **California SB 243 (effective Jan 1, 2026)** creates a **private right of action** — any user or parent can sue for the greater of actual damages or **$1,000 per violation**, plus attorney's fees. The real threat is plaintiff's-bar litigation, not a daily regulatory fine. The law applies to operators serving CA users **regardless of where the operator is located.**
- **New York AI Companion Models Law (effective Nov 2025)** imposes disclosure and self-harm-protocol requirements; enforced by the AG.
- **Texas**: the AG is actively sending civil investigative demands to AI companies marketing chatbots to vulnerable users. A men's-health AI companion is squarely in scope.

**Mitigation (layered, not single-point):**
1. **Geo-block CA + NY at launch** — reduces but does not eliminate exposure (VPNs, travel, imperfect geolocation; the law follows *who you serve*).
2. **Apply the disclosure + self-harm-protocol requirements everywhere**, not just in blocked states — because they're cheap, they're already in the safeguard system, and they neutralize most of the private-right-of-action risk.
3. **Never market as a mental-health aid** (this is the specific Texas trigger). Ava is a wellness companion, full stop.

### 10.5 Legal Spend — Revised Up

**$3,000-4,000** for pre-launch attorney review, specifically scoped to:
- AI wellness session classification under the Jan 2026 FDA guidance
- **SB 243 private-right-of-action exposure and the companion-chatbot definition**
- **NY AI Companion Models Law compliance**
- **Texas AG enforcement posture** and marketing-language review
- FTC health-claims compliance
- Terms of service + privacy policy (covering encrypted sensitive health data)
- **Shareable Ava video: likeness/consent terms** (user's right to re-share Ava's likeness publicly; coverage of the user's own appearance/handle if included)
- **Wind-down terms: credit-expiration legality by state, data-deletion-on-shutdown clause, audit-log retention policy** (§17A)
- State-by-state geo-block analysis

> v3.0 budgeted $1,500-2,500 and scoped it loosely. The AI-companion-law landscape makes the higher figure and the specific scope non-negotiable. This is the most important $1,500 of additional spend in the plan.

---

## 11. Competitive Landscape

### 11.1 The Gap

| What Exists | Example | What's Missing |
|---|---|---|
| AI emotional companions | Replika, Character.ai | No health focus, no scoring |
| AI therapy tools | Woebot, Wysa | Mental health only, no avatar |
| Health Q&A | ChatGPT Health | No avatar, no scoring, generic |
| Men's health apps | Testmax AI | No avatar, no referrals |
| Wearable scoring | Whoop, Oura | Hardware required, no companion |
| AI girlfriend apps | Candy AI, DreamGF | Entertainment only |
| TRT telehealth | Hone, Hims | Clinical, no AI companion |

The gap — live AI avatar + wellness scoring + health referrals + men's focus — is unoccupied. The moat is the memory-driven relationship plus speed to market, **not** any single technical component (all of which are vendor-supplied and copyable).

### 11.2 Market Size (context, not a forecast)

AI companion apps: $120M revenue (2025), 64% YoY growth. US men's health: $30B+. Digital wellness: $8.5B (2025). These frame the opportunity; they do **not** drive the revenue model below, which is built bottom-up from conservative conversion rates.

---

## 12. Marketing Strategy

### 12.1 Channel Prioritization (Phase 1-2, Ava only)

| Priority | Channel | Cost | Expected Impact |
|---|---|---|---|
| 1 | TikTok organic (Ava) | $29/mo (HeyGen clips) | Primary growth driver |
| 2 | Shareable health score | $0 | Viral loop (coefficient unproven — treat as hopeful) |
| 3 | Reddit organic | $0 | r/Testosterone, r/fitness, r/menshealthover30 |
| 4 | Instagram/YouTube | $0 | Cross-post TikTok content |
| 5 | SEO content | $0 | Long-term compounding |
| 6 | LinkedIn (founder voice) | $0 | Credibility, niche reach |

> **TrafficJunky paid ($500/mo) moves to Phase 3 with Lux**, and even then starts as a **$100-150 test**, not a $500 commitment. Adult-network display has notoriously low intent-match for health funnels; prove CAC on a small test before scaling.

### 12.2 No LegitScript Required

As a wellness technology product (not telehealth), no LegitScript certification is needed for TikTok, Google, Meta, or Instagram advertising — saving ~$2,450/yr and a 2-6 week delay competitors face. (This advantage persists only as long as we maintain the wellness positioning in §10.)

### 12.3 Viral Mechanism

The shareable **brag card** (§6.4) is the growth engine: an aspirational, sensitive-data-stripped artifact a man actually wants to post. The strongest version is the **progress card** — *"My Ava Score: +14 in 6 weeks"* — optionally paired with a templated Ava hype clip (§6.5). It is competitive, visual, one-tap shareable, and crucially shares a **win, not a weakness**, which is what makes men willing to post it. Because progress cards only exist after weeks of tracking, the viral loop also pulls users toward the subscription. **Viral coefficient is assumed 0 in the base-case financials** (§14) and treated purely as upside until measured.

### 12.4 Month 1 Marketing Budget (Ava only)

| Item | Cost |
|---|---|
| HeyGen (pre-recorded marketing clips) | $29 |
| TikTok/Instagram/YouTube/Reddit/LinkedIn | $0 (organic) |
| **Total** | **$29** |

> Down from v3.0's $529, because TrafficJunky is deferred. The freed ~$500/mo extends runway and funds the higher legal spend.

---

## 13. Affiliate & Referral Revenue — Reframed as Upside

### 13.1 Networks

| Network | Offers | Use With |
|---|---|---|
| RevOffers | Hone Health (TRT), mainstream health | withava.co (no adult content) |
| CrakRevenue | BlueChew (ED), adult-friendly offers | withlux.co only (Phase 3) |

### 13.2 The Honest Referral Math

**This is the single biggest correction from v3.0.** Affiliate payouts are **CPA (cost-per-acquisition)** — they fire **only when a referred user completes a qualifying purchase** (e.g., buys Hone's ~$65 lab panel or starts a membership), not "per referred user."

| User Pattern | Category | Partner | CPA (on conversion) |
|---|---|---|---|
| Low energy + low drive | TRT | Hone Health | ~$30-75 |
| Performance issues | ED | BlueChew | ~$40 |
| Weight gain | GLP-1 | Sprout, Eden, Ro | ~$100-400 |
| Hair thinning | Hair loss | Keeps, Hims | ~$20-50 |
| Lab testing | Diagnostics | LetsGetChecked | ~$20-50 |

**Realistic funnel:** referral *click* → paid clinical *conversion* at ~1-5%. So 1,000 clicks → ~10-50 conversions → at a blended ~$40-60 CPA → **~$400-3,000/mo**, not a five-figure number. v3.0's "$128 from one man" assumed a single user converts on three separate clinical purchases — possible, but not a base case.

### 13.3 Referral Rules

- Available to all users including free tier, but **never pushed** — always with "not right now."
- Introduced naturally, only when conversation reveals a genuine pattern.
- Network/content separation enforced (RevOffers on Ava, CrakRevenue on Lux only).
- User's state checked against partner geo-restrictions before showing any link.
- **Referral revenue is excluded from base-case projections (§14) and counted only as realized upside.**

---

## 14. Financial Projections — Conservative Base Case

### 14.1 Revenue Forecast (3-4% sub rate, referrals = $0 in base case)

| Metric | Month 1 | Month 3 | Month 6 | Month 12 |
|---|---|---|---|---|
| Active users | 150 | 700 | 1,500 | 4,000 |
| Profiles sold | 20 | 70 | 150 | 400 |
| Subscribers (3-4% of actives) | 4 | 25 | 55 | 150 |
| Top-up purchases | 6 | 30 | 70 | 200 |
| **Monthly revenue (sessions + subs)** | **~$900** | **~$3,200** | **~$8,500** | **~$22,000** |
| **+ Referral upside (if it converts)** | +$100 | +$500 | +$1,500 | +$4,000 |
| Monthly costs | ~$900 | ~$2,200 | ~$4,500 | ~$11,000 |
| **Monthly profit (base, ex-referral)** | **~$0** | **~$1,000** | **~$4,000** | **~$11,000** |

> **What changed:** v3.0 projected $40K/mo and $26K profit at Month 12 on a 16% sub rate and five-figure referral income. v4.0 uses a 3-4% sub rate (in line with best-in-class consumer apps), counts referral income as upside, and corrects COGS. Result: **~$22K/mo revenue and ~$11K/mo profit at Month 12, plus referral upside.** This is the number to build to. If reality beats it, wonderful — but you will never have over-invested chasing a fantasy.

### 14.2 Cost Structure at Month 6 (conservative)

| Cost Category | Monthly | % Revenue |
|---|---|---|
| LiveAvatar (Essential + overage) | $250 | ~3% |
| ElevenLabs | $200 | ~2% |
| Claude API (Haiku + Sonnet) | $150 | ~2% |
| Stripe fees | ~$280 | ~3% |
| Marketing | $200 | ~2% |
| Vercel + Supabase + infra | $120 | ~1% |
| Legal/compliance amortized | $300 | ~4% |
| **Total** | **~$1,500** | **~18%** |

### 14.3 Startup Capital Required (revised)

| Item | Cost |
|---|---|
| HeyGen LiveAvatar Essential (Month 1) | $100 |
| ElevenLabs Starter | $5 |
| Claude API (initial) | $50 |
| Marketing (Month 1, Ava only) | $29 |
| **Legal review (scoped, AI-companion-law-specific)** | **$3,500** |
| Operating buffer (Month 1-3) | $1,500 |
| Contingency | $1,500 |
| **Total to self-sustaining** | **~$6,700** |

> Higher legal spend, lower marketing spend, net roughly flat vs v3.0's $5,700 — and squarely within the $10K budget with ~$3,300 remaining as deeper safety buffer.

---

## 15. Infrastructure & Accounts

### 15.1 Completed

Eigen Holdings LLC (DE, EIN received) ✅ · Domains withava.co, withlux.co, eigen-holdings.com ✅ · Google Workspace ✅ · Mercury account ✅ · GitHub + ava-web repo ✅ · WSL2 + Claude Code ✅ · CrakRevenue applied ✅ · RevOffers applied ✅

### 15.2 Pending (re-sequenced)

| Item | Phase | Cost |
|---|---|---|
| Certificate of Good Standing (DE) | Now | $50-100 |
| WA foreign registration | After cert | $180 |
| **Healthcare/AI attorney review (scoped per §10.5)** | **Before any launch** | **$3,000-4,000** |
| Supabase project + encryption setup | Phase 0 | Free |
| Stripe ↔ Mercury connect | Phase 0 | Free |
| HeyGen LiveAvatar Essential | Before Phase 1 launch | $100/mo |
| ElevenLabs signup | Before launch | $5/mo |
| HeyGen (marketing clips) | Before launch | $29/mo |
| Sign Operating Agreement | This week | $0 |

> **Legal review is now a hard gate before launch, not a parallel task.** Given the private-right-of-action exposure, launching before the attorney sign-off is the one shortcut that could create real liability.

---

## 16. Build Plan & Decision Gates

### 16.1 Phased Timeline with Gates

The core principle: **capital for each phase is released only when the prior gate is met.** This converts "two weeks to MVP, hope it works" into "spend a little, learn, decide."

**Phase 0 — Foundation (Day 1-2)**
Project setup, Supabase + encryption, env vars, **safeguard system first** (emergency detection, output filter, validator). Legal review initiated in parallel.

**Phase 1 — Build Ava MVP (Day 2-14)**
Landing page → radar chart → text chat (Haiku) → auth + credits → memory → results page (**private profile** deliverable) → **day-one brag card** (abstract score + radar silhouette, sensitive data stripped) → Stripe → LiveAvatar integration → referral links → legal pages + polish.
→ **GATE 1 (launch readiness):** Attorney sign-off received (including likeness/consent terms per §10.5) **AND** safeguard system passes red-team testing (try to make Ava say a diagnosis, in chat *and* in a shareable video script — it must refuse). *No public launch until both are true.*

**Phase 2 — Validate Ava funnel (Month 1-3)**
TikTok clips + Reddit + organic. Ship the **progress brag card + templated Ava hype clip** (§6.5) as tracking data accumulates — this is the priority shareable artifact and the real viral driver. Measure the only numbers that matter:
→ **GATE 2 (proceed-to-scale):** Hit **≥3% paid conversion** of activated users **AND** blended COGS per session confirmed ≤$0.32/min in production **AND** CAC (even organic time-cost) is sane.
- *If GATE 2 fails:* iterate conversation/pricing for one more month. If it fails twice, invoke the exit (§18) — you've spent ~$3-4K, not $10K.
- *If GATE 2 passes:* release marketing budget; consider Business-plan avatar upgrade.

**Phase 3 — Clone to Lux + paid acquisition (Month 4-6)**
Deploy Lux config. Test TrafficJunky at **$100-150 first**.
→ **GATE 3 (scale paid):** Lux CAC < 50% of first-month LTV on the $150 test before committing $500/mo.

**Phase 4 — Native app + wearables (Month 6+)**
Capacitor app (HealthKit, push), Terra API — only after Phases 2-3 prove the unit economics.

### 16.2 The "Kill Criteria" (decide in advance, not emotionally)

Pull the plug (invoke §18) if, by **Month 4**: paid conversion stays <2% after two iteration cycles, OR production COGS/session exceeds $0.40/min and can't be brought down, OR an unresolvable compliance blocker emerges. Deciding these *now*, in writing, prevents the sunk-cost trap later.

---

## 17. Risk Mitigation

| Risk | Mitigation |
|---|---|
| **COGS higher than budgeted** | Realistic $0.24-0.32 baked in; $0.75 floor; text-only free tier; graceful text fallback at concurrency cap; GATE 2 confirms production COGS before scaling |
| **AI companion law / private right of action** | $3-4K scoped legal review as hard launch gate; safeguard system applied everywhere; geo-block CA/NY; never marketed as mental-health aid |
| FDA classifies as medical device | Five-layer safeguards; "wellness indicators" not "clinical measurements"; audited referral-drift filter; never diagnose/prescribe |
| FTC health-claims enforcement | No false/guaranteed claims; AI disclosure everywhere; "many men report" framing |
| **Referral income doesn't materialize** | Excluded from base case; sessions + subs profitable alone; referral is upside only |
| **Subscription rate below projection** | Base case already uses conservative 3-4%; profitable at that rate |
| Sensitive health-data breach | Encryption at rest, data minimization, privacy policy reviewed |
| LiveAvatar price increase / lock-in | Architecture supports switching to Simli/D-ID/self-hosted |
| Viral loop underperforms | Assumed 0 in base case; pure upside |
| Two-brand overextension | Single-brand launch; Lux deferred behind GATE 2 |
| No product-market fit | Decision gates + kill criteria cap loss at ~$3-4K, not $10K |
| User harm from AI | Emergency detection bypasses LLM; safeguard constitution; disclaimers everywhere |

---

## 17A. Credit Liability & Clean Exit (new in v4.0)

The pricing is structurally sound — every product sells above COGS and the $0.75 floor sits above the realistic $0.24–0.32/min cost. **But "won't lose money per sale" is not "won't lose money."** Two things must be managed deliberately, both decided *before launch*, or a clean shutdown can turn into a refund crisis or a lawsuit.

### 17A.1 Prepaid credits are a liability, not revenue

When a user buys a 30-credit pack for $29.99, we have collected the cash but now *owe* 30 minutes of future service. Unredeemed credits are deferred revenue and, in many states, can be treated like **gift cards** — subject to consumer-protection rules and sometimes unclaimed-property/escheat law. Walking away from unredeemed balances on shutdown is not just a refund question; it can be a regulatory one. Therefore:

- **Credit expiration is set in the ToS from day one.** v3.0 said credits "never expire" — that creates a perpetual liability. v4.0 sets a defined expiration (default **12 months** from purchase). *Some states regulate or prohibit expiration on gift-card-like balances — this is a specific attorney question (§10.5).*
- **Maintain a funded credit-liability reserve.** Track `outstanding_credits × cash_value` continuously. The Mercury balance must never drop below this reserve. This is the single most important financial discipline in the business — it guarantees we can always refund.
- **Subscription cash is partial liability until consumed.** A $49 Max payment includes 40 owed minutes whose COGS may land in a later month. Do not treat collected subscription cash as fully earned profit until the included credits are consumed or expired.

### 17A.2 Other money leaks the pricing table doesn't show

- **Fixed monthly cost runs whether or not anyone shows up** (~$200–250/mo: HeyGen Essential, ElevenLabs, Supabase, Vercel). **Month 1–2 will run a small planned loss by design** — that's what the operating buffer is for. Margins protect us only once volume exists.
- **Refunds & chargebacks.** Stripe takes 2.9% + $0.30/sale; a chargeback loses the sale plus a ~$15 dispute fee. A men's-health product with impulse-then-embarrassment buying is **above-average chargeback risk.** Budget ~2–4% of revenue here.
- **Failed/retried sessions.** If an avatar session crashes mid-way, *we* eat the COGS and refund the credit. Budgeted, not a surprise. Rule: technical failure is always on us.

### 17A.3 The clean-exit checklist (set up now, execute later)

A shutdown is only clean if the exit terms were built into launch. Decide and write all of this into ToS + privacy policy before going live:

- **Advance notice** to users (≥30 days) before shutdown — abrupt closure is what triggers complaints.
- **Refund outstanding credit and subscription balances**, or honor the pre-stated expiration. Stripe refunds to original payment method; tiny sub-fee balances handled by the stated expiration.
- **Subscriptions cancel at period end or pro-rate** — never take the monthly fee then kill service mid-period.
- **Delete user PII on shutdown**; retain compliance/safeguard audit logs *separately* (they are legal protection — see §17A.4).
- **Formally dissolve the Delaware LLC** ($204) — don't just stop paying; abandonment risks veil-piercing.
- **Keep the credit-liability reserve funded the entire operating life**, so refunds are always possible.

### 17A.4 Lawsuit protection at exit

- **The data:** never leave an abandoned Supabase database holding sensitive health data. Delete PII on wind-down and be able to show it. The privacy policy states this from launch.
- **AI-companion-law claims survive the company.** SB 243's private right of action doesn't vanish on shutdown — a harm that occurred *while operating* is still actionable. The protection is that we **operated compliantly throughout** (disclosures shown, emergency detection working, no medical claims). **Keep safeguard audit logs even after shutdown** as evidence we did it right — this is why we delete PII but retain compliance logs.
- **Corporate veil:** the LLC shields personal assets *only if* its separateness was respected — separate Mercury account (✅), no commingling, signed operating agreement, adequate capitalization, and formal dissolution. Treating the LLC as a personal account invites a piercing claim.

> **Attorney scope addition (§10.5):** wind-down terms, credit-expiration legality by state, data-deletion-on-shutdown clause, and the audit-log retention policy must all be in the ToS/privacy review.

---

## 18. Exit Considerations

The structure is genuinely low-risk to exit — no clinical obligations, no long contracts, monthly-cancelable infrastructure. But a *clean* exit depends on §17A being set up at launch (funded reserve + correct ToS clauses), not improvised on shutdown day.

Mechanics:
- Cancel all subscriptions (HeyGen, ElevenLabs) — instant
- Shut down Vercel — instant
- Process outstanding credit/subscription refunds from the funded reserve (§17A)
- Delete user PII; retain compliance/safeguard logs (§17A.4)
- Close Stripe after refunds clear
- Formally dissolve LLC — $204 DE filing fee
- **Maximum realistic loss if killed at GATE 2: ~$3,500-5,000** (mostly legal, which is value regardless), *plus* any unredeemed credit refunds — which is why the reserve exists and is not counted as profit. Full-run loss if it goes the distance and fails: ~$6,700-10,000 + outstanding refunds.
- No long-term contracts, no clinical obligations, no patient continuity.

If it succeeds (conservative case): Year 1 ~$150-200K revenue; Year 2 with native app + wearables ~$400-700K; potential acquisition interest from telehealth (Hims, Hone), wearables (Whoop, Oura), or AI companion companies; potential Series A if metrics prove out.

---

## 19. Key Principles (revised)

1. **Anchor to the conservative case.** ~$22K/mo and ~$11K profit at Month 12 is the target, not $40K. Beat it as upside.
2. **Never spend ahead of proof.** Gates release capital; kill criteria cap the loss.
3. **Sessions + subscriptions must stand alone.** Referrals are upside, built on CPA-on-conversion, not per-user.
4. **Protect the avatar.** It's the one cost that can quietly sink you — $0.75 floor, text-only free tier, graceful fallback.
5. **Compliance is the moat and a hard gate.** Safeguards first; attorney sign-off before launch; the AI-companion laws are litigation risk, not a checkbox.
6. **Memory is the retention mechanism** — and a security obligation. Encrypt it.
7. **One brand, then two.** Validate Ava; clone Lux only after GATE 2.
8. **Launch fast, but gated.** Two weeks to a *gated* MVP — speed without spending blind.
9. **Prepaid credits are a liability, not profit.** Credits expire (12 mo); keep a funded reserve that always covers outstanding balances; build the clean-exit terms into launch (§17A).
