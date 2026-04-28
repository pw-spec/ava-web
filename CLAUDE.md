# Ava Web — Project Guide

## What is this?

Next.js frontend for **withava.co** — an AI-powered men's health optimization companion focused on TRT (testosterone replacement therapy). Ava is an AI avatar that guides men through a health assessment conversation, builds a real-time health radar chart, and connects them with licensed clinicians for treatment.

This is the mainstream brand of Eigen Holdings LLC. A second brand (Lux at withlux.co) shares the same backend but targets a different audience via different design and system prompts.

## Owner

- **Company:** Eigen Holdings LLC (Delaware)
- **Founder:** Solo founder, Staff ML Engineer with healthcare IT background
- **Stage:** Pre-launch, bootstrapped

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Fonts:** DM Sans (body) + Cormorant Garamond (display/headings) via Google Fonts
- **Deployment:** Vercel
- **State:** React hooks (useState, useReducer, useContext)
- **API calls:** fetch to backend API (eigen-api on AWS)
- **Charts:** Recharts or custom SVG for radar chart
- **No localStorage/sessionStorage** — use React state only

## Design System

- **Theme:** Dark, premium, minimal. Navy/teal palette.
- **Primary background:** `#04060b` to `#0a1018` gradient
- **Primary accent:** Teal `#0d9488` / `#14b8a6`
- **Secondary accent:** Purple `#7c3aed` (used sparingly)
- **Text primary:** `#f1f5f9`
- **Text secondary:** `#64748b`
- **Text muted:** `#1e293b`
- **Font sizes:** Body 14px, headings use Cormorant Garamond at 300 weight
- **Border radius:** Buttons = 100px (pill shape), Cards = 12px
- **Spacing:** Generous whitespace. Breathe. Less is more.
- **Aesthetic:** Think Oura Ring meets premium health clinic. NOT a typical telehealth checkout page. The extreme minimalism IS the statement.

## Key Rules

### HIPAA / Security
- **NO PHI stored in frontend** — all health data goes to the backend API
- **NO localStorage or sessionStorage** — state lives in React only
- **NO analytics that track health data** — only page views, clicks, funnel events
- **All API calls over HTTPS**
- **Never log health data to console in production**

### Compliance / AI Disclosure
- **Every page must include AI disclosure** — "AI health companion · Not a doctor · 100% private" in footer
- **First chat message must disclose AI status** — "I'm Ava, an AI health companion — not a doctor or medical provider."
- **Persistent AI badge** visible during all chat/avatar interactions
- **Before lab order:** Required checkbox — "I understand that Ava is an AI and that all treatment decisions will be made by a licensed provider."

### Avatar Persona
- **Name:** Ava
- **Personality:** Athletic, warm, evidence-based. Like a sharp friend who understands endocrinology.
- **Tone:** Direct but kind. 1-3 sentences max. Never clinical jargon without explanation.
- **She NEVER:** Diagnoses, prescribes, guarantees outcomes, claims to be a doctor
- **She CAN:** Educate ("commonly associated with"), ask about symptoms, update health scores, recommend lab testing

### Content Rules
- Never say "you have [condition]" — say "these symptoms are commonly associated with"
- Never recommend specific medications or dosages
- Never guarantee prescriptions or outcomes
- Never use "Dr.", "physician", or clinical credentials for Ava
- Always frame treatment as "if medically appropriate" and "determined by licensed providers"

## Project Structure

```
ava-web/
├── CLAUDE.md                  ← You are here
├── README.md                  ← Setup instructions
├── docs/
│   ├── SPEC.md               ← Full product specification
│   ├── ARCHITECTURE.md       ← Technical architecture
│   ├── COMPLIANCE.md         ← Legal safeguards & rules
│   └── DESIGN.md             ← Design system details
├── src/
│   ├── app/                  ← Next.js App Router pages
│   │   ├── layout.tsx        ← Root layout with fonts, metadata
│   │   ├── page.tsx          ← Landing page (just Ava, one line, one button)
│   │   ├── chat/
│   │   │   └── page.tsx      ← Chat experience
│   │   ├── profile/
│   │   │   └── page.tsx      ← Health profile results
│   │   ├── labs/
│   │   │   └── page.tsx      ← Lab kit CTA / checkout
│   │   ├── privacy/
│   │   │   └── page.tsx      ← Privacy policy
│   │   └── terms/
│   │       └── page.tsx      ← Terms of service
│   ├── components/
│   │   ├── ui/               ← Reusable UI components
│   │   ├── chat/             ← Chat-specific components
│   │   ├── avatar/           ← Avatar display components
│   │   └── charts/           ← Radar chart, score bars
│   ├── lib/
│   │   ├── api.ts            ← Backend API client
│   │   ├── scoring.ts        ← Health scoring logic
│   │   ├── compliance.ts     ← Output filter, banned phrases
│   │   └── constants.ts      ← Config, theme values
│   ├── hooks/
│   │   ├── useChat.ts        ← Chat state management
│   │   └── useScoring.ts     ← Health score state
│   └── types/
│       └── index.ts          ← TypeScript types
├── public/
│   └── fonts/                ← Local font files if needed
├── tailwind.config.ts
├── next.config.ts
├── tsconfig.json
├── package.json
└── .env.example              ← Template for environment variables
```

## Environment Variables

```env
# .env.local (never commit this)
NEXT_PUBLIC_API_URL=http://localhost:3001     # Backend API
NEXT_PUBLIC_BRAND=ava                         # ava or lux
NEXT_PUBLIC_SIMLI_API_KEY=                    # Simli avatar (Phase 2)
```

## The Funnel — User Journey

```
1. LANDING (/) — Static, $0 cost
   Just Ava's avatar image, one line, one button
   "Let's figure out what's going on."
   [Talk to me]

2. CHAT (/chat) — Claude API, ~$0.003/message
   Text chat with Ava (animated orb, no video yet)
   6 free messages for anonymous users
   Sign-up gate: email required to continue
   Radar chart builds in real-time as user shares symptoms
   After 3+ symptom areas covered → transition to profile

3. PROFILE (/profile) — Static, $0 cost
   Health radar chart (full)
   Overall score with category breakdown
   Before/after comparison (returning users)
   "These patterns are common. A blood test tells us exactly."
   [Get your lab kit →]

4. LABS (/labs) — Static + Stripe, $0 until conversion
   Lab kit details
   Pricing: $149/month
   Required AI disclosure checkbox
   Stripe checkout integration
```

## Commands

```bash
npm run dev        # Start dev server on localhost:3000
npm run build      # Production build
npm run lint       # Lint check
npm run type-check # TypeScript check
```

## Working With This Project

- Start features on branches, merge to main
- Mobile-first design — test at 375px width first
- All text content should be easy to swap for the Lux variant
- Keep components small and composable
- Prefer server components; use 'use client' only when needed
- Test the full funnel flow after any UI change
