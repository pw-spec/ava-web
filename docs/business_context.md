# Business Context — Eigen Holdings LLC

This document contains the complete business plan, strategic decisions, market research, and operational context for the Ava/Lux TRT telehealth platform. It was developed over multiple intensive planning sessions and represents every major decision, its rationale, and the research behind it. Claude Code should reference this document when making product, design, or architecture decisions.

> **Compliance is the baseline, not a feature.** No change ships if it would violate any of the laws listed in `docs/COMPLIANCE_BASELINE.md`. The founder explicitly does not want to be in any legal fight — the baseline is non-negotiable.

---

## 0. MAY 2026 STRATEGIC AUDIT — read this first

A market audit was run on **May 7, 2026** using parallel research agents covering competitive landscape, Hims TRT entry, regulatory environment, and AI avatar adoption. Findings updated specific sections below. High-level deltas:

### What was validated
- ✅ **TRT durability over GLP-1 hype** — testosterone is generic since 1953, no Novo Nordisk moment looming. Strategy section §3 stands.
- ✅ **MSO model and clinical-rental architecture** — well-trodden, no new legal challenges. Section §4 stands.
- ✅ **Phase 1 text-only launch** — direct-to-Claude MVP path is feasible. Section §11 stands.
- ✅ **Biological retention floor (70-85% annual)** — plausible; matches industry signal even if no public Hone/Henry numbers confirm exact range.

### What was adjusted
- ⚠️ **The competitive landscape was mis-aimed.** Hims is a Tier-2 threat, not Tier-1. The actual mid-market killer is **Henry Meds** ($129/mo all-inclusive, $100M+ revenue, mature paid-search machine). **Hone Health is much bigger than the original analysis assumed** — $63M revenue, 55K treated patients, 300K tested, $48.5M raised, January 2025 ivee acquisition (at-home labs), April 2026 BodySpec/Prenuvo imaging integrations. Hone is racing toward "Personalized OS for Longevity" positioning at the same $149+ tier. See §7 update.
- ⚠️ **$149/$249 pricing is not a defensible gap.** The $129-$199 mid-market band is the most contested in the category. A $149 base needs a defensible answer to *"what does $20 more buy me than Henry Meds?"* — and "an AI avatar" is not it.
- ⚠️ **AI avatar is a wedge, not a moat.** Mayo Clinic pilot (n=30, surgeon-education context) is the only validation. No DTC funnel-conversion data exists. **No US DTC men's-health brand has shipped a real-time photoreal avatar in consumer intake by May 2026** — first-mover window is real, but ~12 months. Hims publicly committed to AI as "OS for care" April 2026 — they will ship comparable UX in a quarter once they decide to. The actual moat is brand recognition + longitudinal patient data, not the avatar tech.
- ⚠️ **Hims threat is real but in a different lane (5/10, not 9/10).** As of May 2026 their live offering is enclomiphene + tadalafil, not real TRT. Kyzatrex is "coming 2026". CAC is $700-929 and rising. Trustpilot 3.0/5. They convert top-of-funnel passers-by; they don't own the "I want to understand my hormones" segment. Where they're dangerous: bidding pressure on "TRT online" keywords (don't fight there) and brand recall after Super Bowl saturation. See §7 update.
- ⚠️ **The Month 12 projection of 1,015 customers / $2.2M ARR is aggressive on organic-only.** Realistic organic-only range: **300-600 subscribers / $50-100K MRR / $600K-1.2M ARR by Month 12.** Hitting the $2.2M target requires a paid-affiliate program activated by Month 4-5 (~$10K/month CAC budget reinvested from revenue), at least one viral TikTok hit, or a CrossFit-affiliated content-creator partnership delivering warm leads. Unit economics are fine — the constraint is distribution volume, not LTV/CAC ratio. See §6 update.

### What was sharpened
- 🔴 **Regulatory clock is louder than originally assumed.** Three new realities:
  1. **DEA telemedicine flexibilities — fourth temporary extension expires Dec 31, 2026.** No backup in-person infrastructure exists. Need contingency LOI with Sesame / Wheel / Quest partner clinics in next 90 days. Risk: HIGH.
  2. **NY AI Companion Law — effective Nov 5, 2025, $15K/day exposure.** Gov. Hochul sent direct compliance letters to operators on the effective date. Ava is exactly the targeted persona. Risk: MEDIUM-HIGH.
  3. **CA SB 243 — effective Jan 1, 2026, private right of action + $1,000/violation + attorneys' fees.** Plus CA AB 489 (license-implication ban), TX TRAIGA, IL chatbot law all live. Risk: MEDIUM-HIGH.
  4. **FTC Healthcare Task Force — launched March 2026** explicitly horizon-scanning AI-driven telehealth.
  See §10 update.

### Concrete next moves the audit recommends
1. **Pivot pricing model in next 30 days** — either bundle harder than Henry ($129 all-in becomes the comp, not Hims) OR narrow ICP and own a specific niche at $199-249 (recommended: men 45-55 hitting performance plateaus, never optimized — cleanest gap).
2. **Race to ship — 12 month window.** Get Ava as a recognizable consumer persona (Duolingo-owl-style brand) in market before Q4 2026. Brand recognition is the moat, not the avatar tech.
3. **DEA contingency in next 90 days** — LOI with national in-person network, clinical partner positioned for Special Registration day-one.
4. **Compliance posture upgrade before launch** — see `docs/COMPLIANCE_BASELINE.md` for the operating bar.
5. **Build the data flywheel** — longitudinal patient memory (Ava remembers your last 6 months), published outcome data, CrossFit-community referral network. None of these are tech that Hims/Hone can copy in a quarter.

### Decisions executed (2026-05-07)
- ✅ **Pricing pivot shipped.** Base $149 → **$199**, Premium $249 → **$299**. Updated across landing `<Pricing>`, `/labs` tier picker, FAQ, ToS, CLAUDE.md. Rationale: $149 wasn't differentiated from Henry Meds' $129 all-inclusive offering. $199 sits one step above Hone Premium effective ($177) and below Marek's $225 bodybuilder lane — underserved upper-mid tier.
- ✅ **Geo-block live.** NY blocked day 1 ($15K/day exposure existential for bootstrap). CA deferred ~6 months pending dedicated compliance audit. Implementation in `src/lib/launchStates.ts`, with `<StateWaitlist>` email capture for blocked states. Marketing copy updated to "30+ US states (NY, CA opening later)" everywhere. See `docs/COMPLIANCE_BASELINE.md` §2.5 for re-enable cadence.
- ⏳ **Pending:** DEA contingency LOI (deadline Sept 30, 2026). Healthcare attorney engagement (bounded ~$500-1,500 scope, before launch). OpenLoop / CareValidate contract.

Sources for May 2026 audit are cited inline in the conversation thread that produced these findings.

---

## 1. FOUNDER PROFILE

- **Name:** Peng Wei
- **Location:** Mukilteo/Everett, Washington
- **Day job:** Staff Machine Learning Engineer at Veradigm (healthcare IT company)
- **Immigration status:** US Green Card holder (no restrictions on business ownership)
- **Technical skills:** ML engineering, Python, healthcare data systems, familiar with React/Next.js
- **Domain knowledge:** Deep healthcare IT experience from Veradigm — understands EHR systems, clinical workflows, HIPAA, compliance
- **Personal connection:** CrossFit athlete who understands the target customer firsthand — men who train hard but hit unexplained performance walls
- **Working style:** Moves fast from planning to execution. Completed LLC formation and EIN in a single working session. Prefers comprehensive architecture decisions before building. Evaluates strategic risks proactively.

---

## 2. THE INSPIRATION — MEDVI

### What Medvi Did
Matthew Gallagher launched Medvi (Delaware LLC) in September 2024 with $20K, selling GLP-1 (weight loss) drugs online via telehealth. Results: $401M sales in first year, 16.2% net profit margin, tracking $1.8B in 2026. Two employees total (him + his brother).

### How Medvi Works
Gallagher outsourced ALL regulated healthcare components to CareValidate and OpenLoop Health — they handle licensed physicians, prescription processing, pharmacy fulfillment, shipping logistics, and regulatory compliance. Medvi retained ownership of the customer relationship: branding, website, paid media, checkout flow, and service.

### AI Tools Medvi Uses
ChatGPT, Claude, and Grok for code, website copy, and building AI agents. Midjourney and Runway for images and video ads. ElevenLabs for AI voice customer service. Monolit for social media content. No proprietary AI — all off-the-shelf tools.

### Medvi's Customer Acquisition
- Affiliate marketing through RevOffers ($200 CPA) — biggest driver, with 5,000+ Meta ads running through affiliates
- AI-powered social media (38% of acquisition) — 4-5 LinkedIn posts/week, 1-2 X/Twitter posts/day, 3-4 Instagram posts/week, all AI-generated
- SEO content machine — AI-generated health articles equivalent to a 12-person content team
- Growth: 300 customers in month 1 → 1,300 in month 2 → 250,000 by end of 2025 → 500,000+ current

### Why We're NOT Copying Medvi's GLP-1 Model
Medvi's core business is now under existential threat. The entire model depended on compounded semaglutide being much cheaper than branded Wegovy/Ozempic. On March 31, 2026, Novo Nordisk announced Wegovy at $149/month (oral) and $249/month (injection) — destroying the pricing arbitrage. The FDA has also sent 30+ warning letters to GLP-1 telehealth companies about misleading marketing. Medvi received FDA warning letters before the NYT story went mainstream.

### What We Learned From Medvi
1. The "rented infrastructure" model works — outsource clinical, own the customer relationship
2. AI can replace an entire corporate workforce for operations
3. Social media + affiliate marketing can drive massive customer acquisition
4. Solo founder with AI tools can build a real business
5. But DON'T depend on a temporary pricing window (GLP-1's fatal flaw)

---

## 3. WHY TRT (TESTOSTERONE REPLACEMENT THERAPY)

### The Strategic Decision
TRT was selected over five alternatives (Prior Auth AI Agent, AI Coding Service, Compliance Layer, DTC Labs) for these reasons:

### Market Opportunity
- 40% of men under 40 are interested in testosterone optimization
- Only 14% are currently using any solution
- Men's health optimization is a growing category
- FDA removed cardiovascular warnings for testosterone in February 2025 (regulatory tailwind)
- Same infrastructure partners as Medvi (OpenLoop/CareValidate) work for TRT

### TRT vs GLP-1 — Why TRT Is More Durable
This is the most important strategic insight in the entire business plan:

**Testosterone cypionate is a generic drug that has been available for 40+ years.** There is no branded competitor that can compress pricing arbitrage the way Novo Nordisk did to GLP-1 compounders. The drug itself costs $30-50/month wholesale. There will never be a "Novo Nordisk moment" for testosterone.

Our customers aren't paying $149/month for cheap testosterone — they're paying for the service layer: the AI companion, convenience, monitoring, clinician access, and lab work. The medication is a commodity. The experience around it is the product.

### Built-In Retention
TRT has natural biological retention that most subscriptions lack:
- Once a man starts exogenous testosterone, the body reduces its own production
- Stopping abruptly causes a crash — fatigue, mood swings, low libido — often worse than before
- Industry retention rates: 70-85% annual (vs 60-70% for typical subscriptions)
- This isn't a trick — it's biology. Our job is to push retention to 90%+ with a great experience.

### The Founder IS the Customer
Peng Wei is a CrossFit athlete who understands the target customer firsthand. Men who train hard, eat right, but something is off. They don't think they have a "problem" — they want to optimize. This personal connection informs every product decision.

---

## 4. BUSINESS STRUCTURE

### Entity
- **Holding company:** Eigen Holdings LLC (Delaware)
  - Filed: April 6, 2026 via Northwest Registered Agent
  - File Number: 10574078
  - Registered Agent: Northwest Registered Agent Service, Inc., 8 The Green, Ste B, Dover, DE 19901
  - Privacy: Northwest (Nat Smith) filed as Authorized Person — founder's name is NOT on public Delaware records
  - EIN: Received (April 2026)
  - Management: Member-managed, single member (Peng Wei, 100%)
  - Member address: 6422 Riviera Court, Mukilteo, WA 98275-5038

### Why "Eigen Holdings"
"Eigen" comes from linear algebra — an eigenvector is the fundamental direction that doesn't change under transformation. It's the true underlying signal in noisy data. For a health company, the metaphor is perfect: finding your body's essential operating state underneath all the noise. That's literally what TRT does — restoring your fundamental baseline. The founder is an ML engineer, so it carries personal meaning.

### MSO Model (Management Services Organization)
Eigen Holdings LLC is the MSO — it owns the technology, brands, marketing, and customer relationships. It does NOT practice medicine. The clinical infrastructure partner (OpenLoop/CareValidate) handles all clinical decisions, prescribing, pharmacy, and medical compliance. This is the same structure used by Hims ($2.4B revenue), Ro, Medvi, and every other DTC telehealth company. Well-established legal precedent.

### Dual-Brand Strategy
Two consumer-facing AI avatar brands operate on shared backend infrastructure:

**Ava (withava.co) — Mainstream Brand**
- Target: Men who identify as high performers — train hard, eat right, but something is off
- Channels: TikTok, LinkedIn, CrossFit gyms, Google Search, Instagram
- Personality: Athletic, warm, evidence-based. Like a sharp friend who understands endocrinology.
- Hook: "You're not lazy. You're depleted."
- Entry symptoms: Energy crashes, poor recovery, sleep issues, brain fog

**Lux (withlux.co) — Performance Brand**
- Target: Men experiencing sexual performance issues who find Lux through adult advertising
- Channels: TrafficJunky (Pornhub network), Reddit (NSFW subs), late-night YouTube
- Personality: Confident, direct, zero judgment. She doesn't judge, she just sees you clearly.
- Hook: "Can't perform like you used to?"
- Entry symptoms: Low libido, ED, stamina decline, performance anxiety

**Same blood test. Same clinician. Same prescription. Same $149/month. Different doors.**

The strategic rationale: Different symptoms, different psychology, same condition. The man on Pornhub who can't perform and the man at CrossFit who can't recover are often experiencing the same underlying issue — low testosterone. But they'd never respond to the same ad. Their entry point into caring about their health is completely different.

### Why Two Brands Isn't a Legal Risk
- Both brands operate under the same LLC/MSO
- One OpenLoop contract covers both
- The LLC name "Eigen Holdings" reveals nothing about either brand
- Privacy option on Delaware filing keeps founder's name off public records
- Nothing on either website links to the other
- Only someone searching Delaware corporate records AND knowing both brand names could connect them

---

## 5. THE AI AVATAR STRATEGY — THE CORE INNOVATION

### The Key Insight
**The avatar IS the brand and the marketing funnel, not a feature.** You don't "use Ava Health platform." You "talk to Ava." The human name IS the product.

Nobody says "I used Apple's voice assistant." They say "I asked Siri." Nobody says "I used Amazon's smart speaker." They say "I told Alexa." For our business, this is even more powerful because "Have you talked to Ava?" is the most organic referral line possible.

### Why Nobody Else Is Doing This
The technology only became affordable in the last 6 months:
- Simli launched $0.009/min pricing in late 2025 — before that, real-time avatars cost $0.10-0.50/min
- HeyGen LiveAvatar API only became available in 2025
- Mayo Clinic just completed their first AI physician avatar pilot (July-August 2025) with only 30 patients
- Companies in this space are enterprise hospital tools (RAVATAR, Beyond Presence) or pre-recorded video generators (Synthesia, D-ID) — nobody has built a consumer DTC health brand where the avatar IS the product

### The Graduated Funnel — Cost Control Architecture
Don't give everyone the full avatar experience. Earn the expensive parts.

```
TIER 1: Landing page — $0 per visitor
  Static avatar image, one line, one button
  Pure HTML. No API calls.
  100% of visitors see this.

TIER 2: Text chat — $0.018 per anonymous visitor (6 messages)
  Claude API only. No avatar video.
  Animated orb pulses during "thinking."
  Sign-up gate after 6 messages (email required).
  ~70% drop off before here.

TIER 3: Continued text chat — $0.036 per signed-up user
  12 more messages after email capture.
  Radar chart builds in real-time.
  ~60% drop off here.

TIER 4: Live avatar unlocks — $0.25 per session (Phase 2)
  Simli activates after 3+ symptom areas covered.
  "Let me show you something" — face appears.
  5-minute session cap. Hard limit.
  ~40% drop off here.

TIER 5: Profile + lab CTA — $0 (static page)
  Health radar chart results.
  "Get your lab kit" button.
  5-10% convert to paying subscribers.
```

### Hard Cost Controls (Non-Negotiable)
- Message limit: 6 free for anonymous, 12 more for signed-up
- Avatar time limit: 5 minutes maximum
- Daily budget ceiling: $100/day on AI services
- Concurrency cap: 50 simultaneous avatar sessions max
- No avatar for repeat non-converters (3+ visits without purchase)

### Avatar Pipeline — What Each Vendor Does
```
User speaks → Whisper (self-hosted on AWS) → text transcript
  → Claude API → Ava's response text + health scores
    → Compliance judge (Claude Haiku) → safety check
      → ElevenLabs → Ava's voice audio
        → Simli → animated face video → user sees Ava respond
```

PHI only flows through: your server + Claude. Simli and ElevenLabs never see user symptoms — they only process Ava's output.

---

## 6. PRICING & FINANCIAL MODEL

### Pricing (revised post-May-2026 audit)
- **Base:** $199/month — TRT + clinician access + lab monitoring + AI companion (all-inclusive)
- **Premium:** $299/month — base + peptides/longevity stack (Sermorelin, NAD+) + advanced markers + quarterly video consult
- **Blended ARPU:** ~$219/month (assuming 20% upgrade to premium)
- **Competitor range:** $89 (PeterMD floor) → $129 (Henry Meds all-inclusive) → $177 (Hone Premium effective) → $225 (Marek bodybuilder) → $250+ (Defy concierge)
- **Positioning:** Underserved upper-mid lane. One step above the contested $129-179 mid-market band, below Marek's bodybuilder/MPMD-audience pricing.

**History note:** Original spec was $149 base + $249 premium. May 2026 competitive audit found this lane was the most-contested in the category (Hone Premium, Maximus combos, Fountain) and that Henry Meds at $129 all-inclusive was the actual mid-market killer the original analysis had under-weighted. Pivoted up to $199/$299 to find air, narrower ICP, and clearer reframing of Base as the value option.

### Unit Economics
- Drug cost (testosterone cypionate): $30-50/month wholesale
- OpenLoop per-encounter fee: TBD (under negotiation)
- AI conversation cost: $0.05-0.25 per conversation
- Peptide stack (Premium tier): $30-60/month wholesale
- Estimated gross margin: 60-70% on Base, 55-65% on Premium

### Financial Projections (revised post-audit)
- Month 3: Breakeven (~22 subscribers at ~$4,800 MRR — fewer required at $199 base)
- Month 6-7: Initial investment recovered
- Month 12 (organic-only): **300-600 subscribers / $50-130K MRR / $600K-1.6M ARR**
- Month 12 (with Month 4-5 paid affiliate program activated): ~1,000 subscribers / ~$220K MRR / $2.6M ARR
- Month 24 (paid channels active): ~4,000 subscribers / ~$876K MRR / $10.5M ARR
- Total startup investment: ~$7,000-10,000

**Original projection note:** The pre-audit projection of 1,015 customers / $2.2M ARR by Month 12 was based on a $169 blended ARPU and assumed paid acquisition would scale from Month 1. The May 2026 audit flagged that organic-only acquisition realistically delivers 300-600 subscribers by Month 12 — the higher number requires either viral TikTok hits or a paid affiliate program reactivated by Month 4-5 (~$10K/mo CAC budget reinvested from revenue). Unit economics remain healthy: at $219 ARPU × 75% retention × 12 mo = $1,970 LTV vs ~$300 CAC = 6.5x LTV/CAC. The constraint is distribution volume, not unit economics.

### Startup Budget
```
One-time:
  LLC + registered agent:   $149 (paid)
  WA foreign registration:  $230 (cert of good standing + filing)
  Domains (3):              $62/year
  Healthcare attorney:      $3,000-5,000 (deferred)
  OpenLoop onboarding:      $2,000-3,000
  Insurance (E&O + GL):     $500
  Total one-time:           ~$6,000-9,000

Monthly (pre-revenue):
  Google Workspace:          $8.40
  AWS (Lambda + RDS):       ~$20-50
  Vercel:                    $0-20
  Claude API:               ~$20-50
  Other AI services:        ~$10-50
  Total monthly:            ~$60-170
```

---

## 7. COMPETITIVE LANDSCAPE

### Tier 1 (Major threat)
- **Hims & Hers** ($2.4B revenue) — entering TRT in 2026 with Kyzatrex oral testosterone via Marius Pharma partnership. Massive marketing budget. But: their experience is a standard checkout page, not an AI companion.

### Tier 2 (Funded competitors)
- **Maximus** ($15M Series A) — weak tech, traditional intake form
- **Hone Health** ($39M funding) — acquired ivee for at-home labs, decent but form-based

### Tier 3 (Budget/commodity)
- **TRT Nation** ($99/month) — cheapest, minimal service, no personalization
- **Peter MD, Fountain TRT, Henry Meds** — various, all form-based

### Tier 4 (Premium/concierge)
- **Marek Health, Defy Medical** ($250-500+/month) — high-touch, phone-based, expensive

### Our Gap
Nobody is building: specialized TRT + mid-price ($149) + data-intelligent (radar chart) + AI companion (Ava) + community-driven. Every competitor either has a generic form-based experience or charges 3x more for human-touch service. We offer the human-touch feel at the mid-market price through AI.

---

## 8. CUSTOMER ACQUISITION STRATEGY

### Channel Mix
| Channel | Brand | CAC | Volume | Timeline |
|---|---|---|---|---|
| TikTok organic (avatar clips) | Ava | $0 | Low-Medium | Week 1+ |
| TrafficJunky ads (Pornhub) | Lux | $30-80 | Medium | Week 4+ |
| LinkedIn organic (founder's profile) | Ava | $0 | Low | Week 1+ |
| Affiliate program ($100-150 CPA) | Both | $100-150 | High | Month 2+ |
| CrossFit gym partnerships | Ava | $0 | Low | Month 2+ |
| Reddit community seeding | Both | $0 | Low | Week 2+ |
| SEO content machine | Ava | $0 | Medium (delayed) | Month 3+ |
| Word-of-mouth (shareable profiles) | Both | $0 | Grows over time | Month 2+ |

### The Viral Loop — Shareable Health Profile
The avatar conversation creates a "screenshot moment" — when a man sees his health radar chart build in real-time with his energy score at 35 and recovery flagged red. Build a "Share My Score" feature:

- The shareable card shows ONLY: aggregate score (e.g., "47/100"), radar chart shape, Ava branding + link
- NEVER includes: user's name, symptoms, clinical data, or anything that could be PHI
- User must actively opt-in to share (never auto-shared)
- NOT incentivized with discounts on health data sharing (FTC concern)
- Standard referral program is fine: "Refer a friend, both get $20 off"

### Avatar Hook Clips (Marketing Content)
Use HeyGen to batch-produce 50-100 short hook clips for TikTok/TrafficJunky:

Ava example: "Hey, I'm Ava. You train 5 days a week and you're still exhausted by 2pm? That's not normal. Talk to me — I'll tell you what's going on in 2 minutes."

Lux example: "I'm Lux. If things aren't working the way they used to... it's probably not in your head. Talk to me — it's completely private."

---

## 9. RETENTION STRATEGY

### The Three Layers of Retention
1. **Biological continuity:** TRT itself creates physical dependence — stopping feels bad. This is the baseline retention floor.
2. **Visible progress:** The radar chart makes improvement visible over time. Before/after comparison at Day 90 is the "wow" moment.
3. **Ongoing relationship:** Ava's monthly check-ins make the subscriber feel cared for. Not a pill in the mail — a health companion.

### The Three Reasons Men Cancel (and How Ava Prevents Each)

**"It's not working" (Month 1-3):**
- Solution: Structured onboarding with realistic timeline setting
- Week 1: "Here's what to expect — it's gradual, not overnight"
- Week 6: Re-run radar chart, show before/after — even small improvements become visible
- Week 12: Full transformation view — Day 1 vs Day 90 radar chart

**"It's too expensive" (Month 4-8):**
- Solution: Monthly value summary showing what they're getting vs competitor pricing
- Show the premium tier ($249) to reframe $149 as the "value" option

**"I forgot about it" (Month 6+):**
- Solution: Monthly Ava check-ins (2 minutes, ~$0.05 cost), quarterly deep dives with avatar
- Milestone celebrations: "6 months! Here's your transformation."
- Seasonal content: "Winter affects testosterone — here's what to adjust"

### Churn Prevention Triggers
Automated alerts for: no engagement 30 days, skipped labs, payment failed, visited cancel page, negative sentiment in conversation. Each triggers a specific Ava intervention.

### Target Retention Metrics
- Day 30: 90%+
- Day 90: 85%+
- Month 6: 80%+
- Month 12: 75%+
- Monthly engagement rate: 60%+ (subscribers who interact with Ava)
- Net revenue retention: 105%+ (upgrades outpace churn)

---

## 10. LEGAL & REGULATORY FRAMEWORK

### Seven Legal Layers

**1. Corporate Structure (Risk: LOW)**
MSO model — well-established, decades of precedent. Eigen Holdings owns technology and brands. Clinical partner handles medicine. Attorney confirms structure.

**2. Controlled Substance / DEA (Risk: LOW for 2026)**
Testosterone is Schedule III. DEA telemedicine flexibilities extended through December 31, 2026. Permanent rules in progress. Contingency: partner with local lab networks for in-person intake if flexibilities expire.

**3. State Telehealth Laws (Risk: MEDIUM)**
50-state patchwork. Handled by OpenLoop/CareValidate — they maintain licensed clinicians in each state. Start with 10-15 telehealth-friendly states, expand with legal review.

**4. AI Avatar / Chatbot Laws (Risk: MEDIUM)**
- California AB 489: Cannot imply AI has healthcare license. No white coat, no "Dr." title.
- California SB 243: Companion chatbot disclosure requirements, crisis handling protocols.
- New York AI Companion Law: Disclosure required, AG can impose $15,000/day penalties.
- Solution: Build AI disclosure into every touchpoint from day one.

**5. Marketing / FTC Rules (Risk: MEDIUM)**
Most common violation area for telehealth companies. Cannot guarantee prescriptions, outcomes, or claim FDA approval for general symptoms. Solution: attorney-reviewed approved language library, output filter on all AI responses.

**6. HIPAA Compliance (Risk: LOW if set up properly)**
BAAs with all vendors touching PHI (AWS, Anthropic, Google Workspace). Encryption everywhere. Minimize PHI surface — self-hosted Whisper means only Claude sees symptom text.

**7. Liability / Insurance (Risk: LOW with proper coverage)**
E&O + general liability + cyber insurance: ~$2,000-4,500/year. Medical malpractice falls on OpenLoop's clinicians, not on Eigen Holdings.

### Five Compliance Safeguards (Built Into Code)
1. System prompt constitution — hardcoded rules preventing diagnosis/prescribing/guarantees
2. Output filter — banned phrase detection on every Claude response
3. Judge pattern — Claude Haiku reviews every response for compliance (~$0.0005/check)
4. Emergency detection — keyword matching for suicide/self-harm/medical emergency, bypasses Claude entirely
5. UI disclosure system — AI disclosure at every touchpoint (landing, first message, persistent badge, before avatar, before checkout, ToS, privacy policy)

---

## 11. TECHNICAL ARCHITECTURE

### The Full Stack
| Layer | Service | Why |
|---|---|---|
| Domains + DNS + CDN | Cloudflare | Cheapest registrar, fastest DNS, free CDN |
| Frontend | Vercel (Next.js) | Auto-scaling, edge deployment, free tier |
| Backend (HIPAA) | AWS (Lambda + API Gateway + RDS) | BAA available, industry standard for healthcare |
| AI conversation | Claude API (Anthropic) | Best for health conversations, BAA on Enterprise |
| Speech-to-text | Self-hosted Whisper on AWS | No PHI leaves your server |
| Text-to-speech | ElevenLabs | High-quality voice, only sees Ava's output (no PHI) |
| Live avatar | Simli ($0.009/min) | Cheapest real-time avatar, Gaussian splatting |
| Payments | Stripe | Industry standard, subscription billing |
| Banking | Mercury | Free, startup-friendly, integrates with Stripe |
| Email | Google Workspace | HIPAA BAA available, professional email |
| Analytics | PostHog | Self-hostable, privacy-focused, generous free tier |
| Marketing clips | HeyGen | Best for pre-recorded avatar content |
| Clinical infrastructure | OpenLoop / CareValidate | Clinicians, prescribing, pharmacy, labs, compliance |

### One Backend, Two Brands
Same codebase, different theme + system prompt. Brand determined by NEXT_PUBLIC_BRAND env var ("ava" or "lux"). Database includes brand column for data separation. Stripe uses different statement descriptors per brand ("AVA HEALTH" vs "LUX HEALTH"). Separate privacy policies, same Terms of Service structure.

### Phase 1 Launch Architecture (Text Only — No Avatar)
```
withava.co (Vercel) → Claude API direct (MVP shortcut) → Text responses
Cost per conversation: ~$0.05
Monthly infrastructure: ~$100-200
```

### Phase 2 Architecture (Add Avatar — Funded by Revenue)
```
withava.co (Vercel) → eigen-api (AWS) → Claude + Whisper + ElevenLabs + Simli
Cost per avatar conversation: ~$0.21
Monthly infrastructure: ~$500-1,000 at scale
```

---

## 12. CURRENT STATUS & NEXT STEPS

### Completed
- ✅ Eigen Holdings LLC — filed with Delaware (April 6, 2026)
- ✅ EIN — received
- ✅ Operating Agreement — received from Northwest (needs signing + capital contribution amount)
- ✅ Initial Resolutions — signed by Northwest
- ✅ Domains purchased — withava.co, withlux.co, eigen-holdings.com (Cloudflare)
- ✅ Google Workspace — set up on eigen-holdings.com, HIPAA BAA accepted
- ✅ Business email — pw@eigen-holdings.com (DKIM configured)
- ✅ OpenLoop — partnership inquiry submitted
- ✅ CareValidate — demo/intro call booked (May 19, 2026)
- ✅ GitHub account — created for business code (separate from Veradigm work)
- ✅ WSL2 + Claude Code — installed on personal Windows PC
- ✅ Project scaffold — CLAUDE.md + all docs copied to ava-web repo

### In Progress
- 🔄 Certificate of Good Standing — ordered from Delaware (short form, ~$50, awaiting delivery)
- 🔄 Washington foreign registration — blocked on Certificate of Good Standing
- 🔄 Mercury bank account — need to apply (requires Certificate of Formation + EIN)
- 🔄 Building ava-web prototype — scaffold ready, Claude Code ready, starting Phase 1

### Pending
- 🔲 Sign Operating Agreement (fill in $10K capital contribution, sign, date)
- 🔲 Open Mercury bank account
- 🔲 Transfer $10K capital contribution (personal → Mercury, memo: "Member capital contribution")
- 🔲 Apply for Brex/Ramp business credit card
- 🔲 File Washington foreign registration ($180 + cert of good standing)
- 🔲 Engage healthcare attorney ($3-5K) — Lengea Law or Nixon Law Group
- 🔲 Compare OpenLoop vs CareValidate after both respond
- 🔲 Get E&O + general liability + cyber insurance (~$2-4.5K/year)
- 🔲 Build and deploy Ava MVP (text chat, no avatar)
- 🔲 Set up Stripe subscriptions ($149/$249)
- 🔲 Generate HeyGen avatar marketing clips (50-100 hooks)
- 🔲 Set up TrafficJunky account for Lux ads
- 🔲 Create TikTok account for Ava content

### Key Dates
- **May 19, 2026:** CareValidate intro call (15 min)
- **June 1, 2027:** First Delaware franchise tax payment ($300)
- **December 31, 2026:** DEA telemedicine flexibilities expiration (monitor for extension/permanence)

---

## 13. PRINCIPLES & DECISION FRAMEWORK

### Strategic Principles
1. **TRT durability over GLP-1 hype** — We chose TRT specifically because testosterone is a decades-old generic with no branded competitor that can compress our pricing. We are NOT riding a temporary pricing window.
2. **The avatar IS the product** — Not a feature on top of a form. The conversation IS the intake, assessment, education, and close. If you remove the AI, there's no product.
3. **Premium positioning via minimalism** — The extreme simplicity of our design IS the premium signal. Landing page: just her face, one line, one button. Nothing else.
4. **Compliance built in, not bolted on** — Every safeguard is implemented in code from day one. System prompt constitution, output filter, judge pattern, emergency detection, UI disclosures.
5. **Cost architecture from day one** — Graduated funnel gates expensive avatar sessions behind engagement signals. Hard daily budget ceilings. Message limits. Concurrency caps.
6. **Retention over acquisition** — Three layers: biological continuity (TRT itself), visible progress (radar chart), ongoing relationship (Ava's monthly check-ins). Most TRT competitors have Layer 1 only.
7. **Never call ourselves an "AI company"** — We're a men's health optimization platform. The AI is the experience, not the pitch. Avoid the Medvi hype narrative trap.
8. **Clean financial separation** — All business expenses through Mercury/Brex. Never personal credit card for ongoing costs. Operating Agreement signed before capital contribution.

### Product Design Principles
1. **Mobile-first** — All designs target 375px first. Most users come from TikTok (Ava) or mobile browsers (Lux).
2. **Dark theme only** — Premium, intimate, reduces fatigue for late-night health conversations.
3. **Typography carries the design** — Cormorant Garamond (display, weight 300) + DM Sans (body, weight 300). Light weights create airy, premium feel.
4. **Radar chart is the hero** — The health profile visualization is the most important UI element after Ava herself. It makes invisible progress visible and creates the shareable "screenshot moment."
5. **Text-first launch** — Validate the product with text chat before investing in live avatar. Avatar is an accelerant, not a prerequisite.
6. **Every page earns its existence** — Landing page has one job: get them to click "Talk to me." Chat has one job: build the profile. Profile has one job: show results and drive to labs. Labs has one job: convert to subscriber. No feature bloat.

---

## 14. RISKS & MITIGATIONS

| Risk | Severity | Likelihood | Mitigation |
|---|---|---|---|
| DEA telemedicine flexibilities expire (end 2026) | HIGH | MEDIUM | Partner with lab networks for hybrid in-person intake |
| State AG targets AI avatars in healthcare | HIGH | LOW | Aggressive compliance from day one, all disclosures built in |
| Patient adverse event from AI misinformation | HIGH | LOW | 5-layer compliance system, E&O insurance |
| Hims enters TRT with massive marketing budget | MEDIUM | HIGH | Avatar experience differentiates — they can't copy the relationship |
| OpenLoop/CareValidate pricing too high | MEDIUM | MEDIUM | Negotiate with both, choose better deal, switch later if needed |
| Avatar costs exceed budget during viral moment | MEDIUM | MEDIUM | Hard daily budget ceiling, graduated funnel, text fallback |
| Veradigm IP clause conflict | MEDIUM | LOW | Separate GitHub account, separate computer, separate everything |
| GLP-1 market collapse spills into TRT perception | LOW | LOW | TRT is structurally different — generic drug, not pricing arbitrage |

---

## 15. GLOSSARY

- **TRT:** Testosterone Replacement Therapy
- **MSO:** Management Services Organization — the non-clinical entity that owns technology and marketing
- **CPOM:** Corporate Practice of Medicine — state laws restricting non-physicians from owning medical practices
- **PHI:** Protected Health Information — health data that can identify a specific individual
- **BAA:** Business Associate Agreement — HIPAA contract with vendors who handle PHI
- **DTC:** Direct-to-Consumer — selling directly to end customers, not through insurance/hospitals
- **CAC:** Customer Acquisition Cost
- **MRR:** Monthly Recurring Revenue
- **ARR:** Annual Recurring Revenue
- **ARPU:** Average Revenue Per User
- **LTV:** Lifetime Value of a customer
- **EIN:** Employer Identification Number — federal tax ID
- **DEA:** Drug Enforcement Administration — regulates controlled substances including testosterone (Schedule III)
- **GLP-1:** Glucagon-Like Peptide-1 — class of drugs for weight loss (Wegovy, Ozempic, Mounjaro)
