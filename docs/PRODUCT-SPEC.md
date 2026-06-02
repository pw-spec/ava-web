# PRODUCT-SPEC.md

Product behavior spec. Pairs with `docs/ARCHITECTURE.md` (how) and `docs/COMPLIANCE.md` (limits).

## The radar chart (product core)

Six axes, each scored 0–100:

| Axis | Icon | Signals |
|---|---|---|
| Energy | ⚡ | fatigue, afternoon crashes, endurance |
| Strength | 💪 | recovery, physical performance |
| Sleep | 🌙 | quality, duration, waking patterns |
| Drive | 🔥 | libido, motivation, ambition |
| Focus | 🧠 | brain fog, irritability, clarity |
| Body | 📊 | composition, weight, appearance |

### Scoring (deterministic — see ARCHITECTURE §Profile computation)
Claude extracts symptom signals into a typed schema; a pure function maps signals → 0–100 per axis and an overall. The LLM never invents the number.

| Overall | Label | Color |
|---|---|---|
| 80–100 | Optimized | green |
| 65–79 | Solid | light green |
| 50–64 | Room to Grow | amber |
| 35–49 | Needs Attention | orange |
| 20–34 | Flagged | red |
| 0–19 | Critical | dark red |

Labels are deliberately non-diagnostic (compliance). Most first sessions land 35–55.

### Engagement mechanics
- **"??" gaps:** free/text session covers only 3–4 of 6 axes; the rest show "??" to drive completion.
- **Trend arrows:** show deltas vs last check-in (requires history → subscription).
- **Overall score:** single 0–100 number, credit-score style.

## Conversation flow

| Phase | Msgs | What |
|---|---|---|
| Opening | 1–2 | greeting + AI disclosure + open energy question |
| Exploration | 6–10 | one axis per exchange, score updates after each |
| The Gap | 2–3 | show radar with "??" gaps, tease full profile |
| Decision | 1 | CTA: Profile $29 / Starter $9 / continue text / optional referral |
| Close | 2–3 | complete chart (if paid), optional referral, brag card |

Principles: one axis per exchange (not rapid-fire); each question follows from the last answer; leave 2–3 axes unscored on free; referrals always optional with a "not right now."

## Profile artifacts (two, never merged)

### Private profile (paid deliverable — "informative")
- Full radar (all 6 axes), written report (Claude Sonnet), specific patterns, suggested clinician questions.
- In-account only. RLS-protected. Never reachable by the share endpoint.

### Brag card (shareable — "show off", sensitive data stripped)
- Reads only from the `share_card_data` view (overall score, progress delta, radar **silhouette**).
- Two variants:
  - **Day-one card:** abstract overall score + silhouette, framed "got my baseline." (build in Phase 1)
  - **Progress card:** leads with delta ("+14 in 6 weeks") + optional templated Ava hype clip. Higher share rate, lower risk, reinforces subscription. (build in Phase 2 — **priority shareable**)
- No per-axis labels, no symptoms, no condition language — ever.

### Templated Ava clip (optional, on brag card)
- Pre-built Ava performance; only name/score/delta are slotted in. Not a per-user generation (COGS).
- Script passes the output filter at stricter thresholds (COMPLIANCE §Shareable video).

## Pricing & credits

**Hard floor: $0.75/credit standard.** $0.55/credit is Max-subscriber-only and volume-capped. Free tier is text-only (no avatar).

One-time:
| Product | Price | Credits | Notes |
|---|---|---|---|
| Free | $0 | text-only | 8–10 text msgs/day, partial radar |
| Starter Check-In | $9 | 8 | basic radar |
| Wellness Profile ⭐ | $29 | 12 | hero product; full radar + report |
| Deep Wellness Profile | $49 | 25 | + 7-day text follow-up |

Subscriptions (monthly credit grant on renewal):
| Plan | $/mo | Credits/mo | Value |
|---|---|---|---|
| Plus | 12.99 | 4 | memory, weekly tracking |
| Pro | 29 | 16 | monthly report, trends |
| Max | 49 | 40 | advanced tracking, priority |

Top-ups (never expire):
| Pack | Price | Rate |
|---|---|---|
| 10 | $11.99 | $1.20/min |
| 30 | $29.99 | $1.00/min |
| 60 | $54.99 | $0.92/min |
| 150 | $112 | $0.75/min |

1 credit = 1 minute of avatar session **wall-clock**. Decrement server-side per minute. At concurrency cap → graceful text fallback.

**Credits expire** 12 months from purchase (`CREDIT_EXPIRY_MONTHS`) and are tracked as a liability, not revenue — refunds reverse the Stripe charge and remove credits atomically. See `docs/CREDIT-LIABILITY-AND-EXIT.md`.

## Referrals (Ava = RevOffers partners only; upside, not base revenue)
- Pattern → partner mapping (TRT→Hone, ED→BlueChew is **Lux-only**, weight→Ro/Eden, etc.). On Ava, use mainstream RevOffers partners only; CrakRevenue is Lux/Phase 3.
- CPA on conversion (~$30–75 Hone), not per-click. Treat as upside.
- Link shown only when conversation reveals a genuine pattern, always optional, state-checked.

## Wearables
- Launch: ask verbally. Phase 2: Apple Health CSV upload. Phase 3+: Terra API.
