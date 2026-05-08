# Design System — Ava Health

> Last revised after the Hone-register redesign. Original aesthetic
> (Cormorant Garamond + DM Sans, navy/teal, single-screen minimalism) was
> retired because patients evaluating a hormone-replacement service need
> credibility signals before aesthetic refinement. The new register matches
> Hone Health / Function Health / Whoop — premium, dark, data-forward, but
> populated with structure and proof.

## Philosophy

Ava is **premium clinical wellness, warm-dark.** Not luxury spa. Not generic
SaaS. Not cookie-cutter telehealth checkout.

The aesthetic resolves a tension specific to this market: men evaluating
TRT are skeptical, not aesthetic-shopping. They want to see the proof
(clinician, lab partner, pricing, money-back) before they evaluate the vibe.
So the design has to be **populated** (multi-section scroll, data-forward,
section eyebrows, mono numerals) AND **premium** (warm cream on warm-dark,
generous spacing, Inter-light display, no decoration). It carries weight
without going stiff.

Reference points: **Hone Health** (premium men's hormone), **Function
Health** (premium clinical labs, dark editorial UX), **Whoop** (athletic
data-density), **Levels** (medical-grade data viz with personality).

---

## Color palette

All tokens live as CSS custom properties on `:root` in
`src/app/globals.css`. Lux brand overrides via `[data-brand="lux"]`.

### Backgrounds

```css
--bg-primary:   #0a0d12;                                  /* warm dark base */
--bg-gradient:  linear-gradient(180deg, #0a0d12 0%,
                  #0e1218 60%, #0c1016 100%);
--bg-card:      rgba(20, 24, 33, 0.55);                   /* default surface */
--bg-elevated:  rgba(28, 32, 42, 0.75);                   /* lifted card */
--bg-input:     rgba(30, 34, 44, 0.5);                    /* form fields */
--bg-user-message: rgba(20, 168, 154, 0.12);              /* chat: user */
--bg-ava-message:  rgba(28, 32, 42, 0.55);                /* chat: ava */
```

### Accents — Ava (teal)

```css
--accent-primary:        #14a89a;        /* slightly warmer than original */
--accent-light:          #2dd4bf;
--accent-glow:           rgba(20, 168, 154, 0.10);
--accent-border:         rgba(20, 168, 154, 0.20);
--accent-button-hover:   rgba(20, 168, 154, 0.08);
```

### Premium gold — used sparingly

For premium tier, milestones, 5-star ratings. Signals upgrade without
shouting.

```css
--gold-primary:  #c8a873;
--gold-light:    #d9bb88;
--gold-glow:     rgba(200, 168, 115, 0.10);
--gold-border:   rgba(200, 168, 115, 0.22);
```

### Lux brand (purple) — overrides on `[data-brand="lux"]`

```css
--accent-primary:  #8b5cf6;
--accent-light:    #a78bfa;
--accent-glow:     rgba(139, 92, 246, 0.10);
--accent-border:   rgba(139, 92, 246, 0.20);
--text-user:       #c4b5fd;
```

### Text — warm cream tones (Hone register)

```css
--text-primary:    #f5f1e8;     /* warm cream — primary content */
--text-secondary:  #b8b3a8;     /* muted warm — body */
--text-muted:      #8a8579;     /* labels, captions */
--text-dim:        #5a564b;     /* fine print, placeholders */
--text-ghost:      #2a2820;     /* very low contrast — used rarely */
--text-user:       #5eead4;     /* chat user — keeps original cyan */
--text-ava:        #e0dccf;     /* chat Ava — slightly brighter cream */
```

### Score severity

```css
--score-good:     #10b981;     /* ≥ 65 — mild indicators */
--score-moderate: #f59e0b;     /* 45-64 — moderate */
--score-poor:     #ef4444;     /* 25-44 — significant */
--score-severe:   #dc2626;     /* < 25 — significant */
```

### Borders

```css
--border-subtle:    rgba(245, 241, 232, 0.06);
--border-divider:   rgba(245, 241, 232, 0.09);
--border-emphasis:  rgba(245, 241, 232, 0.14);
--border-ring:      rgba(245, 241, 232, 0.06);   /* radar rings */
--border-accent:    rgba(20, 168, 154, 0.30);
```

---

## Typography

### Font stack

```css
/* Display + body — Inter via next/font/google */
font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
/* Weights: 200 (display), 300, 400 (body), 500, 600, 700 */

/* Monospace — JetBrains Mono via next/font/google */
font-family: 'JetBrains Mono', ui-monospace, monospace;
/* Weights: 400 (default), 500 */
```

The redesign retired Cormorant Garamond. Editorial-display gravitas now
comes from Inter at weight 200 with negative letter-spacing — sharper and
more clinical-modern than a serif, while keeping the airy, premium feel.

### Type scale

```
Hero headline (landing):    clamp(40px, 6.4vw, 72px), Inter 200, -0.025em
Hero headline (profile):    clamp(36px, 5.4vw, 56px), Inter 200, -0.025em
Section heading H2:         clamp(28px, 4vw, 44px),   Inter 200, -0.02em
Tier price:                 56px, Inter 200, -0.02em, tabular-nums
Profile overall score:      88px, Inter 200, -0.03em, tabular-nums
Subhead / lead:             17px, Inter 400, line-height 1.55
Body:                       15px, Inter 400, line-height 1.55, -0.005em
Card body:                  13.5-14.5px, Inter 400
Section eyebrow:            11px, JetBrains Mono 400, 0.16em-0.18em tracking,
                            uppercase, hairline-prefix `--`
Label / caption:            10-12px, JetBrains Mono or Inter 500
Buttons:                    14px, Inter 500, 0.01-0.02em tracking
Chat body:                  14px, Inter 300-400, line-height 1.55
AI badge:                   9-10px, Inter 500, 0.04em tracking
Mono numerals (AVA-HRP-01): JetBrains Mono 400-500
```

### Key rules

- **Display weight is 200** (sometimes 300) — never bolder for headlines.
  Negative letter-spacing (-0.02 to -0.03em) keeps it sharp.
- **Body weight is 400** by default (was 300 in original) — slightly more
  legible at small sizes given the warmer cream contrast.
- **Mono is reserved** for: section eyebrows, tabular numbers, panel IDs,
  step counters, status pills. It signals "data" and "precision" without
  shouting.
- **Tabular numerics** (`font-variant-numeric: tabular-nums` via `.tnum`)
  on every score, price, age, and panel ID.

---

## Spacing

```
Section vertical padding:    clamp(64px, 8vw, 112px)        (.section)
Section horizontal padding:  clamp(20px, 4vw, 32px)         (.section)
Section narrow max-width:    1080px                          (.section-narrow)
Section gap (intra):         28-44px between major elements
Card padding:                24px (default), 28px (elevated)
Card radius:                 16-18px
Pill / button radius:        100px
Button padding:              14px 28-40px
Input padding:               16px 18px
Chat message padding:        10-14px
```

---

## Component primitives (CSS classes)

All defined in `src/app/globals.css`.

### `.cta-primary` / `.cta-button`

Gradient teal pill, the dominant CTA. Inset top-highlight + outer glow for
depth.

```
background: linear-gradient(135deg, var(--accent-primary), #0e8e82);
border: 1px solid var(--accent-light);
border-radius: 100px;
padding: 14px 28px;
font-weight: 500;
box-shadow:
  0 1px 0 rgba(255,255,255,0.06) inset,
  0 8px 32px rgba(20, 168, 154, 0.18);
```

Hover: `translateY(-1px)`, glow intensifies, brightness 1.05.
Active: `scale(0.98)`. Focus: 2px outline-light ring at 4px offset.

### `.cta-secondary`

Neutral pill, secondary action.

```
background: transparent;
border: 1px solid var(--border-emphasis);
border-radius: 100px;
padding: 13px 24px;
font-weight: 500;
```

Hover: subtle bg fill (`rgba(245, 241, 232, 0.04)`).

### `.ghost-button`

Legacy ghost pill — kept for `/qualify` stub fallback and any pages still
referencing it. Behaves like a tinted secondary pill (teal text + faint teal
border).

### `.intake-card`

The radio/checkbox card used throughout `/qualify`.

```
background: var(--bg-card);
border: 1px solid var(--border-subtle);
border-radius: 12px;
padding: 14px 16px;
cursor: pointer;
```

Hover: bg → `--bg-elevated`, border → `--border-emphasis`.
Selected (`data-selected="true"`): teal-tinted bg + accent-light border +
1px inset accent ring for emphasis.

### `.intake-input` / `.intake-input-wrap`

Form fields (text, email, textarea, select). Wrap controls focus styling.

```
.intake-input-wrap {
  background: var(--bg-input);
  border: 1px solid var(--border-emphasis);
  border-radius: 12px;
  transition: border-color 240ms, background 240ms;
}
.intake-input-wrap:focus-within {
  border-color: var(--accent-light);
  background: rgba(20, 168, 154, 0.06);
}
```

### `.age-range`

Custom-styled `<input type="range">`. WebKit + Firefox shaders implemented.
Track is a 4px gradient bar with progress filled in `--accent-primary`.
Thumb is a 22px circle (cream center, teal border, soft glow ring).

### `.section`, `.section-narrow`, `.section-eyebrow`

Layout primitives for the multi-section landing.

```
.section-eyebrow {
  font-family: var(--font-jetbrains-mono);
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--text-muted);
}
.section-eyebrow::before {
  content: ""; width: 24px; height: 1px;
  background: var(--text-dim);
}
```

The hairline `::before` pseudo-prefix is the consistent visual anchor on
every section heading — drawn from Stripe Press / NEJM editorial.

### `.card` / `.card-elevated`

Standard surfaces. Default = subtle border on bg-card. Elevated = stronger
border on bg-elevated, used when the card needs to read as a "panel."

### `.suggestion-pill`

Chat suggestion pills below an Ava message. Small (11px), teal-tinted,
pill-shaped. Disabled at 35% opacity when input is sending.

### `.send-button`

Circular icon button in chat input. 36px, teal-bordered, icon arrow.

### `.ai-badge`

Persistent AI disclosure pill. Used in chat top bar, video placeholders,
landing footer, qualify shell footer, profile/labs top bars.

```
background: rgba(20, 168, 154, 0.08);
color: var(--accent-light);
border: 1px solid var(--accent-border);
border-radius: 100px;
padding: 4px 10px 4px 8px;
font-size: 10px;
font-weight: 500;
letter-spacing: 0.04em;
```

Always shows: `ⓘ AI · not a doctor`.

---

## Component family — chat

| Component | Purpose | Key styling |
|---|---|---|
| `<AvaOrb size>` | Iris/aurora SVG. 36-260px scaled use. | Concentric gradients + halo + glass pulse via animation |
| `<RadarChart>` / `<AnimatedRadar>` | 6-axis hexagonal radar. | Polygon morphs via rAF tween (800ms ease-in-out) |
| `<ScoreBar>` | Single category bar. | 3px track, severity-colored fill, 0.8s width transition |
| `<ChatTopBar>` | Back-link + orb + name + status + mini radar. | Backdrop-blur, hairline divider |
| `<MessageBubble>` | Single chat message. | Asymmetric radius (4px corner kisses speaker side) |
| `<SuggestionPills>` | Pill row beneath an Ava message. | `.suggestion-pill` × N, fade-in on render |
| `<ChatInput>` | Single-line input + circular send. | Pill-wrap, accent border on focus |
| `<TypingDots>` | Three pulsing teal dots. | `pulse-dot` keyframe, 0.18s stagger |

---

## Component family — intake

| Component | Purpose |
|---|---|
| `<IntakeShell>` | Top progress bar + topbar (exit + step counter) + content slot + AI footer |
| `<ProgressBar>` | Hairline gradient progress, 480ms cubic-bezier transition |
| `<AvaQuestion>` | Orb + name + spoken text. Re-mounts on `key={stepId}`. Pulse-on-mount + fade-in |
| `<SingleSelect>` | Card-style radio list with optional helper text |
| `<MultiSelect>` | Checkbox cards with mutually-exclusive "None" option |
| `<StateDropdown>` | Native `<select>` (50 states) styled to match |
| `<AgeInput>` | Big tabular numeral + custom range slider |
| `<TextInput>` | Single-line + multiline + email variants |

---

## Component family — landing

| Section component | Purpose |
|---|---|
| `<Hero>` | Headline + subhead + dual CTA + trust microline + silent video loop |
| `<HowItWorks>` | 3-card row (`01` / `02` / `03`) |
| `<HookReel>` | 4 vertical-aspect tappable HeyGen clip placeholders |
| `<WhatWeMeasure>` | Two-col prose + grouped panel-preview card |
| `<SeeItInAction>` | Centered headline + 60s click-to-play demo video |
| `<TrustStrip>` | 5-column credentials row (`Reviewed by · Lab partner · …`) |
| `<Pricing>` | Two tier cards (`Base $149` / `Premium $249`) |
| `<Testimonials>` | 6 named placeholder cards with 5-star gold ratings |
| `<FAQ>` | 8 native `<details>` accordions |
| `<LandingFooter>` | Brand block + 3 link columns + AI badge + copyright |

### Video placeholder

`<VideoPlaceholder kind="hero|hook|demo">` is the stand-in for HeyGen
assets. Renders a poster-styled frame with the AvaOrb watermark, scanline
texture, ▶ play badge in the corner, AI disclosure badge in the bottom
corner. Three aspect ratios: 16:9 (hero, demo), 9:16 (hook reel).

Replace with a real `<video>` tag once HeyGen clips exist. Required
attributes: `muted playsInline preload="metadata" poster="…"`.

---

## Severity chip

Used on `/profile` hero. Color-coded pill matching the overall score's
severity. Implemented inline in `src/app/profile/page.tsx`.

```
[•  MILD INDICATORS]      green
[•  MODERATE INDICATORS]  amber
[•  SIGNIFICANT INDICATORS]   red / dark red
```

10px Inter 500, 0.04em tracking, uppercase. Border + bg both at low alpha
of the severity color.

---

## Animations

### `float` — retired

The 5s vertical bob on the original landing orb is gone. It was the
single most "toy-like" tell in the old design.

### `pulse-dot`

Three chat-typing dots. 1.2s, staggered 0.18s, pulses scale 1 → 1.15 and
opacity 0.2 → 0.6.

### `spin`

Used on the post-chat `/profile` transition spinner. 0.9s linear infinite.

### `fade-in`

Used on bubble enter, suggestion enter, ProfileTransition. 280-360ms
cubic-bezier(0.22, 1, 0.36, 1).

### `question-in`

Used on `<AvaQuestion>` step changes. Same cubic-bezier as fade-in,
360ms, with 8px translateY ease.

### `orb-speak`

Box-shadow ring expansion when Ava starts a new question. 1400ms ease-out,
fires once on mount of `<AvaQuestion>`.

### Radar polygon tween

Not a CSS animation — implemented with `requestAnimationFrame` because
`<polygon>` `points` is not a CSS-animatable property. Easing is a cubic
ease-in-out approximation, 800ms. See `useTweenedScores` in
`src/components/charts/RadarChart.tsx`.

### Score bar fill transition

CSS transition on `width` and `background-color`, 0.8s
cubic-bezier(0.4, 0, 0.2, 1).

### `prefers-reduced-motion`

All keyframe animations and transitions disabled when the user has
`prefers-reduced-motion: reduce`. The radar tween bails out to instant.

---

## Responsive breakpoints

```
Mobile:   375px (design target)
Tablet:   640px (sm:)
Desktop:  1024px (lg:)
Wide:     1280px (xl:)
```

Mobile-first. Most layouts collapse to single column under 640px. Hero
sections stack the video/visual below the text. The `/qualify` flow keeps
its inline-row orb + question even on 375px.

---

## Icons

- **Health categories** — emoji (⚡💪🌙🔥🧠📊), unchanged. They're
  intentionally personal and human, not clinical. Used as axis tips on the
  full radar and as leading glyphs on score bars. (Mini radar in chat top
  bar drops them — too small to read.)
- **Inline UI** — inline SVG (chevron, arrow, check, plus). No icon
  library. Each icon is a few lines hand-drawn for full control.

---

## What this design is NOT

- NOT a typical telehealth checkout (we have one, but it lives at `/labs`
  after the patient has been heard, not at `/`).
- NOT generic SaaS (no gradient hero banners, no testimonial carousel
  auto-rotating, no feature-bullet cards).
- NOT a chatbot widget (the chat IS its own page, not a corner bubble).
- NOT minimalism for minimalism's sake — the pre-redesign single-screen
  landing was retired because patients buying TRT need credibility, not
  airy emptiness.
- NOT a wellness brand (no off-white pastels, no marble photography, no
  earthy adaptogens copy). This is a **clinical** product wearing
  premium.
