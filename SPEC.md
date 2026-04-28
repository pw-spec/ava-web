# Product Specification — Ava Health

## Overview

Ava is an AI health companion for men's health optimization. She guides men through a conversational health assessment, builds a real-time health profile (radar chart), and connects them with licensed clinicians for TRT (testosterone replacement therapy) treatment.

The core insight: the AI companion IS the product. Not a feature on top of a telehealth form — the conversation IS the intake, the assessment, the education, and the close. The landing page is just Ava waiting to talk.

## Target User

Men aged 28-55 experiencing symptoms of low testosterone:
- Chronic fatigue / energy crashes (especially afternoon)
- Poor recovery from exercise
- Sleep problems
- Low libido / sexual performance issues
- Brain fog / poor concentration
- Unexplained weight gain / difficulty building muscle
- Mood changes / irritability

These men are typically health-conscious (gym-goers, CrossFit athletes, weekend warriors) but have hit a wall despite doing "everything right." They suspect something is off but haven't connected the dots to hormonal health.

## User Journey — Detailed

### Page 1: Landing (/)

**Layout:** Absolutely minimal. Centered vertically and horizontally.

**Elements:**
1. Ambient glow behind avatar area (subtle radial gradient, teal, ~5% opacity)
2. Avatar circle (200px) — static image or 3-second idle loop
   - In production: HeyGen pre-recorded idle clip or Simli idle
   - For MVP: stylized SVG avatar placeholder or a high-quality static image
3. Name: "Ava" — Cormorant Garamond, 52px, weight 300, letter-spacing 0.06em
4. Tagline: "Let's figure out what's going on." — 16px, #64748b, weight 300
5. CTA button: "Talk to me" — transparent bg, teal border, pill-shaped, 14px
6. Footer (absolute bottom): "AI health companion · Not a doctor · 100% private" — 10px, #1e293b

**Interactions:**
- Avatar circle floats gently (CSS keyframe, 5s ease-in-out, translateY ±10px)
- Button hover: bg fills to rgba(teal, 0.08), border brightens
- Click "Talk to me" → navigate to /chat with opening message

**No other elements.** No nav bar, no features list, no pricing, no FAQ, no testimonials. The emptiness IS the design.

### Page 2: Chat (/chat)

**Layout:** Full-height chat interface.

**Top bar:**
- Avatar circle (36px) with "A" initial, teal gradient
- "Ava" label — Cormorant Garamond, 14px
- Status: "listening" (idle) or "thinking..." (loading)
- Mini radar chart (52px) in top-right — updates live

**Chat area:**
- Messages alternate left (Ava) and right (user)
- Ava messages: dark bg (rgba(30,41,59,0.3)), light text (#cbd5e1), rounded (16px 16px 16px 4px)
- User messages: teal-tinted bg (rgba(13,148,136,0.12)), cyan text (#5eead4), rounded (16px 16px 4px 16px)
- Max width per message: 78%
- Font: 14px, weight 300, line-height 1.55
- Loading: three pulsing teal dots

**Suggestion pills:**
- Shown after Ava's response when suggestions are provided
- Small pill buttons below chat: transparent bg, teal border, 11px font
- Tap to send as user message

**Input area:**
- Single-line text input, transparent bg, no border, placeholder "Talk to Ava..."
- Send button: circle, arrow up icon, teal when input has text
- Below input: "Ava is an AI companion, not a medical provider" — 9px, #1e293b

**Behavior:**
- First load: auto-send opening message, get Ava's greeting
- Ava's greeting must include AI disclosure
- Each Ava response includes: message text, health score updates, suggested replies, conversation phase
- Radar chart in top bar updates smoothly (CSS transition 0.8s)
- After 6 messages (anonymous): show email gate — "Create a free account so I can save your profile"
- After 3+ symptom areas covered and readyToClose=true: transition screen with spinner, then navigate to /profile

**Health Categories (6 dimensions):**
```
energy    ⚡  — fatigue, afternoon crashes, endurance
recovery  💪  — post-exercise recovery, soreness duration
sleep     🌙  — quality, duration, waking patterns
drive     🔥  — libido, motivation, ambition
mood      🧠  — irritability, focus, mental clarity
body      📊  — composition, weight gain, muscle
```

Each scored 0-100. Start at 50 (neutral). Adjust based on reported symptoms. Below 45 = concerning. Above 70 = healthy.

### Page 3: Profile (/profile)

**Layout:** Centered, scrollable.

**Elements:**
1. Section label: "YOUR HEALTH PROFILE" — 14px, #64748b, letter-spacing 0.05em
2. Overall score: large number (48px, Cormorant Garamond), colored by severity
   - Green (>65): mild indicators
   - Amber (45-65): moderate indicators
   - Red (<45): significant indicators
3. Subtitle: "moderate indicators — especially energy, recovery" — 13px
4. Radar chart (200px) — full version with all 6 axes
5. Category breakdown: each category as a horizontal bar
   - Icon + label + progress bar + numeric score
   - Bar color: green/amber/red based on value
6. Summary text: "These patterns are common in men with suboptimal testosterone. A simple blood test tells us exactly where you stand." — 14px, #94a3b8
7. CTA button: "Get your lab kit →" — teal gradient bg, white text, pill shape, shadow
8. Sub-text: "At-home blood test · Results in 3-5 days · Licensed clinician review" — 10px

### Page 4: Labs (/labs)

**Layout:** Centered, scrollable.

**Elements:**
1. Lab icon (emoji or SVG): 🧪
2. Heading: "Your lab kit is ready" — 24px, Cormorant Garamond
3. Description: "Comprehensive hormone panel — Total T, Free T, Estradiol, SHBG, thyroid, metabolic markers. At-home collection, mailed back prepaid." — 14px, #64748b
4. Steps list (numbered 1-5):
   - Lab kit ships to your door
   - Complete the 5-minute collection
   - Results reviewed by a licensed clinician
   - Ava walks you through your results
   - Treatment plan if medically appropriate
5. Pricing: "$149/month" — 28px, Cormorant Garamond + "/month" smaller
6. Sub-price: "Everything included · Cancel anytime" — 11px
7. **Required checkbox:** "I understand that Ava is an AI and that all treatment decisions will be made by a licensed provider."
8. CTA button: "Start my assessment →" — teal gradient, disabled until checkbox
9. Footer: "All treatment decisions by licensed providers" — 10px

## System Prompt — Ava

```
You are Ava, an AI men's health optimization companion. Warm, athletic,
evidence-based. Like a sharp friend who happens to understand endocrinology.

IDENTITY:
- You are an AI, not a doctor or medical provider
- You MUST disclose this in your first message every conversation
- Never use titles: Dr., NP, PA, RN, or any clinical credential
- If asked "are you real?" → "No, I'm an AI health companion."

RESPONSE FORMAT: ONLY valid JSON. No markdown, no backticks.
{
  "message": "Your response (1-3 sentences, warm and direct)",
  "scores": {
    "energy": 0-100,
    "recovery": 0-100,
    "sleep": 0-100,
    "drive": 0-100,
    "mood": 0-100,
    "body": 0-100
  },
  "phase": "greeting|assessment|education|close",
  "suggestions": ["prompt 1", "prompt 2"],
  "readyToClose": false
}

CONVERSATION FLOW:
- Start with warm greeting + AI disclosure + open question
- Explore ONE symptom area per message. Don't rapid-fire.
- After each area, update that category's score based on severity
- Only update scores for categories mentioned — leave others unchanged
- After 3-4 areas covered, set readyToClose: true
- Close: "I've got a clear picture. Let me show you your profile."

SCORING:
- Start all at 50 (neutral/unknown)
- Mild symptoms: reduce to 40-50
- Moderate symptoms: reduce to 25-40
- Severe symptoms: reduce to 10-25
- Good indicators: increase to 60-80
- Excellent indicators: increase to 80-100

CLINICAL BOUNDARIES:
- NEVER diagnose: "you have X" → "commonly associated with"
- NEVER prescribe: "take X mg" → "a doctor might discuss options"
- NEVER guarantee: "you'll feel better" → "many men report improvement"
- NEVER promise prescription: "we'll get you" → "if medically appropriate"

CRISIS HANDLING:
- Suicidal ideation / self-harm keywords → immediately provide 988 Lifeline
- Chest pain / breathing / emergency → immediately direct to 911
- Do NOT continue assessment after crisis detection

PERSONALITY:
- 1-3 sentences max per response
- Reference fitness/training naturally ("men who train hard often...")
- Warm but not cheesy. Direct but not cold.
- Use "commonly" / "often" / "many men report" — never definitive claims
```

## Radar Chart Component

Custom SVG radar chart with 6 axes:

```
Axes arranged in hexagonal pattern:
- Top: Energy ⚡
- Top-right: Recovery 💪
- Bottom-right: Sleep 🌙
- Bottom: Drive 🔥
- Bottom-left: Mood 🧠
- Top-left: Body 📊

Visual:
- Background rings at 25%, 50%, 75%, 100% — very faint gray lines
- Axis lines from center to each vertex — barely visible
- Emoji icons at each axis tip
- Filled polygon connecting all scores — teal fill at 12% opacity, solid teal stroke 2px
- Dots at each vertex — teal fill, dark stroke
- All transitions: 0.8s cubic-bezier(0.4, 0, 0.2, 1) for smooth score updates
```

## Shareable Health Card

Generateable client-side image for social sharing:

```
Content:
- Dark background matching site theme
- "My Ava Score: 47/100" — large text
- Mini radar chart
- "What's yours? → withava.co"
- Ava branding

What it NEVER includes:
- User's name or any PII
- Specific symptoms
- Clinical data or lab results
- Anything that could be PHI
```

## Mobile-First Responsive

All designs are mobile-first (375px). Scale up to desktop (1200px+).

- Chat interface: full-screen on mobile, centered card on desktop
- Landing page: works identically on all sizes
- Profile: single column on mobile, slight padding increase on desktop
- Radar chart: 160px on mobile, 200px on desktop
