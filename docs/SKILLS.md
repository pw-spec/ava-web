# SKILLS.md — Development environment setup for Claude Code

What to install in Claude Code before building Ava, and why each matters for *this* project. Two categories: **Skills/Plugins** (instruction sets that improve how Claude Code builds) and **MCP servers** (live connections to the services Ava uses).

## How to install skills/plugins

In a Claude Code session:
```
/plugin                       # opens the plugin browser
# → Discover tab → select a plugin → Enter to install
# → choose scope: "Project" = .claude/skills/ (shared via git)  |  "User" = ~/.claude/skills/ (all your projects)
```
For this repo, install project-relevant skills at **Project** scope so they're committed and your future sessions (and any collaborator) get them. Add community marketplaces if a skill isn't in the default Anthropic one:
```
/plugin marketplace add anthropics/claude-plugins-community
```
Manual alternative (any SKILL.md folder): copy it into `.claude/skills/<name>/SKILL.md` and restart the session.

> A starter project skill is already included in this kit at `.claude/skills/ava-guardrails/SKILL.md` — it auto-loads from the repo.

## Skills/Plugins to install

| Skill / plugin | Why for Ava | Priority |
|---|---|---|
| **frontend-design** (Anthropic) | Landing page, radar chart, brag card, chat UI — distinctive non-generic design. Core to a product men want to show off. | High |
| **skill-creator** (Anthropic) | You'll author project skills (the guardrails skill, a "scoring-function" skill). This builds/edits them. | High |
| **TypeScript/Next.js code-quality skill** (e.g. code review + test-fixing plugin from the community marketplace) | Enforces TS strict, catches the `any`-creep and float-for-money mistakes called out in `CLAUDE.md`. | High |
| **PostgreSQL/SQL skill** | Writing Supabase migrations, RLS policies, and the compliance-critical `share_card_data` view correctly. | Medium |
| **Stripe integration skill** (community) | Webhooks, idempotency, subscription lifecycle — easy to get subtly wrong with money. | Medium |
| **Playwright skill** (community) | End-to-end tests, especially the GATE 1 red-team checklist (try to make Ava say a diagnosis) and the geo-block flow. | Medium |
| **git-workflow skill** (community) | The `phase-N:` commit convention, clean one-concern commits. | Low |

Skip anything unrelated (marketing-content skills, crypto, etc.) — keep the skill set lean so the right one loads when relevant.

## MCP servers to connect

MCP servers are separate from skills — they give Claude Code live access to your services. Connect via Claude Code's MCP config (`/mcp` or the project `.mcp.json`). Use **test/sandbox credentials** in dev.

| MCP server | Use | Notes |
|---|---|---|
| **Supabase MCP** | Inspect schema, run migrations, check RLS policies directly | Use the dev project, not prod |
| **Stripe MCP** | Create products/prices, inspect test-mode events | Test mode only in dev |
| **GitHub MCP** | Issues/PRs for the phase checklist; CI status | Repo already exists (`ava-web`) |
| **Vercel MCP** (if available) | Deploys, env vars, preview URLs | Keep prod env vars out of context |
| **Filesystem** (built-in) | Repo file ops | Default |

**Do not** connect HeyGen/ElevenLabs as MCP for code-writing — integrate them as normal API clients in `/lib/avatar` (they're runtime dependencies, not dev-time tools). Their keys live in env vars only.

## Security notes for the dev environment

- All keys via env vars / MCP credential store — never in code, never pasted into chat.
- Use **test-mode Stripe** and **trial tokens** for HeyGen/ElevenLabs while building.
- Point Supabase MCP at the **dev** project; never give an agent write access to the prod DB during a build session.
- The health-data encryption (`docs/DATA-MODEL.md`) is a build requirement, not a later add-on — set it up in the Phase 0 migration.

## .env.example (keys you'll wire up)

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # server only
SUPABASE_DB_ENCRYPTION_KEY=       # for health-field encryption

# Anthropic (Claude Haiku + Sonnet)
ANTHROPIC_API_KEY=

# ElevenLabs (conversational agent)
ELEVENLABS_API_KEY=
ELEVENLABS_AGENT_ID=

# HeyGen LiveAvatar
HEYGEN_API_KEY=
HEYGEN_AVATAR_ID=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Affiliate (RevOffers — Ava only)
REVOFFERS_AFFILIATE_ID=

# App
NEXT_PUBLIC_APP_URL=
GEO_BLOCK_STATES=CA,NY
CREDIT_EXPIRY_MONTHS=12            # confirm legal period per state before launch
APP_SUNSET_MODE=false             # true = wind-down mode (no new spend, refunds + deletion allowed)
```
