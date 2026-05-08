# Claude Code — Build Guide

## How to use these files with Claude Code

### Step 1: Create the GitHub repo

```bash
# On GitHub: create new repo "ava-web" under eigenhq account
# Then locally in WSL2:
mkdir -p ~/projects
cd ~/projects
git clone git@github.com:eigenhq/ava-web.git
cd ava-web
```

### Step 2: Copy all scaffold files into the repo

Copy CLAUDE.md, README.md, .env.example, .gitignore, and the docs/ folder into the repo root.

```bash
# Your repo should now look like:
# ava-web/
# ├── CLAUDE.md
# ├── README.md
# ├── .env.example
# ├── .gitignore
# └── docs/
#     ├── SPEC.md
#     ├── ARCHITECTURE.md
#     ├── COMPLIANCE.md
#     └── DESIGN.md
```

### Step 3: Start Claude Code

```bash
cd ~/projects/ava-web
claude
```

Claude Code automatically reads CLAUDE.md and understands the project.

### Step 4: Build in phases

Give Claude Code these prompts in order. Wait for each to complete before moving to the next.

---

**PHASE 1: Project scaffolding**

```
Initialize a Next.js 14 project with TypeScript and Tailwind CSS using the App Router. 
Set up the project structure as described in CLAUDE.md. Include Google Fonts 
(DM Sans and Cormorant Garamond). Create the CSS variables from docs/DESIGN.md in 
globals.css. Create the brand configuration in src/lib/brand.ts. Create TypeScript 
types in src/types/index.ts for HealthScores, ChatMessage, ChatResponse, and BrandConfig.
```

---

**PHASE 2: Landing page**

```
Build the landing page (src/app/page.tsx) exactly as described in docs/SPEC.md. 
This is the most important page — it must be stunning. Just Ava's avatar (use a 
stylized SVG placeholder for now), her name in Cormorant Garamond, one tagline, 
one ghost button. Floating animation on the avatar. AI disclosure in the footer. 
Dark gradient background. Follow docs/DESIGN.md precisely for colors, typography, 
and spacing. Mobile-first, centered vertically and horizontally. The extreme 
minimalism IS the design — resist the urge to add anything else.
```

---

**PHASE 3: Radar chart component**

```
Build a reusable SVG radar chart component (src/components/charts/RadarChart.tsx) 
as described in docs/SPEC.md. 6 axes with emoji icons at the tips. Background rings 
at 25/50/75/100%. Filled polygon with teal fill at 12% opacity and solid stroke. 
Dots at each vertex. All transitions 0.8s cubic-bezier for smooth score updates. 
Accept scores prop as HealthScores type. Accept size prop with default 160. 
Build a ScoreBar component too for the category breakdown view.
```

---

**PHASE 4: Chat interface**

```
Build the chat page (src/app/chat/page.tsx) and related components as described 
in docs/SPEC.md. Include: top bar with avatar + name + status + mini radar chart, 
scrollable message area, suggestion pills, text input with send button, AI 
disclosure below input. For the MVP, call the Claude API directly from the frontend 
(see docs/ARCHITECTURE.md MVP shortcut section). Use the system prompt from 
docs/SPEC.md. Parse Claude's JSON response to update messages, scores, suggestions, 
and detect readyToClose. Implement the animated loading dots. Build a useChat 
custom hook for state management. Read the compliance module from docs/COMPLIANCE.md 
and implement the output filter and emergency detection on the frontend side.
```

---

**PHASE 5: Profile results page**

```
Build the profile page (src/app/profile/page.tsx) as described in docs/SPEC.md. 
Show overall score (large, colored by severity), radar chart (full size), category 
breakdown with ScoreBar components, summary text, and CTA button to /labs. 
Scores should be passed via URL params or React context from the chat page. 
The transition from chat to profile should feel smooth — add a loading overlay 
with spinner and "Building your profile..." text.
```

---

**PHASE 6: Labs CTA page**

```
Build the labs page (src/app/labs/page.tsx) as described in docs/SPEC.md. Lab icon, 
heading, description of what's included in the hormone panel, numbered steps (1-5), 
pricing ($149/month in Cormorant Garamond), required AI disclosure checkbox that 
enables the CTA button, and the CTA button. This page does not have real Stripe 
integration yet — just the UI. Add the disclaimer footer.
```

---

**PHASE 7: Legal pages**

```
Create /privacy and /terms pages with placeholder content. These should match the 
site's dark design. Include prominent AI disclosure sections as described in 
docs/COMPLIANCE.md. The privacy page should mention: data encryption, no selling 
of data, HIPAA compliance measures, how conversation data is handled. The terms 
page should include: AI companion disclaimer, no medical advice disclaimer, 
treatment decisions made by licensed providers, subscription terms.
```

---

**PHASE 8: Polish and test**

```
Review the entire application. Check: all pages render correctly on mobile (375px) 
and desktop. The full funnel flow works: landing → chat → profile → labs. Radar chart 
updates smoothly during chat. AI disclosure appears on every page. Emergency detection 
works (test with "I want to kill myself" — should bypass Claude and show 988 info). 
Output filter catches banned phrases. Loading states work properly. No console errors. 
Run npm run build to check for any build errors. Fix any issues.
```

---

### Step 5: Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# Link withava.co domain in Vercel dashboard
```

## Tips for Working with Claude Code

1. **Be specific.** Instead of "make it look better," say "increase the spacing between the tagline and button to 44px and reduce the avatar glow opacity to 5%"

2. **Reference the docs.** Say "as described in docs/SPEC.md" or "follow the colors in docs/DESIGN.md" — Claude Code reads these files.

3. **Build incrementally.** Complete one phase, test it, then move to the next. Don't try to build everything at once.

4. **Review the code.** Claude Code is powerful but not perfect. Review each file it creates, especially the compliance module.

5. **Commit after each phase.** `git add . && git commit -m "Phase N: description"` — this gives you rollback points.

6. **Test the funnel.** After every change, click through the full flow: landing → chat (send 4-5 messages) → profile → labs. Broken funnels lose customers.
