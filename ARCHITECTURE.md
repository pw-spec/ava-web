# Technical Architecture — Eigen Holdings Platform

## Overview

Two frontends (Ava + Lux), one backend API, shared vendor integrations. The frontend is a presentation layer only — no PHI stored, no clinical decisions, no direct vendor API calls from the browser.

## System Architecture

```
┌─────────────────────────────────────────────────┐
│  FRONTEND (Vercel — no PHI)                     │
│                                                 │
│  withava.co          withlux.co                 │
│  (Next.js)           (Next.js)                  │
│  Teal/navy theme     Dark/purple theme          │
│  Ava personality     Lux personality            │
│                                                 │
│  Same codebase, different:                      │
│  - NEXT_PUBLIC_BRAND env var                    │
│  - Theme tokens                                 │
│  - System prompt personality                    │
│  - Marketing copy                               │
└────────────────────┬────────────────────────────┘
                     │ HTTPS API calls
                     ▼
┌─────────────────────────────────────────────────┐
│  BACKEND API (AWS — HIPAA zone)                 │
│                                                 │
│  API Gateway → Lambda Functions                 │
│                                                 │
│  Routes:                                        │
│  POST /chat          → conversation handler     │
│  POST /auth/signup   → user registration        │
│  POST /auth/login    → authentication           │
│  GET  /profile       → health scores            │
│  POST /labs/order    → lab kit order (→ OpenLoop)│
│  POST /subscribe     → Stripe checkout          │
│  GET  /scores/share  → shareable card data      │
│                                                 │
│  Services:                                      │
│  - Claude API (conversation + judge)            │
│  - Output filter (banned phrase detection)      │
│  - Emergency detector (crisis keywords)         │
│  - Scoring engine (health score calculation)    │
│  - Stripe (payments)                            │
│  - OpenLoop/CareValidate (clinical handoff)     │
│                                                 │
│  Database:                                      │
│  - RDS PostgreSQL (encrypted at rest)           │
│  - Tables: users, conversations, scores,        │
│    referrals, subscriptions                     │
└─────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│  CLINICAL INFRASTRUCTURE (Partner's HIPAA)      │
│                                                 │
│  OpenLoop / CareValidate                        │
│  - Licensed clinicians (50 states)              │
│  - Prescribing decisions                        │
│  - Pharmacy coordination                        │
│  - Lab ordering (Quest / Everly)                │
│  - EHR / clinical records                       │
│  - DEA compliance                               │
└─────────────────────────────────────────────────┘
```

## Frontend Architecture (This Repo)

### Tech Decisions

| Decision | Choice | Why |
|---|---|---|
| Framework | Next.js 14+ App Router | Server components, Vercel-native, best DX |
| Language | TypeScript | Type safety for health data structures |
| Styling | Tailwind CSS | Rapid iteration, consistent design tokens |
| State management | React hooks + Context | Simple enough for our needs, no Redux overhead |
| Fonts | Google Fonts (DM Sans + Cormorant Garamond) | Premium feel, free, fast CDN |
| Charts | Custom SVG | Full control over radar chart animation |
| Forms | Native HTML + React | No form library needed for simple inputs |
| Auth | JWT from backend API | Stored in httpOnly cookie, not localStorage |
| Deployment | Vercel | Auto-deploy from GitHub, edge network |

### Data Flow — Chat Message

```
1. User types message
2. Frontend sends POST /chat to backend API
   Body: { message: string, conversationId: string, brand: "ava"|"lux" }

3. Backend:
   a. Emergency detector checks user message for crisis keywords
      → If triggered: return crisis response, skip Claude
   b. Build Claude prompt (system prompt + conversation history)
      → Strip PII before sending to Claude (no names/emails in prompt)
   c. Send to Claude API (Sonnet)
   d. Parse Claude's JSON response
   e. Output filter checks for banned phrases
   f. Judge pattern: send response to Claude Haiku for compliance check
      → If flagged: regenerate response
   g. Save conversation to database (encrypted)
   h. Return response to frontend

4. Frontend receives:
   {
     message: string,
     scores: { energy, recovery, sleep, drive, mood, body },
     phase: "greeting"|"assessment"|"education"|"close",
     suggestions: string[],
     readyToClose: boolean
   }

5. Frontend updates:
   - Chat messages array
   - Radar chart (smooth CSS transition)
   - Suggestion pills
   - If readyToClose: trigger transition to /profile
```

### Data Flow — PHI Boundary

```
BROWSER (no PHI persisted):
  - Chat messages in React state (lost on page refresh — that's OK)
  - Health scores in React state
  - User email (for auth)
  - JWT token (httpOnly cookie)
  
  PHI NEVER touches:
  - localStorage
  - sessionStorage
  - URL parameters
  - Console logs (in production)
  - Analytics events
  - Error reporting payloads

BACKEND API (PHI stored encrypted):
  - Conversation transcripts (AES-256 at rest)
  - Health scores over time
  - User account info
  
  PHI NEVER sent to:
  - Simli (only receives Ava's audio output)
  - ElevenLabs (only receives Ava's response text)
  - Vercel (frontend — presentation only)
  - PostHog (analytics — configured to exclude health data)
```

### Avatar Integration (Phase 2)

Phase 1 launches with text chat + animated orb. Phase 2 adds live avatar.

```
PHASE 1 (Launch):
  User types → Backend → Claude → Text response → Frontend renders text
  Avatar: animated SVG orb that pulses/glows during "thinking"
  Cost: ~$0.003 per message (Claude only)

PHASE 2 (Month 2-3, funded by revenue):
  User speaks → Whisper (self-hosted) → Backend → Claude → ElevenLabs → Simli → Video
  Avatar: live animated face via Simli API
  Activated only after user engages deeply (3+ questions answered)
  Cost: ~$0.21 per full avatar conversation (5 minutes)
  
  Graduated unlock:
  - Anonymous: text only (6 messages max)
  - Signed up: text only (12 more messages)
  - Engaged (3+ symptom areas): live avatar unlocks
  - 5-minute avatar session cap
  - Daily budget ceiling: $100/day on avatar costs
  - Concurrency cap: max 50 simultaneous avatar sessions
```

### Multi-Brand Architecture

```
Shared:
  - All components in src/components/
  - All hooks in src/hooks/
  - All lib utilities in src/lib/
  - Backend API (same endpoints, brand passed as parameter)

Brand-specific (driven by NEXT_PUBLIC_BRAND env var):
  - Theme tokens (colors, gradients)
  - Avatar appearance
  - System prompt personality
  - Marketing copy
  - Domain

Implementation:
  // src/lib/brand.ts
  export const BRAND = process.env.NEXT_PUBLIC_BRAND as 'ava' | 'lux';
  
  export const brandConfig = {
    ava: {
      name: 'Ava',
      domain: 'withava.co',
      tagline: "Let's figure out what's going on.",
      cta: 'Talk to me',
      accent: '#0d9488',
      personality: 'athletic, warm, evidence-based',
    },
    lux: {
      name: 'Lux',
      domain: 'withlux.co',
      tagline: "Things aren't working like they used to?",
      cta: 'Talk to me',
      accent: '#7c3aed',
      personality: 'confident, direct, no-judgment',
    },
  };
```

### API Client

```typescript
// src/lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function sendMessage(
  message: string,
  conversationId: string,
  brand: 'ava' | 'lux'
) {
  const res = await fetch(`${API_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // sends httpOnly cookie
    body: JSON.stringify({ message, conversationId, brand }),
  });
  
  if (!res.ok) throw new Error('Chat request failed');
  return res.json();
}
```

### MVP Shortcut — Direct Claude Calls

For the **absolute first prototype**, the frontend can call Claude directly (before the backend exists). This is NOT for production — it's to get a working demo fast.

```typescript
// src/lib/claude-direct.ts (MVP ONLY — remove before production)
export async function sendMessageDirect(
  message: string,
  history: Array<{ role: string; content: string }>,
  systemPrompt: string
) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      system: systemPrompt,
      messages: [...history, { role: 'user', content: message }],
    }),
  });
  
  const data = await res.json();
  return data.content?.filter((b: any) => b.type === 'text')
    .map((b: any) => b.text).join('');
}
```

## Performance Targets

| Metric | Target |
|---|---|
| Lighthouse Performance | > 95 |
| First Contentful Paint | < 1.0s |
| Time to Interactive | < 1.5s |
| Chat message round-trip | < 2.0s |
| Radar chart update | < 100ms (CSS transition) |
| Bundle size (JS) | < 150KB gzipped |
