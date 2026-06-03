# Phase 1B-i — Auth + Gating — Design

**Date:** 2026-06-02
**Phase:** 1 (Ava MVP) — Slice 1B-i
**Status:** Approved for planning

## Context

1A shipped the public landing + waitlist. 1B-i builds the **access-control layer** that will stand
in front of the (future) gated product: authentication, a user profile, the AI-disclosure gate
(COMPLIANCE Layer 5), and the CA/NY geo-block. Chat (1C) needs a signed-in user to attach
memory/scores to, and the disclosure + geo-block are compliance switches we build early.

The public landing/teaser (`/`) stays public — it has no auth, health data, or LLM. The gate sits
only in front of authenticated product areas.

1B (the larger unit) was decomposed into **1B-i (this spec — auth + gating)** and **1B-ii (the 🔒
health schema + encryption + `compliance_log`)**. This spec is 1B-i only.

## Scope

**In scope**
- Supabase Auth via `@supabase/ssr` (cookie sessions; server + browser clients; session-refresh
  middleware).
- **Email + password** (email confirmation required) and **Google OAuth**. Auth callback route.
- `users` profile table (migration `0002_users`) + RLS + auto-create trigger; `state_code` captured
  at sign-up.
- Sign-in / sign-up screens, a `/disclosure` acceptance page, an `/unavailable` (geo-block) page,
  and a minimal authed `/home` placeholder behind the gate.
- A single pure `gateDecision(...)` function driving redirects, wired into middleware/layout.
- Geo-block CA/NY via **both** self-reported state (sign-up) and the platform IP geo header (deploy).
- Unit tests (pure decision functions, form validation) + a live auth round-trip verification.

**Out of scope (later)**
- The 🔒 health tables (`user_facts`, `session_summaries`, `health_scores`), `credit_ledger`,
  `compliance_log`, RLS for those, and field encryption → **1B-ii**.
- The de-identified `compliance_log` *event* for disclosure acceptance → **1B-ii** (a hook is left;
  `ai_disclosure_accepted_at` is stored on `users` now).
- Real chat / LLM, profiles, credits, avatar → 1C+.
- Apple sign-in and email magic-link → later (needs Apple dev account / not now).

## Architecture decision

**Standard `@supabase/ssr` cookie-session setup** (the supported App-Router pattern): a browser
client, a server client bound to the request cookies, and middleware that refreshes the session and
applies the gate. No alternative is seriously considered — this is the documented approach. I will
confirm specifics (client factories, the profile-creation trigger, redirect-URL config) against the
`supabase` skill at build time.

**Geo-block uses both signals (defense in depth)** — self-reported `state_code` at sign-up (checked
immediately) and the platform IP geo header (`x-vercel-ip-country-region`) in middleware once
deployed. Locally there is no geo header, so dev **allows**, with an env/header override to exercise
the blocked path in tests. Rejected: IP-only (untestable locally, VPN-evadable), state-only
(trivially falsified). COMPLIANCE asks for "IP + state".

## Module layout

```
/lib/supabase
  admin.ts          (exists) service-role client
  server.ts         server client bound to request cookies (@supabase/ssr)
  client.ts         browser client (@supabase/ssr)
/lib/auth
  gate.ts           gateDecision(input) -> 'allow' | redirect path  (pure)
  geo.ts            isBlockedState(stateCode) · stateFromGeoHeader(header)  (pure)
  states.ts         US state list + BLOCKED_STATES (CA, NY from GEO_BLOCK_STATES)
middleware.ts       (root) refresh session + apply gateDecision
/app
  (auth)/sign-in/page.tsx        email+password form + "Continue with Google"
  (auth)/sign-up/page.tsx        email+password + state select + Google
  auth/callback/route.ts         code -> session exchange (OAuth + email confirm)
  auth/signout/route.ts          sign out
  disclosure/page.tsx            Layer-5 acceptance checkbox -> sets ai_disclosure_accepted_at
  disclosure/accept/route.ts     POST: stamp ai_disclosure_accepted_at
  unavailable/page.tsx           "not available in your state yet"
  (app)/home/page.tsx            minimal authed placeholder (proves the gate)
/components/auth
  AuthForm.tsx, GoogleButton.tsx, StateSelect.tsx, DisclosureGate.tsx
/supabase/migrations
  0002_users.sql    users table + RLS + handle_new_user trigger
/test/auth
  gate.test.ts, geo.test.ts, + component tests
```

## Data flow

- **Sign up (email/pw):** form (email, password, `state_code`) → if `isBlockedState` → `/unavailable`
  (no account). Else `supabase.auth.signUp` with `state_code` in user metadata → confirmation email
  → user clicks link → `auth/callback` exchanges code → session. A `handle_new_user` trigger inserts
  the `users` profile row (id, email, state_code from metadata).
- **Sign in:** email/pw or Google → `auth/callback` (Google) → session cookie.
- **Every gated request (middleware):** the gate runs on the auth routes and the `(app)` area — **not**
  the public landing `/`. Refresh session, then compute
  `gateDecision({ hasSession, disclosureAccepted, geoState })` with this precedence:
  1. `isBlockedState(geoState)` → `/unavailable` (highest — a blocked user never proceeds, even with a
     session; COMPLIANCE blocks CA/NY sign-up *and* use)
  2. no session → `/sign-in`
  3. session, `ai_disclosure_accepted_at` null → `/disclosure`
  4. else → allow
- **Disclosure accept:** POST `disclosure/accept` sets `users.ai_disclosure_accepted_at = now()`
  (RLS: owner only). (compliance_log event deferred to 1B-ii.)

## Error handling

- Auth errors (bad credentials, unconfirmed email, OAuth failure) → inline form error, never leak
  internals.
- Middleware: on session-refresh failure, treat as unauthenticated (→ `/sign-in`), never 500 the app.
- The `users` profile row must exist for an authed user; if the trigger ever failed, the gate treats
  missing profile as "disclosure not accepted" (→ `/disclosure`) rather than crashing.

## Testing

- **`gate.ts` (unit):** every branch — no session; session+no-disclosure; blocked geo (even with
  session+disclosure, blocked wins as appropriate); fully-allowed. Exact redirect targets asserted.
- **`geo.ts` (unit):** `isBlockedState('CA'|'NY')` true; other states false; case-insensitive;
  `stateFromGeoHeader` parses `US-CA` style values and handles missing/garbage.
- **Components (jsdom):** sign-in/up render, client-side validation, Google button present, state
  select lists states; disclosure page requires the checkbox before enabling submit.
- **Live verification:** real email/password sign-up → confirm → sign-in → hit `/home`; Google
  sign-in round-trip; a CA/NY sign-up → `/unavailable`. (Real Supabase auth isn't unit-tested; the
  decisions around it are.)

## Migration (`0002_users`)

`users(id uuid pk references auth.users on delete cascade, email text, display_name text, state_code
text, created_at timestamptz default now(), ai_disclosure_accepted_at timestamptz)`. RLS on; policies
allow a user to select/update **only their own row**. `handle_new_user()` trigger (SECURITY DEFINER,
pinned search_path) inserts the profile on `auth.users` insert, pulling `state_code`/`email` from the
new row's metadata. Applied via the Supabase MCP to the dev project; advisors re-checked after.

## New dependencies

`@supabase/ssr`.

## Acceptance criteria

- [ ] Email/password sign-up (with confirmation) + Google sign-in both reach an authed session.
- [ ] `users` row auto-created with `state_code`; RLS prevents reading others' rows.
- [ ] Gate: unauthed → `/sign-in`; authed w/o disclosure → `/disclosure`; CA/NY → `/unavailable`;
      otherwise `/home`. Driven by the unit-tested `gateDecision`.
- [ ] Disclosure acceptance stamps `ai_disclosure_accepted_at`; gate then allows.
- [ ] Public landing `/` remains reachable without auth.
- [ ] `npm run test` (pure + component), `npm run lint`, `npm run build` green; live auth verified.

## Deferred to 1B-ii (explicit)

The 🔒 health schema + `credit_ledger` + `compliance_log` + RLS + field encryption (pgsodium/Vault
vs app-layer decision), and wiring the safeguard pipeline's injected `log` to the real
`compliance_log` writer (including the disclosure-accepted event).
