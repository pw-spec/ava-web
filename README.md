# Ava — Claude Code Starter Kit

Everything Claude Code needs to start building **Ava** (Eigen Holdings' AI wellness companion for men's health). Drop these files into your `ava-web` repo root.

## What's here

```
CLAUDE.md                      ← loaded every session; the rules of the build
.env.example                   ← all keys to wire up (test/sandbox in dev)
.claude/
  skills/
    ava-guardrails/SKILL.md     ← project skill, auto-loads; enforces compliance/cost/data rules
docs/
  business-strategy.md          ← full v4.0 strategy (the "why" — business context)
  ARCHITECTURE.md               ← system design, pipelines, LLM routing, repo layout
  DATA-MODEL.md                 ← Supabase schema, RLS, encryption, credit ledger, share view
  COMPLIANCE.md                 ← five-layer safeguards, allow/deny, geo-block, GATE 1 red-team
  CREDIT-LIABILITY-AND-EXIT.md  ← credits as liability, expiration, reserve, clean wind-down
  PRODUCT-SPEC.md               ← radar, scoring, conversation flow, two profile artifacts, pricing
  BUILD-PLAN.md                 ← phased plan + decision gates + live checklists
  SKILLS.md                     ← which Claude Code skills/plugins + MCP servers to install
```

## Order to read (for a human)
1. `docs/business-strategy.md` — the context and the reasoning behind every constraint.
2. `CLAUDE.md` — the non-negotiable build rules.
3. `docs/BUILD-PLAN.md` — what to build first.
Then the spec docs as each phase needs them.

## First session

1. Put this kit at the repo root and commit it.
2. In Claude Code, install the skills/MCP servers from `docs/SKILLS.md` (`/plugin`, `/mcp`).
3. Copy `.env.example` → `.env.local` and fill in **test/sandbox** credentials.
4. Open a session and start with:

   > "Read CLAUDE.md and docs/BUILD-PLAN.md. We're starting Phase 0. Set up the Next.js + Supabase skeleton and the safeguard system before any feature. Confirm the plan back to me before writing code."

5. Claude Code will auto-load `ava-guardrails` whenever you touch sensitive paths.

## The things that protect this business (don't let them erode)
- **Compliance first** — safeguards before features; attorney sign-off + red-team green before public launch (GATE 1).
- **Protect the avatar cost** — free tier text-only, avatar metered by wall-clock, $0.75 credit floor.
- **Credits are a liability** — they expire (12 mo); keep a funded reserve that always covers outstanding balances; build the clean-exit switches at launch (`docs/CREDIT-LIABILITY-AND-EXIT.md`).
- **Don't spend ahead of proof** — build in phase order; gates release the next phase; kill criteria cap the loss.
