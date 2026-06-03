# Phase 1B-ii — Encrypted Health Schema + Compliance Log Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the encrypted health-data foundation — app-layer field encryption, the 🔒 tables + `compliance_log` with RLS, typed access helpers, and the real compliance-log writer — that chat (1C) will write into.

**Architecture:** App-layer AES-256-GCM encrypts the 🔒 columns before insert and decrypts on read (key from env, `server-only`), layered on the always-on Supabase RLS + at-rest encryption. `compliance_log` is de-identified (salted HMAC `user_ref`) and written only via the service role. Typed `/lib/health` helpers hide ciphertext from callers.

**Tech Stack:** Next.js 16 (TS strict), Supabase (Postgres + RLS), Node `crypto` (AES-256-GCM, HMAC-SHA256), Vitest.

**Spec:** `docs/superpowers/specs/2026-06-03-phase-1b-ii-health-schema-design.md`

**Conventions:** Branch `phase-1b-ii/health-schema` off `main`. `phase-1:` commits, one concern each, `Co-Authored-By` trailer. TS strict; no `any` without `// reason:`. Migration applied via the (already authed) Supabase MCP to dev project `kwmitrnypadzuqueefxi`.

**No user setup needed for Tasks 1–4** (unit tests self-provide keys; the MCP applies the migration). Task 5 adds the `COMPLIANCE_LOG_SALT` env slot and prompts you to generate the two secrets into `.env.local` for the live disclosure-log path.

---

## File Structure

**Created:**
- `test/stubs/empty.ts` — empty module that `server-only` aliases to in tests
- `lib/crypto/field.ts` — `encryptField` / `decryptField` (AES-256-GCM, versioned, server-only)
- `lib/compliance/log.ts` — `hashUserRef`, `writeComplianceEvent`, `makeComplianceSink`
- `lib/health/store.ts` — typed encrypt-on-write / decrypt-on-read helpers
- `supabase/migrations/0003_health.sql`
- `test/crypto/field.test.ts`, `test/compliance/log.test.ts`, `test/health/store.test.ts`

**Modified:**
- `vitest.config.ts` — alias `server-only` → the stub
- `app/disclosure/accept/route.ts` — write a `disclosure_accepted` compliance event
- `.env.example` — add `COMPLIANCE_LOG_SALT`

---

## Task 1: Test stub + field encryption

**Files:**
- Create: `test/stubs/empty.ts`, `lib/crypto/field.ts`, `test/crypto/field.test.ts`
- Modify: `vitest.config.ts`

- [ ] **Step 1: Create the branch + the `server-only` test stub**

```bash
cd /home/pgw/projects/ava-web
git checkout -b phase-1b-ii/health-schema
```

`test/stubs/empty.ts`:

```ts
// Stub that `server-only` resolves to under Vitest (the real package throws on import
// outside a server bundle; in unit tests we want to exercise server-only modules directly).
export {};
```

- [ ] **Step 2: Alias `server-only` to the stub in `vitest.config.ts`**

```ts
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    setupFiles: ['test/setup.ts'],
    include: ['test/**/*.test.ts', 'test/**/*.test.tsx'],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./', import.meta.url)),
      'server-only': fileURLToPath(new URL('./test/stubs/empty.ts', import.meta.url)),
    },
  },
});
```

- [ ] **Step 3: Write the failing test**

`test/crypto/field.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { randomBytes } from 'node:crypto';
import { encryptField, decryptField } from '@/lib/crypto/field';

beforeEach(() => {
  process.env.SUPABASE_DB_ENCRYPTION_KEY = randomBytes(32).toString('base64');
});

describe('field encryption', () => {
  it('round-trips a value and does not leak plaintext', () => {
    const ct = encryptField('low energy, poor sleep');
    expect(ct).not.toContain('low energy');
    expect(decryptField(ct)).toBe('low energy, poor sleep');
  });

  it('is version-tagged v1', () => {
    expect(encryptField('x').startsWith('v1:')).toBe(true);
  });

  it('uses a fresh IV (same input -> different ciphertext)', () => {
    expect(encryptField('same')).not.toBe(encryptField('same'));
  });

  it('detects tampering via the GCM auth tag', () => {
    const parts = encryptField('secret').split(':');
    const ct = Buffer.from(parts[2], 'base64');
    ct[0] ^= 0x01;
    parts[2] = ct.toString('base64');
    expect(() => decryptField(parts.join(':'))).toThrow();
  });

  it('fails to decrypt with a different key', () => {
    const ct = encryptField('secret');
    process.env.SUPABASE_DB_ENCRYPTION_KEY = randomBytes(32).toString('base64');
    expect(() => decryptField(ct)).toThrow();
  });

  it('rejects an unknown version tag', () => {
    expect(() => decryptField('v9:a:b:c')).toThrow(/format/i);
  });

  it('throws when the key env is missing or wrong size', () => {
    delete process.env.SUPABASE_DB_ENCRYPTION_KEY;
    expect(() => encryptField('x')).toThrow();
    process.env.SUPABASE_DB_ENCRYPTION_KEY = Buffer.from('tooshort').toString('base64');
    expect(() => encryptField('x')).toThrow(/32 bytes/);
  });
});
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `npx vitest run test/crypto/field.test.ts`
Expected: FAIL — cannot resolve `@/lib/crypto/field`.

- [ ] **Step 5: Write `lib/crypto/field.ts`**

```ts
import 'server-only';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const VERSION = 'v1';

function getKey(): Buffer {
  const raw = process.env.SUPABASE_DB_ENCRYPTION_KEY;
  if (!raw) throw new Error('SUPABASE_DB_ENCRYPTION_KEY is not set');
  const key = Buffer.from(raw, 'base64');
  if (key.length !== 32) {
    throw new Error('SUPABASE_DB_ENCRYPTION_KEY must decode to 32 bytes (base64 of a 256-bit key)');
  }
  return key;
}

/** Encrypts a UTF-8 string. Format: "v1:<ivB64>:<ciphertextB64>:<authTagB64>". */
export function encryptField(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', getKey(), iv);
  const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${VERSION}:${iv.toString('base64')}:${ct.toString('base64')}:${tag.toString('base64')}`;
}

export function decryptField(value: string): string {
  const parts = value.split(':');
  if (parts.length !== 4 || parts[0] !== VERSION) {
    throw new Error('Unrecognized ciphertext format');
  }
  const [, ivB64, ctB64, tagB64] = parts;
  const decipher = createDecipheriv('aes-256-gcm', getKey(), Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  const pt = Buffer.concat([decipher.update(Buffer.from(ctB64, 'base64')), decipher.final()]);
  return pt.toString('utf8');
}
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npx vitest run test/crypto/field.test.ts`
Expected: PASS (7 cases).

- [ ] **Step 7: Commit**

```bash
git add test/stubs/empty.ts vitest.config.ts lib/crypto/field.ts test/crypto/field.test.ts
git commit -m "phase-1: app-layer AES-256-GCM field encryption

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: Compliance log module

**Files:**
- Create: `lib/compliance/log.ts`, `test/compliance/log.test.ts`

- [ ] **Step 1: Write the failing test**

`test/compliance/log.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { hashUserRef, writeComplianceEvent, makeComplianceSink } from '@/lib/compliance/log';

beforeEach(() => {
  process.env.COMPLIANCE_LOG_SALT = 'test-salt';
});

function fakeClient() {
  const insert = vi.fn().mockResolvedValue({ error: null });
  return { client: { from: vi.fn(() => ({ insert })) } as never, insert };
}

describe('hashUserRef', () => {
  it('is deterministic per user and differs across users', () => {
    expect(hashUserRef('u1')).toBe(hashUserRef('u1'));
    expect(hashUserRef('u1')).not.toBe(hashUserRef('u2'));
  });
  it('does not contain the raw user id', () => {
    expect(hashUserRef('user-123')).not.toContain('user-123');
  });
  it('throws when the salt is missing', () => {
    delete process.env.COMPLIANCE_LOG_SALT;
    expect(() => hashUserRef('u1')).toThrow();
  });
});

describe('writeComplianceEvent', () => {
  it('inserts a de-identified row', async () => {
    const { client, insert } = fakeClient();
    await writeComplianceEvent(client, { userRef: 'ref', event: 'disclosure_accepted', outcome: 'accepted' });
    expect(insert).toHaveBeenCalledWith({ user_ref: 'ref', event: 'disclosure_accepted', outcome: 'accepted' });
  });
});

describe('makeComplianceSink', () => {
  it('writes the hashed user_ref with the event/outcome', () => {
    const { client, insert } = fakeClient();
    const sink = makeComplianceSink(client, 'u1');
    sink({ event: 'emergency_detected', outcome: 'bypassed_llm' });
    expect(insert).toHaveBeenCalledWith({
      user_ref: hashUserRef('u1'),
      event: 'emergency_detected',
      outcome: 'bypassed_llm',
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run test/compliance/log.test.ts`
Expected: FAIL — cannot resolve `@/lib/compliance/log`.

- [ ] **Step 3: Write `lib/compliance/log.ts`**

```ts
import 'server-only';
import { createHmac } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ComplianceRecord, ComplianceSink } from '@/lib/safeguards/types';

/** Non-reversible, salted, stable per user. Survives PII deletion (not a foreign key). */
export function hashUserRef(userId: string): string {
  const salt = process.env.COMPLIANCE_LOG_SALT;
  if (!salt) throw new Error('COMPLIANCE_LOG_SALT is not set');
  return createHmac('sha256', salt).update(userId).digest('hex');
}

export async function writeComplianceEvent(
  client: SupabaseClient,
  record: { userRef: string; event: string; outcome: string },
): Promise<void> {
  await client.from('compliance_log').insert({
    user_ref: record.userRef,
    event: record.event,
    outcome: record.outcome,
  });
}

/** Adapts the safeguard pipeline's sink to the de-identified compliance_log (service-role client). */
export function makeComplianceSink(client: SupabaseClient, userId: string): ComplianceSink {
  const userRef = hashUserRef(userId);
  return (record: ComplianceRecord) => {
    // best-effort: never block the user path on an audit-write failure
    void writeComplianceEvent(client, { userRef, event: record.event, outcome: record.outcome }).catch(
      () => {},
    );
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run test/compliance/log.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/compliance/log.ts test/compliance/log.test.ts
git commit -m "phase-1: compliance_log writer + salted user_ref + safeguard sink

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: Health store (encrypt-on-write / decrypt-on-read)

**Files:**
- Create: `lib/health/store.ts`, `test/health/store.test.ts`

- [ ] **Step 1: Write the failing test**

`test/health/store.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { randomBytes } from 'node:crypto';
import { decryptField, encryptField } from '@/lib/crypto/field';
import {
  saveHealthScores,
  getLatestHealthScores,
  saveSessionSummary,
  saveUserFacts,
} from '@/lib/health/store';

beforeEach(() => {
  process.env.SUPABASE_DB_ENCRYPTION_KEY = randomBytes(32).toString('base64');
});

/** Captures the row passed to insert/upsert. */
function captureClient(method: 'insert' | 'upsert') {
  const captured: { row?: Record<string, unknown> } = {};
  const fn = (row: Record<string, unknown>) => {
    captured.row = row;
    return Promise.resolve({ error: null });
  };
  return { client: { from: () => ({ [method]: fn }) } as never, captured };
}

/** A client whose select chain resolves to a single prebuilt row. */
function singleRowClient(row: Record<string, unknown> | null) {
  const result = Promise.resolve({ data: row, error: null });
  const chain: Record<string, unknown> = {};
  for (const m of ['select', 'eq', 'order', 'limit']) chain[m] = () => chain;
  chain.maybeSingle = () => result;
  return { from: () => chain } as never;
}

const AXES = { energy: 40, strength: 50, sleep: 60, drive: 30, focus: 45, body: 55 };

describe('saveHealthScores', () => {
  it('encrypts per-axis and keeps overall plaintext', async () => {
    const { client, captured } = captureClient('insert');
    await saveHealthScores(client, 'u1', { axes: AXES, overall: 47 });
    const row = captured.row!;
    expect(row.overall).toBe(47);
    expect(row.user_id).toBe('u1');
    expect(row.energy as string).toMatch(/^v1:/);
    expect(decryptField(row.energy as string)).toBe('40');
  });

  it('stores null for an unscored axis', async () => {
    const { client, captured } = captureClient('insert');
    await saveHealthScores(client, 'u1', { axes: { ...AXES, body: null }, overall: 47 });
    expect(captured.row!.body).toBeNull();
  });
});

describe('getLatestHealthScores', () => {
  it('decrypts per-axis back to numbers', async () => {
    const stored: Record<string, unknown> = { user_id: 'u1', overall: 47, created_at: 't' };
    for (const [k, v] of Object.entries(AXES)) stored[k] = encryptField(String(v));
    const res = await getLatestHealthScores(singleRowClient(stored), 'u1');
    expect(res).toEqual({ axes: AXES, overall: 47 });
  });

  it('returns null when there is no row', async () => {
    expect(await getLatestHealthScores(singleRowClient(null), 'u1')).toBeNull();
  });
});

describe('saveSessionSummary / saveUserFacts', () => {
  it('encrypts the summary, leaves session_type plaintext', async () => {
    const { client, captured } = captureClient('insert');
    await saveSessionSummary(client, 'u1', 'slept poorly, low drive', 'text');
    expect(captured.row!.session_type).toBe('text');
    expect(decryptField(captured.row!.summary as string)).toBe('slept poorly, low drive');
  });

  it('encrypts lifestyle json, leaves age_band/wearable plaintext', async () => {
    const { client, captured } = captureClient('upsert');
    await saveUserFacts(client, 'u1', { ageBand: '30-39', lifestyle: { sleepHrs: 6 }, wearable: 'oura' });
    expect(captured.row!.age_band).toBe('30-39');
    expect(captured.row!.wearable).toBe('oura');
    expect(JSON.parse(decryptField(captured.row!.lifestyle as string))).toEqual({ sleepHrs: 6 });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run test/health/store.test.ts`
Expected: FAIL — cannot resolve `@/lib/health/store`.

- [ ] **Step 3: Write `lib/health/store.ts`**

```ts
import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { AXES, type AxisScores } from '@/lib/scoring';
import { decryptField, encryptField } from '@/lib/crypto/field';

export async function saveHealthScores(
  client: SupabaseClient,
  userId: string,
  scores: { axes: AxisScores; overall: number | null },
): Promise<void> {
  const row: Record<string, string | number | null> = { user_id: userId, overall: scores.overall };
  for (const axis of AXES) {
    const v = scores.axes[axis];
    row[axis] = v === null ? null : encryptField(String(v));
  }
  await client.from('health_scores').insert(row);
}

export async function getLatestHealthScores(
  client: SupabaseClient,
  userId: string,
): Promise<{ axes: AxisScores; overall: number | null } | null> {
  const { data } = await client
    .from('health_scores')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  const row = data as Record<string, unknown>;
  const axes = {} as AxisScores;
  for (const axis of AXES) {
    const v = row[axis];
    axes[axis] = v == null ? null : Number(decryptField(v as string));
  }
  return { axes, overall: (row.overall as number | null) ?? null };
}

export async function saveSessionSummary(
  client: SupabaseClient,
  userId: string,
  summary: string,
  sessionType: 'text' | 'avatar',
): Promise<void> {
  await client.from('session_summaries').insert({
    user_id: userId,
    summary: encryptField(summary),
    session_type: sessionType,
  });
}

export async function getRecentSummaries(
  client: SupabaseClient,
  userId: string,
): Promise<{ summary: string; sessionType: string; createdAt: string }[]> {
  const { data } = await client
    .from('session_summaries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(3);
  return ((data as Record<string, unknown>[] | null) ?? []).map((r) => ({
    summary: decryptField(r.summary as string),
    sessionType: r.session_type as string,
    createdAt: r.created_at as string,
  }));
}

export async function saveUserFacts(
  client: SupabaseClient,
  userId: string,
  facts: { ageBand?: string; lifestyle?: unknown; wearable?: string },
): Promise<void> {
  await client.from('user_facts').upsert(
    {
      user_id: userId,
      age_band: facts.ageBand ?? null,
      lifestyle: facts.lifestyle === undefined ? null : encryptField(JSON.stringify(facts.lifestyle)),
      wearable: facts.wearable ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );
}

export async function getUserFacts(
  client: SupabaseClient,
  userId: string,
): Promise<{ ageBand: string | null; lifestyle: unknown; wearable: string | null } | null> {
  const { data } = await client.from('user_facts').select('*').eq('user_id', userId).maybeSingle();
  if (!data) return null;
  const row = data as Record<string, unknown>;
  return {
    ageBand: (row.age_band as string | null) ?? null,
    lifestyle: row.lifestyle ? JSON.parse(decryptField(row.lifestyle as string)) : null,
    wearable: (row.wearable as string | null) ?? null,
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run test/health/store.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/health/store.ts test/health/store.test.ts
git commit -m "phase-1: typed health store (encrypt-on-write / decrypt-on-read)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: Migration `0003_health` (apply via Supabase MCP)

**Files:**
- Create: `supabase/migrations/0003_health.sql`

- [ ] **Step 1: Write the migration**

`supabase/migrations/0003_health.sql`:

```sql
-- 🔒 user facts (one row per user). lifestyle is app-layer encrypted (stored as text).
create table if not exists public.user_facts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  age_band text,
  lifestyle text,
  wearable text,
  updated_at timestamptz not null default now()
);
alter table public.user_facts enable row level security;
create policy "user_facts_select_own" on public.user_facts
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "user_facts_insert_own" on public.user_facts
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "user_facts_update_own" on public.user_facts
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- 🔒 session summaries (append-only). summary is encrypted.
create table if not exists public.session_summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  summary text not null,
  session_type text not null,
  created_at timestamptz not null default now()
);
alter table public.session_summaries enable row level security;
create policy "session_summaries_select_own" on public.session_summaries
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "session_summaries_insert_own" on public.session_summaries
  for insert to authenticated with check ((select auth.uid()) = user_id);
create index if not exists session_summaries_user_created_idx
  on public.session_summaries (user_id, created_at desc);

-- 🔒 health scores (append-only). Per-axis encrypted (text); overall plaintext (share/trends).
create table if not exists public.health_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  energy text, strength text, sleep text, drive text, focus text, body text,
  overall smallint,
  created_at timestamptz not null default now()
);
alter table public.health_scores enable row level security;
create policy "health_scores_select_own" on public.health_scores
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "health_scores_insert_own" on public.health_scores
  for insert to authenticated with check ((select auth.uid()) = user_id);
create index if not exists health_scores_user_created_idx
  on public.health_scores (user_id, created_at desc);

-- De-identified compliance log. RLS on, NO policies: service-role write only, never user-readable.
create table if not exists public.compliance_log (
  id uuid primary key default gen_random_uuid(),
  user_ref text not null,
  event text not null,
  outcome text not null,
  created_at timestamptz not null default now()
);
alter table public.compliance_log enable row level security;
create index if not exists compliance_log_user_ref_idx
  on public.compliance_log (user_ref, created_at desc);
```

- [ ] **Step 2: Apply via the Supabase MCP**

Use MCP `apply_migration` (name `0003_health`, project `kwmitrnypadzuqueefxi`) with the SQL above.
Expected: `{"success": true}`.

- [ ] **Step 3: Verify RLS + policies**

Via MCP `execute_sql`:
```sql
select c.relname,
       c.relrowsecurity as rls,
       (select count(*) from pg_policies p where p.tablename = c.relname and p.schemaname = 'public') as policies
from pg_class c
where c.relnamespace = 'public'::regnamespace
  and c.relname in ('user_facts','session_summaries','health_scores','compliance_log')
order by c.relname;
```
Expected: `rls = true` on all four; `user_facts` 3 policies, `session_summaries` 2, `health_scores` 2,
`compliance_log` **0** (service-role-only by design).

- [ ] **Step 4: Run advisors**

MCP `get_advisors` (type `security`). Expected: only the intended `rls_enabled_no_policy` INFO for
`waitlist` **and** `compliance_log` (both deliberately policy-free, service-role-only); no new WARN.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0003_health.sql
git commit -m "phase-1: encrypted health tables + compliance_log (RLS)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: Wire `disclosure_accepted` event + env slot

**Files:**
- Modify: `app/disclosure/accept/route.ts`, `.env.example`

- [ ] **Step 1: Add `COMPLIANCE_LOG_SALT` to `.env.example`**

Add under the `# App config` section of `.env.example`:

```
COMPLIANCE_LOG_SALT=               # HMAC salt for de-identified compliance_log user_ref
```

- [ ] **Step 2: Record the compliance event in `app/disclosure/accept/route.ts`**

Replace the file with (adds the audit write after stamping acceptance; best-effort, never blocks):

```ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { hashUserRef, writeComplianceEvent } from '@/lib/compliance/log';
import { isBlockedState } from '@/lib/auth/geo';

export async function POST(request: Request): Promise<Response> {
  const origin = new URL(request.url).origin;

  const form = await request.formData();
  const accepted = form.get('accept') === 'yes';
  const rawState = form.get('state_code');
  const submittedState = typeof rawState === 'string' && rawState ? rawState.toUpperCase() : null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL('/sign-in', origin), { status: 303 });
  }

  const { data: profile } = await supabase
    .from('users')
    .select('state_code')
    .eq('id', user.id)
    .maybeSingle();
  const existingState = (profile?.state_code as string | null) ?? null;
  const finalState = existingState ?? submittedState;

  if (!finalState || !accepted) {
    return NextResponse.redirect(new URL('/disclosure', origin), { status: 303 });
  }

  if (isBlockedState(finalState)) {
    await supabase.from('users').update({ state_code: finalState }).eq('id', user.id);
    return NextResponse.redirect(new URL('/unavailable', origin), { status: 303 });
  }

  await supabase
    .from('users')
    .update({ state_code: finalState, ai_disclosure_accepted_at: new Date().toISOString() })
    .eq('id', user.id);

  // De-identified audit event (best-effort; never block the user path).
  try {
    await writeComplianceEvent(getSupabaseAdmin(), {
      userRef: hashUserRef(user.id),
      event: 'disclosure_accepted',
      outcome: 'accepted',
    });
  } catch {
    // intentionally ignored — audit write failure must not break onboarding
  }

  return NextResponse.redirect(new URL('/home', origin), { status: 303 });
}
```

- [ ] **Step 3: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/disclosure/accept/route.ts .env.example
git commit -m "phase-1: record disclosure_accepted compliance event + COMPLIANCE_LOG_SALT slot

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: Full verification (+ optional live audit check)

- [ ] **Step 1: Full suite, lint, build**

Run: `npm run test`
Expected: PASS — crypto, compliance, health-store suites plus all prior tests.

Run: `npm run lint`
Expected: clean.

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 2 (optional, needs the secrets): live disclosure-audit check**

Only if you want to see the audit row end-to-end now. Generate the two secrets into `.env.local`:
```
SUPABASE_DB_ENCRYPTION_KEY=<openssl rand -base64 32>
COMPLIANCE_LOG_SALT=<openssl rand -base64 32>
```
(Back up the encryption key — losing it makes encrypted data unrecoverable.) Run `npm run dev` on your
machine, accept the disclosure as a signed-in user, then via the Supabase MCP:
```sql
select event, outcome, created_at from public.compliance_log order by created_at desc limit 3;
```
Expected: a `disclosure_accepted` / `accepted` row with a hashed `user_ref` (no raw user id).

This is optional — no live health-data flow exists until 1C; the encryption + store are unit-proven.

---

## Done criteria (Slice 1B-ii)

- [ ] `npm run test`, `npm run lint`, `npm run build` green.
- [ ] `encryptField`/`decryptField` round-trip, tamper-detect, version-tag, server-only.
- [ ] `0003_health` live: three 🔒 tables RLS owner-only; `compliance_log` RLS-on/no-policies; advisors clean.
- [ ] Health-store helpers encrypt 🔒 fields on write, decrypt on read (mock client + real crypto); `overall` plaintext.
- [ ] `compliance_log` writer + `makeComplianceSink` + salted `user_ref`; `disclosure/accept` records the event.

## Deferred (do not build here)

`credit_ledger` + `outstanding_liability` (1D); `share_card_data` view (1E); live health read/write in chat (1C); KMS/envelope key management (launch).
