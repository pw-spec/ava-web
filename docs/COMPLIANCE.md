# Compliance Safeguards — Ava / Lux Platform

> **This is the engineering implementation reference.** The legal baseline —
> per-law detail, pre-launch checklist, attorney-review gate, quarterly audit
> cadence — lives in `docs/COMPLIANCE_BASELINE.md`. The two docs are
> complementary: this one explains *how* the code enforces compliance; the
> baseline explains *what laws* are being enforced and *what other steps*
> (insurance, contracts, attorney review) are needed beyond code.

## Overview

Five layers of defense ensure the platform never violates healthcare regulations, FTC rules, or AI disclosure laws. These safeguards are built into code, not just policy documents.

## Layer 1: System Prompt Constitution

The system prompt is the first line of defense. It makes it mechanically difficult for Claude to cross compliance lines. See SPEC.md for the full system prompt.

Key rules hardcoded into every Claude call:
- Must disclose AI status in first message
- Cannot diagnose ("you have X")
- Cannot prescribe ("take X mg")
- Cannot guarantee outcomes ("you will feel better")
- Cannot promise prescriptions ("we'll get you a prescription")
- Cannot claim clinical credentials
- Must handle crisis situations (suicide/self-harm → 988, emergency → 911)

## Layer 2: Output Filter

A deterministic filter that runs on every Claude response BEFORE it's shown to the user. This catches anything the system prompt misses.

```typescript
// src/lib/compliance.ts

const BANNED_PHRASES = [
  // Diagnosing
  'you have', 'you suffer from', 'your diagnosis',
  'you are suffering', "you're diagnosed",
  'i can diagnose', 'my diagnosis',

  // Prescribing
  'you should take', 'i recommend taking',
  'start with a dose', 'mg per week', 'mg weekly',
  'milligrams per', 'inject yourself',
  'prescription for you', 'prescribe you',

  // Guaranteeing
  'guaranteed', 'you will feel', 'will definitely',
  '100% safe', 'no side effects', 'risk-free',
  'zero risk', 'completely safe',
  "we'll get you a prescription",
  "you'll get prescribed",

  // False credentials
  'as a doctor', 'as your physician',
  'as a medical professional', 'my medical opinion',
  'in my clinical experience', 'as your nurse',
  'as a healthcare provider',

  // Specific drug names with dosing
  'testosterone cypionate 200', 'testosterone cypionate 100',
  'enanthate 100', 'enanthate 200',
  'anastrozole', 'hcg protocol',
];

const REQUIRED_FIRST_MESSAGE_KEYWORDS = [
  'AI', 'not a doctor', 'not a medical provider',
];

export function filterResponse(
  response: string,
  isFirstMessage: boolean
): { safe: boolean; response: string; violation?: string } {
  // Check first message has AI disclosure
  if (isFirstMessage) {
    const hasDisclosure = REQUIRED_FIRST_MESSAGE_KEYWORDS.some(
      (phrase) => response.toLowerCase().includes(phrase.toLowerCase())
    );
    if (!hasDisclosure) {
      response =
        "I'm Ava, an AI health companion — not a doctor or medical provider. " +
        response;
    }
  }

  // Check for banned phrases
  for (const phrase of BANNED_PHRASES) {
    if (response.toLowerCase().includes(phrase.toLowerCase())) {
      return {
        safe: false,
        response: '',
        violation: `Banned phrase detected: "${phrase}"`,
      };
    }
  }

  return { safe: true, response };
}
```

## Layer 3: Judge Pattern (Backend)

A second Claude call (using Haiku for speed/cost) that evaluates every response for compliance before it's sent to the user. This runs on the backend, in parallel with the output filter.

```typescript
// Backend: src/services/judge.ts

const JUDGE_PROMPT = `
Review this response from a health AI companion called Ava.
Flag YES if it does ANY of the following:
1. Diagnoses a condition ("you have X")
2. Recommends specific medication or dosage
3. Guarantees health outcomes
4. Claims to be a medical professional
5. Fails to disclose it is AI (in first message)
6. Provides emergency medical advice instead of directing to 911/988

Response to review:
"{response}"

Answer ONLY: SAFE or FLAGGED: [reason]
`;

// Cost: ~$0.0005 per check using Haiku
// Latency: ~200ms additional
```

## Layer 4: Emergency Detection

Runs on EVERY user message BEFORE it reaches Claude. If triggered, Claude is bypassed entirely and a hardcoded safe response is returned.

```typescript
// src/lib/compliance.ts

const EMERGENCY_KEYWORDS = {
  mental_health: [
    'kill myself', 'end my life', 'suicide', 'suicidal',
    "don't want to live", 'better off dead',
    'want to die', 'no reason to live',
    'hurt myself', 'cutting myself', 'self-harm',
    'self harm', 'end it all',
  ],
  medical_emergency: [
    'chest pain', "can't breathe", 'heart attack',
    'stroke', 'seizure', 'passing out', 'unconscious',
    'severe bleeding', 'overdose', 'allergic reaction',
    'anaphylaxis',
  ],
};

const EMERGENCY_RESPONSES = {
  mental_health: {
    message:
      "I hear you, and what you're feeling matters. " +
      'Please reach out to the 988 Suicide & Crisis Lifeline — ' +
      'call or text 988, available 24/7. ' +
      "If you're in immediate danger, please call 911. " +
      "I'm an AI and I'm not equipped to provide the support " +
      'you need right now, but trained counselors at 988 are.',
    scores: null,
    phase: 'crisis',
    suggestions: [],
    readyToClose: false,
  },
  medical_emergency: {
    message:
      'Those symptoms need immediate medical attention. ' +
      'Please call 911 or go to your nearest emergency room ' +
      "right now. I'm an AI health companion and cannot provide " +
      'emergency medical care.',
    scores: null,
    phase: 'crisis',
    suggestions: [],
    readyToClose: false,
  },
};

export function checkEmergency(
  userMessage: string
): { isEmergency: boolean; type?: string; response?: any } {
  const lowerMessage = userMessage.toLowerCase();

  for (const [type, keywords] of Object.entries(EMERGENCY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerMessage.includes(keyword)) {
        return {
          isEmergency: true,
          type,
          response: EMERGENCY_RESPONSES[type as keyof typeof EMERGENCY_RESPONSES],
        };
      }
    }
  }

  return { isEmergency: false };
}
```

## Layer 5: UI Disclosure System

AI disclosure is built into the UI at every touchpoint where the user might forget they're talking to AI.

```
TOUCHPOINT 1 — Landing page footer:
  "AI health companion · Not a doctor · 100% private"

TOUCHPOINT 2 — First chat message (every conversation):
  "I'm Ava, an AI health companion — not a doctor or medical
   provider. Everything you share is private. What's been happening?"

TOUCHPOINT 3 — Persistent UI badge during chat:
  Small "AI companion" badge with ℹ️ icon, always visible
  Tapping expands to full disclosure text

TOUCHPOINT 4 — Before avatar activates (Phase 2):
  Overlay: "You're about to talk with Ava, an AI health companion.
  Ava is not a medical provider. All care decisions are made by
  licensed clinicians."
  [Continue] button required

TOUCHPOINT 5 — Before lab order checkout:
  Required checkbox: "I understand that Ava is an AI and that
  all treatment decisions will be made by a licensed provider."
  Button disabled until checked.

TOUCHPOINT 6 — Terms of Service (/terms):
  Prominent AI disclosure section (not buried)

TOUCHPOINT 7 — Privacy Policy (/privacy):
  How conversation data is stored, encrypted, and used
```

## Marketing Copy Rules

### Approved Language (use these)
```
✓ "Get evaluated for low testosterone from home"
✓ "Licensed providers, FDA-approved medications"
✓ "Lab testing + clinician review + treatment if medically appropriate"
✓ "Talk to Ava about your symptoms"
✓ "Comprehensive hormone panel"
✓ "Find out what's going on with your energy"
✓ "Many men report improved energy after optimizing their hormones"
```

### Prohibited Language (never use these)
```
✗ "Get testosterone prescribed today"
✗ "Get your prescription now"
✗ "Guaranteed results"
✗ "Gain 20lbs of muscle"
✗ "FDA-approved treatment for low energy"
✗ "Doctor-recommended" (unless specifically endorsed)
✗ "Cure" / "treat" / "heal" (in advertising context)
✗ Any specific outcome promise with a timeframe
✗ "Same as what your doctor would prescribe"
```

### Required Disclaimers
```
All ads: "Individual results may vary. Treatment requires evaluation
by a licensed provider."

All avatar ads: "Ava is an AI companion, not a medical provider."

All pricing mentions: "Treatment if medically appropriate.
Prescription not guaranteed."

All testimonials: "Individual experience. Results not typical."
```

## Shareable Health Card Rules

When users share their health profile:
```
MUST include:
  ✓ Aggregate score only (e.g., "47/100")
  ✓ Radar chart shape (no labels if shared externally)
  ✓ Ava branding + link to withava.co
  ✓ User explicitly chooses to share (opt-in, never auto)

MUST NOT include:
  ✗ User's name or any PII
  ✗ Specific symptoms reported
  ✗ Clinical data, lab results, or treatment info
  ✗ Anything that could be PHI

MUST NOT incentivize:
  ✗ "Share your profile and get 20% off" (incentivized health disclosure)
  ✓ "Refer a friend — you both get $20 off" (referral, not health sharing)
```

## Cost Controls

### Message Limits
```
Anonymous visitor:       6 text messages (Claude only)
Signed-up free user:    18 total text messages
Live avatar session:     5 minutes max
Repeat non-converter:    Text only after 3rd visit (no avatar)
```

### Budget Ceilings
```
Daily Simli budget:      $50 max (falls back to text when hit)
Daily ElevenLabs budget: $30 max
Daily Claude budget:     $20 max
Daily total ceiling:     $100 max
```

### Concurrency
```
Simultaneous avatar sessions: 50 max
When cap hit: new users stay in text mode
Message: "I'm in high demand today. Let's continue via text."
```
