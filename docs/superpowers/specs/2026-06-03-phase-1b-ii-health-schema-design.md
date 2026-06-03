# Phase 1B-ii — Encrypted Health Schema + Compliance Log — Design

**Date:** 2026-06-03
**Phase:** 1 (Ava MVP) — Slice 1B-ii
**Status:** Approved for planning

## Context

1B-i shipped auth + the gate. 1B-ii builds the **encrypted health-data foundation** that chat (1C)
writes into: the 🔒 tables (`user_facts`, `session_summaries`, `health_scores`), the de-identified
`compliance_log`, app-layer field encryption, and the typed access helpers. Like the Phase-0
safeguard core, this slice builds the foundation + tests; the data actually *flows* in 1C.

Defense in depth (all three layers, not alternatives): **encryption-at-rest** (Supabase disk-level,
always) + **RLS owner-only** (always) + **app-layer field encryption** of the 🔒 columns (this slice).

## Scope

**In scope**
- `/lib/crypto/field.ts` — app-layer AES-256-GCM field encryption (versioned, server-only).
- Migration `0003_health`: `user_facts`, `session_summaries`, `health_scores`, `compliance_log` + RLS.
- `/lib/compliance/log.ts` — `writeComplianceEvent`, `makeComplianceSink`, `hashUserRef`.
- `/lib/health/store.ts` — typed encrypt-on-write / decrypt-on-read helpers for the 🔒 tables.
- Wire the existing `disclosure/accept` route to write a `disclosure_accepted` compliance event
  (closes the hook deferred from 1B-i).
- Add `COMPLIANCE_LOG_SALT` to `.env.example`; document `SUPABASE_DB_ENCRYPTION_KEY` usage.
- Unit tests for crypto, compliance hashing/sink, and the health store (mocked client + real crypto).

**Out of scope (deferred)**
- `credit_ledger` → **1D** (credits/Stripe/liability). `share_card_data` + `outstanding_liability`
  views → **1D/1E**.
- Any code that *reads/writes* health data in a live flow (chat, profile) → **1C+**. This slice is
  the schema + access layer + tests only.
- KMS / envelope encryption for the key → **launch hardening** (the `v1:` version tag keeps this
  migration open).

## Encryption decision (approved)

**App-layer AES-256-GCM**, on top of the always-on RLS + at-rest. Rationale: protects 🔒 data from
anyone who reaches the DB (breach, insider, leaked service-role key); gives a clean **crypto-shred**
wind-down (delete the key → data unreadable); avoids Supabase's **deprecated** pgsodium TCE. Trade-off
(accepted): encrypted columns are not queryable — so only plaintext columns (`user_id`, `created_at`,
`overall`) are used in `WHERE`/joins.

**Key management:** 256-bit key in `SUPABASE_DB_ENCRYPTION_KEY` (base64), server-only env (`.env.local`
in dev → Vercel sensitive env at deploy); never `NEXT_PUBLIC_`; backed up out-of-band (loss =
unrecoverable data). Ciphertext is version-tagged (`v1:`) so a future v2 key / KMS migration needs no
format change.

## Module: `/lib/crypto/field.ts`

```
import 'server-only'
encryptField(plaintext: string): string   // "v1:<ivB64>:<ctB64>:<tagB64>"
decryptField(ciphertext: string): string   // throws on bad version / tamper / wrong key
```
- AES-256-GCM, fresh random 12-byte IV per call, 16-byte GCM auth tag (integrity).
- Key loaded lazily via `getKey()` (base64 → 32-byte Buffer); throws a clear error if env missing or
  not 32 bytes.
- Pure and unit-testable (Node `crypto`): round-trip equality; flipping any ciphertext byte → decrypt
  throws (tamper detection); a different key → throws; output starts with `v1:`.

## Migration `0003_health`

All tables: `id uuid pk default gen_random_uuid()`, `user_id uuid not null references auth.users(id)
on delete cascade`, RLS **enabled**, owner-only policies (`TO authenticated`, `USING (auth.uid() =
user_id)`, and `WITH CHECK (auth.uid() = user_id)` on insert/update). Encrypted 🔒 columns are stored
as `text` (ciphertext).

| Table | Encrypted (🔒, `text` ciphertext) | Plaintext |
|---|---|---|
| `user_facts` | `lifestyle` | `age_band text`, `wearable text`, `updated_at timestamptz` |
| `session_summaries` | `summary` | `session_type text`, `created_at timestamptz default now()` |
| `health_scores` | `energy, strength, sleep, drive, focus, body` (each `text`) | `overall smallint`, `created_at timestamptz default now()` |

`overall` is intentionally plaintext (read by the future share view + trends); per-axis scores are
encrypted (they reveal which symptom is low). Per-axis values are the integer score serialized to a
string, then encrypted.

### `compliance_log` (de-identified, separate from PII)
```
id uuid pk, user_ref text not null, event text not null, outcome text not null,
created_at timestamptz not null default now()
```
- **RLS enabled, NO anon/authenticated policies** — written only by the service-role writer, never
  user-readable (same structural pattern as `waitlist`).
- Never stores symptoms/scores/PII — only that a safeguard fired and when.
- Survives PII deletion: `user_ref` is a salted hash, not a foreign key (no cascade), so wind-down
  ("delete PII, keep compliance logs") is one clean operation.

## Module: `/lib/compliance/log.ts`

```
hashUserRef(userId: string): string        // HMAC-SHA256(userId, COMPLIANCE_LOG_SALT), hex
writeComplianceEvent(client, { userRef, event, outcome }): Promise<void>   // insert via service role
makeComplianceSink(client, userId): ComplianceSink   // returns the safeguard pipeline's log sink
```
- `hashUserRef` is consistent per user (lets us count a user's events) but non-reversible.
- `makeComplianceSink` adapts the safeguard pipeline's `ComplianceSink` (which receives
  `{ event, outcome }`) by binding the hashed `user_ref` and writing to `compliance_log`. 1C's chat
  route will pass this into `runChatPipeline` in place of the no-op.
- Uses the **service-role admin** client (compliance_log has no user policies). Server-only.
- `disclosure/accept` route updated to `writeComplianceEvent(..., { event: 'disclosure_accepted',
  outcome: 'accepted' })` after stamping acceptance.

## Module: `/lib/health/store.ts`

Typed wrappers; callers never see ciphertext. Each uses the server Supabase client (RLS owner):
- `saveHealthScores(client, userId, axes, overall)` — encrypt the six per-axis values, store `overall`
  plaintext.
- `getLatestHealthScores(client, userId)` — fetch latest row, decrypt per-axis → `{ axes, overall }`.
- `saveSessionSummary(client, userId, summary, sessionType)` / `getRecentSummaries(client, userId)`
  (most recent 3, decrypted).
- `saveUserFacts(client, userId, { ageBand, lifestyle, wearable })` / `getUserFacts(client, userId)`
  (decrypt `lifestyle`).

## Error handling

- Missing/invalid `SUPABASE_DB_ENCRYPTION_KEY` or `COMPLIANCE_LOG_SALT` → throw a clear server error at
  first use (fail closed; never store plaintext to a 🔒 column).
- `decryptField` throws on tamper/wrong-key/bad-version — callers treat a decrypt failure as a data
  error, never silently return ciphertext.
- `writeComplianceEvent` failures are logged but must never block the user-facing path (compliance
  logging is best-effort-but-monitored; a failed audit write shouldn't 500 a chat turn).

## Testing

- **crypto (Vitest, node):** round-trip; tamper → throws; wrong key → throws; `v1:` prefix; distinct
  IVs produce distinct ciphertext for the same input.
- **compliance (Vitest, node):** `hashUserRef` deterministic + non-empty + differs by user; the same
  user → same ref; `makeComplianceSink` writes the expected `{ user_ref, event, outcome }` via a mock
  client; missing salt → throws.
- **health store (Vitest, node):** with a mock Supabase client + **real** crypto — `save*` sends
  ciphertext (not plaintext) for 🔒 fields and plaintext for `overall`; `get*` decrypts back to the
  original; the round trip is lossless.
- Migration applied via Supabase MCP; `get_advisors` re-run (expect only the intended INFOs;
  `compliance_log` will show the intended `rls_enabled_no_policy` INFO like `waitlist`).

## Acceptance criteria

- [ ] `encryptField`/`decryptField` round-trip, detect tampering, and are version-tagged + server-only.
- [ ] `0003_health` live: `user_facts`, `session_summaries`, `health_scores` RLS owner-only;
      `compliance_log` RLS-on/no-policies; advisors clean.
- [ ] Health-store helpers encrypt 🔒 fields on write and decrypt on read (proven against a mock
      client with real crypto); `overall` stored plaintext.
- [ ] `compliance_log` writer + `makeComplianceSink` work; `disclosure/accept` records a
      `disclosure_accepted` event.
- [ ] `npm run test`, `npm run lint`, `npm run build` green.

## Deferred to later slices (explicit)

`credit_ledger` + `outstanding_liability` (1D); `share_card_data` view (1E); live read/write of health
data in chat (1C); KMS/envelope key management (launch hardening).
