# Design System — Ava Health

## Philosophy

Ava's design is defined by radical minimalism. The extreme simplicity IS the premium signal. When every other telehealth company has pricing grids, FAQ sections, feature lists, and stock photos — Ava has a face, a line, and a button. The emptiness says "we're so confident in this experience that we don't need to convince you."

**Aesthetic direction:** Premium health clinic meets Oura Ring. Dark, calm, scientific. Think luxury spa lighting in a digital space. Not a tech startup. Not a hospital. A place where someone is already waiting for you.

## Color Palette

### Ava Brand (Teal/Navy)

```css
:root {
  /* Backgrounds */
  --bg-primary: #04060b;
  --bg-gradient: linear-gradient(170deg, #04060b 0%, #080d16 40%, #0a1018 100%);
  --bg-card: rgba(30, 41, 59, 0.3);
  --bg-user-message: rgba(13, 148, 136, 0.12);
  --bg-ava-message: rgba(30, 41, 59, 0.3);
  
  /* Accents */
  --accent-primary: #0d9488;
  --accent-light: #14b8a6;
  --accent-glow: rgba(13, 148, 136, 0.08);
  --accent-border: rgba(13, 148, 136, 0.15);
  --accent-button-hover: rgba(13, 148, 136, 0.08);
  
  /* Text */
  --text-primary: #f1f5f9;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;
  --text-dim: #475569;
  --text-ghost: #1e293b;
  --text-user: #5eead4;
  --text-ava: #cbd5e1;
  
  /* Scores */
  --score-good: #10b981;
  --score-moderate: #f59e0b;
  --score-poor: #ef4444;
  --score-severe: #dc2626;
  
  /* Borders */
  --border-subtle: rgba(148, 163, 184, 0.04);
  --border-ring: rgba(148, 163, 184, 0.06);
  --border-accent: rgba(13, 148, 136, 0.3);
}
```

### Lux Brand (Purple/Dark) — Different accent color only

```css
:root {
  /* Same backgrounds and text as Ava */
  
  /* Different accents */
  --accent-primary: #7c3aed;
  --accent-light: #8b5cf6;
  --accent-glow: rgba(124, 58, 237, 0.08);
  --accent-border: rgba(124, 58, 237, 0.15);
  --accent-button-hover: rgba(124, 58, 237, 0.08);
  --text-user: #c4b5fd;
}
```

## Typography

### Font Stack

```css
/* Display / Headings */
font-family: 'Cormorant Garamond', serif;
/* Weights: 300 (light — primary), 400, 500 */
/* Used for: avatar name, scores, section headings, pricing */

/* Body / UI */
font-family: 'DM Sans', sans-serif;
/* Weights: 300 (light — primary), 400, 500, 600 */
/* Used for: chat messages, buttons, labels, body text */
```

### Type Scale

```
Avatar name (landing):    52px, Cormorant, 300, tracking 0.06em
Page headings:            24px, Cormorant, 300
Score number (large):     48px, Cormorant, 300
Score number (small):     28px, Cormorant, 300
Body text:                14px, DM Sans, 300
Chat messages:            14px, DM Sans, 300, line-height 1.55
Buttons:                  14px, DM Sans, 500, tracking 0.04em (landing) / 0.02em (CTA)
Labels:                   12-13px, DM Sans, 400
Tagline:                  16px, DM Sans, 300
Tiny text / disclaimers:  9-10px, DM Sans, 300-400
Status text:              10px, DM Sans, 300
```

### Key Rule
Most text uses weight 300 (light). This creates the airy, premium feel. Weight 500-600 is reserved for buttons and emphasis only. **Never use bold for body text.**

## Spacing

```
Page padding:             24px (mobile), 48px (desktop)
Chat message gap:         10px between messages
Section spacing:          32-44px between major elements
Button padding:           14px 36-40px
Card padding:             10-14px
Input padding:            10px 16px
```

## Components

### Button — Primary CTA
```
Background: linear-gradient(135deg, #0d9488, #0f766e)
Color: white
Border: none
Padding: 14px 36px
Border-radius: 100px (pill)
Font: 14px, DM Sans, 500
Shadow: 0 4px 24px rgba(13, 148, 136, 0.25)
```

### Button — Ghost / Landing
```
Background: transparent
Color: var(--accent-light)
Border: 1px solid var(--border-accent)
Padding: 14px 40px
Border-radius: 100px
Font: 14px, DM Sans, 500, tracking 0.04em
Hover: bg fills to accent at 8% opacity, border brightens
```

### Chat Bubble — Ava
```
Background: var(--bg-ava-message)
Color: var(--text-ava)
Border: 1px solid var(--border-subtle)
Border-radius: 16px 16px 16px 4px
Padding: 10px 14px
Max-width: 78%
Font: 14px, weight 300, line-height 1.55
```

### Chat Bubble — User
```
Background: var(--bg-user-message)
Color: var(--text-user)
Border: 1px solid var(--accent-border)
Border-radius: 16px 16px 4px 16px
Padding: 10px 14px
Max-width: 78%
```

### Suggestion Pill
```
Background: transparent
Color: var(--accent-light)
Border: 1px solid rgba(accent, 0.12)
Padding: 7px 12px
Border-radius: 100px
Font: 11px, DM Sans, 400
Hover: bg at 6% accent opacity
```

### Score Bar
```
Track: rgba(148, 163, 184, 0.06), height 3px, border-radius 2px
Fill: colored by score (green/amber/red), transition 0.8s
```

### Avatar Circle
```
Size: 200px (landing), 36px (chat header)
Border-radius: 50%
Background: linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)
Shadow: 0 0 60px 15px rgba(accent, 0.08)
Ring: 1.5px solid rgba(accent, 0.15), offset 4px
Animation: float 5s ease-in-out infinite (landing only)
```

## Animations

### Float (landing avatar)
```css
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
/* Duration: 5s, ease-in-out, infinite */
```

### Pulse (loading dots)
```css
@keyframes pulse {
  0%, 100% { opacity: 0.2; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.15); }
}
/* Duration: 1.2s, staggered 0.2s per dot */
```

### Spin (transition loader)
```css
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

### Score transitions
```css
/* All score-related elements */
transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
```

## Responsive Breakpoints

```
Mobile:   375px (design target)
Tablet:   768px
Desktop:  1024px
Wide:     1280px

Approach: Mobile-first. All base styles target 375px.
Use min-width media queries to scale up.
```

## Icons

Use emoji for health categories in the radar chart:
```
⚡ Energy
💪 Recovery
🌙 Sleep
🔥 Drive
🧠 Mood
📊 Body
🧪 Lab kit
```

No icon library needed. Emoji is intentional — it feels personal and human, not clinical.

## Dark Mode Only

There is no light mode. The entire experience is dark. This is intentional:
- Premium feel (luxury brands are dark)
- Intimate atmosphere (you're having a private health conversation)
- Reduces screen fatigue (these conversations happen at night, on phones)
- Visual differentiation from every other bright-white telehealth site

## What This Design Is NOT

- NOT a typical telehealth site (no product grids, pricing tables, FAQ accordion)
- NOT a medical portal (no clinical UI patterns, no patient dashboard)
- NOT generic SaaS (no gradient hero banners, no feature cards, no testimonial carousels)
- NOT a chatbot widget (no floating bubble in the corner — the chat IS the page)

The closest aesthetic references:
- Oura Ring website (dark, data-forward, premium)
- Whoop (athletic, dark, performance-focused)
- Apple Health (clean data visualization)
- A really good whiskey bar (dark, ambient, someone's waiting for you)
