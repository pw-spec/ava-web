# Phase 1B-i — Auth + Gating Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Supabase auth (email/password + Google), a `users` profile, the AI-disclosure gate, and the CA/NY geo-block, all behind one tested `gateDecision` function.

**Architecture:** `@supabase/ssr` cookie sessions (browser + server clients + a `proxy.ts` that refreshes the session and applies the gate). All gate/geo/validation logic lives in pure, unit-tested functions in `/lib/auth`; the Supabase round-trips are thin and live-verified. The `users` table is RLS owner-only with a `SECURITY DEFINER` trigger creating the profile on sign-up.

**Tech Stack:** Next.js 16 (App Router, TS strict), `@supabase/ssr` 0.10.x, Supabase Auth, Zod, Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-06-02-phase-1b-i-auth-gating-design.md`

**Conventions:** Branch `phase-1b-i/auth-gating` off `main`. `phase-1:` commit prefix, one concern each, `Co-Authored-By` trailer. TS strict; no `any` without `// reason:`. Uses existing `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` from `.env.local`.

**Prereqs for the live task (Task 12) only:** Google OAuth client configured in Supabase (steps in Task 12), Supabase email confirmations on (default). Tasks 1–11 need none of that.

---

## File Structure

**Created:**
- `lib/supabase/client.ts` — browser client (`createBrowserClient`)
- `lib/supabase/server.ts` — server client (`createServerClient`, async cookies)
- `lib/supabase/proxy.ts` — `updateSession(request)`: refresh session + apply gate
- `proxy.ts` (root) — Next entrypoint delegating to `updateSession`
- `lib/auth/states.ts` — `US_STATES`, `BLOCKED_STATES`
- `lib/auth/geo.ts` — `isBlockedState`, `stateFromGeoHeader`
- `lib/auth/gate.ts` — `gateDecision`
- `lib/auth/validate.ts` — `credentialsSchema`, `signUpSchema`, parse helpers
- `app/(auth)/sign-in/page.tsx`, `app/(auth)/sign-up/page.tsx`
- `app/auth/callback/route.ts`, `app/auth/signout/route.ts`
- `app/disclosure/page.tsx`, `app/disclosure/accept/route.ts`
- `app/unavailable/page.tsx`
- `app/(app)/layout.tsx` (server-side gate), `app/(app)/home/page.tsx`
- `components/auth/SignInForm.tsx`, `SignUpForm.tsx`, `GoogleButton.tsx`, `StateSelect.tsx`, `DisclosureForm.tsx`
- `supabase/migrations/0002_users.sql`
- `test/auth/*.test.ts(x)`

**Modified:** `package.json` (add `@supabase/ssr`).

---

## Task 1: Install `@supabase/ssr` + browser/server clients

**Files:**
- Modify: `package.json`
- Create: `lib/supabase/client.ts`, `lib/supabase/server.ts`

- [ ] **Step 1: Create the branch and install**

```bash
cd /home/pgw/projects/ava-web
git checkout -b phase-1b-i/auth-gating
npm install @supabase/ssr@^0.10.3
```

- [ ] **Step 2: Write `lib/supabase/client.ts`**

```ts
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

- [ ] **Step 3: Write `lib/supabase/server.ts`**

```ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component; safe to ignore when proxy refreshes sessions.
          }
        },
      },
    },
  );
}
```

- [ ] **Step 4: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json lib/supabase/client.ts lib/supabase/server.ts
git commit -m "phase-1: add @supabase/ssr browser + server clients

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: US states + geo helpers (pure)

**Files:**
- Create: `lib/auth/states.ts`, `lib/auth/geo.ts`
- Test: `test/auth/geo.test.ts`

- [ ] **Step 1: Write the failing test**

`test/auth/geo.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { isBlockedState, stateFromGeoHeader } from '@/lib/auth/geo';
import { US_STATES, BLOCKED_STATES } from '@/lib/auth/states';

describe('isBlockedState', () => {
  it('blocks CA and NY (case-insensitive)', () => {
    expect(isBlockedState('CA')).toBe(true);
    expect(isBlockedState('ny')).toBe(true);
  });
  it('allows other states and empty input', () => {
    expect(isBlockedState('TX')).toBe(false);
    expect(isBlockedState('')).toBe(false);
    expect(isBlockedState(null)).toBe(false);
    expect(isBlockedState(undefined)).toBe(false);
  });
});

describe('stateFromGeoHeader', () => {
  it('reads a 2-letter region and a US-XX form', () => {
    expect(stateFromGeoHeader('CA')).toBe('CA');
    expect(stateFromGeoHeader('US-NY')).toBe('NY');
  });
  it('returns null for missing/garbage', () => {
    expect(stateFromGeoHeader(null)).toBeNull();
    expect(stateFromGeoHeader('')).toBeNull();
    expect(stateFromGeoHeader('???')).toBeNull();
  });
});

describe('states data', () => {
  it('has 51 entries (50 states + DC) and CA/NY are blocked', () => {
    expect(US_STATES).toHaveLength(51);
    expect(BLOCKED_STATES.has('CA')).toBe(true);
    expect(BLOCKED_STATES.has('NY')).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run test/auth/geo.test.ts`
Expected: FAIL — cannot resolve modules.

- [ ] **Step 3: Write `lib/auth/states.ts`**

```ts
const RAW_BLOCK = process.env.GEO_BLOCK_STATES ?? 'CA,NY';
export const BLOCKED_STATES = new Set(
  RAW_BLOCK.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean),
);

export const US_STATES: { code: string; name: string }[] = [
  { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' }, { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' },
  { code: 'DC', name: 'District of Columbia' }, { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' }, { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' }, { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' }, { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' }, { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' }, { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' }, { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' }, { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' }, { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' }, { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' }, { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' }, { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' }, { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' }, { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' }, { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' }, { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' }, { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' }, { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' }, { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' }, { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' }, { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
];
```

- [ ] **Step 4: Write `lib/auth/geo.ts`**

```ts
import { BLOCKED_STATES } from './states';

export function isBlockedState(state: string | null | undefined): boolean {
  if (!state) return false;
  return BLOCKED_STATES.has(state.toUpperCase());
}

/** Platform geo header (e.g. Vercel `x-vercel-ip-country-region` = "CA", or "US-CA"). */
export function stateFromGeoHeader(header: string | null | undefined): string | null {
  if (!header) return null;
  const m = header.trim().toUpperCase().match(/([A-Z]{2})$/);
  return m ? m[1] : null;
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run test/auth/geo.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/auth/states.ts lib/auth/geo.ts test/auth/geo.test.ts
git commit -m "phase-1: US states + geo-block helpers

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: `gateDecision` (pure)

**Files:**
- Create: `lib/auth/gate.ts`
- Test: `test/auth/gate.test.ts`

- [ ] **Step 1: Write the failing test**

`test/auth/gate.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { gateDecision } from '@/lib/auth/gate';

const base = { hasSession: false, disclosureAccepted: false, geoState: null as string | null };

describe('gateDecision', () => {
  it('blocks a CA/NY geo first, even with a full session', () => {
    expect(gateDecision({ hasSession: true, disclosureAccepted: true, geoState: 'CA' })).toBe('/unavailable');
  });
  it('redirects to sign-in when there is no session', () => {
    expect(gateDecision({ ...base })).toBe('/sign-in');
  });
  it('redirects to disclosure when signed in but not accepted', () => {
    expect(gateDecision({ hasSession: true, disclosureAccepted: false, geoState: null })).toBe('/disclosure');
  });
  it('allows a signed-in, accepted, non-blocked user', () => {
    expect(gateDecision({ hasSession: true, disclosureAccepted: true, geoState: 'TX' })).toBe('allow');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run test/auth/gate.test.ts`
Expected: FAIL — cannot resolve `@/lib/auth/gate`.

- [ ] **Step 3: Write `lib/auth/gate.ts`**

```ts
import { isBlockedState } from './geo';

export interface GateInput {
  hasSession: boolean;
  disclosureAccepted: boolean;
  geoState: string | null;
}

export type GateResult = 'allow' | '/sign-in' | '/disclosure' | '/unavailable';

export function gateDecision(input: GateInput): GateResult {
  if (isBlockedState(input.geoState)) return '/unavailable';
  if (!input.hasSession) return '/sign-in';
  if (!input.disclosureAccepted) return '/disclosure';
  return 'allow';
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run test/auth/gate.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/auth/gate.ts test/auth/gate.test.ts
git commit -m "phase-1: gateDecision (geo -> session -> disclosure -> allow)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: Auth input validation (pure)

**Files:**
- Create: `lib/auth/validate.ts`
- Test: `test/auth/validate.test.ts`

- [ ] **Step 1: Write the failing test**

`test/auth/validate.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { parseCredentials, parseSignUp } from '@/lib/auth/validate';

describe('parseCredentials', () => {
  it('accepts a valid email + password', () => {
    expect(parseCredentials({ email: 'a@b.com', password: 'longenough' }).ok).toBe(true);
  });
  it.each<[string, unknown]>([
    ['bad email', { email: 'nope', password: 'longenough' }],
    ['short password', { email: 'a@b.com', password: 'short' }],
  ])('rejects %s', (_label, input) => {
    expect(parseCredentials(input).ok).toBe(false);
  });
});

describe('parseSignUp', () => {
  it('requires a 2-letter state code', () => {
    expect(parseSignUp({ email: 'a@b.com', password: 'longenough', stateCode: 'TX' }).ok).toBe(true);
    expect(parseSignUp({ email: 'a@b.com', password: 'longenough', stateCode: '' }).ok).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run test/auth/validate.test.ts`
Expected: FAIL — cannot resolve `@/lib/auth/validate`.

- [ ] **Step 3: Write `lib/auth/validate.ts`**

```ts
import { z } from 'zod';

export const credentialsSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(72), // bcrypt input cap
});

export const signUpSchema = credentialsSchema.extend({
  stateCode: z.string().length(2),
});

export type ParseResult<T> = { ok: true; value: T } | { ok: false; error: string };

function parse<T>(schema: z.ZodType<T>, input: unknown): ParseResult<T> {
  const r = schema.safeParse(input);
  return r.success
    ? { ok: true, value: r.data }
    : { ok: false, error: r.error.issues[0]?.message ?? 'Invalid input.' };
}

export function parseCredentials(input: unknown) {
  return parse(credentialsSchema, input);
}

export function parseSignUp(input: unknown) {
  return parse(signUpSchema, input);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run test/auth/validate.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/auth/validate.ts test/auth/validate.test.ts
git commit -m "phase-1: auth credential + sign-up validation

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: `users` migration (apply via Supabase MCP)

**Files:**
- Create: `supabase/migrations/0002_users.sql`

Apply to dev project `withava` (`kwmitrnypadzuqueefxi`) via the Supabase MCP. Follows the `supabase`
skill RLS rules: `TO authenticated` + ownership predicate; UPDATE needs `USING` + `WITH CHECK`; the
trigger is `SECURITY DEFINER` with a pinned empty `search_path`, and its public `EXECUTE` is revoked
(trigger still fires).

- [ ] **Step 1: Write the migration**

`supabase/migrations/0002_users.sql`:

```sql
-- Profile row extending auth.users. RLS owner-only.
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  state_code text,
  created_at timestamptz not null default now(),
  ai_disclosure_accepted_at timestamptz
);

alter table public.users enable row level security;

create policy "users_select_own" on public.users
  for select to authenticated
  using ((select auth.uid()) = id);

create policy "users_update_own" on public.users
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Auto-create the profile on sign-up. state_code comes from sign-up metadata
-- (self-reported; never used for an authorization decision).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.users (id, email, state_code)
  values (new.id, new.email, new.raw_user_meta_data ->> 'state_code');
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

- [ ] **Step 2: Apply via the Supabase MCP**

Use MCP `apply_migration` (name `0002_users`, project `kwmitrnypadzuqueefxi`) with the SQL above.
Expected: `{"success": true}`.

- [ ] **Step 3: Verify RLS + advisors**

Via MCP `execute_sql`:
```sql
select relrowsecurity from pg_class where relname = 'users' and relnamespace = 'public'::regnamespace;
select polname, cmd from pg_policies where tablename = 'users';
```
Expected: `relrowsecurity = true`; two policies (`users_select_own` SELECT, `users_update_own` UPDATE).

Run MCP `get_advisors` (type `security`). Expected: no new WARN for `handle_new_user` (execute was
revoked); the `rls_enabled_no_policy` INFO should NOT apply to `users` (it has policies).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0002_users.sql
git commit -m "phase-1: users profile table (RLS owner-only + sign-up trigger)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: `proxy.ts` — session refresh + gate

**Files:**
- Create: `lib/supabase/proxy.ts`, `proxy.ts` (root)

No unit test (it's Supabase/Next glue; the gate logic is already tested in Task 3, and it is
live-verified in Task 12). Typecheck + build only.

- [ ] **Step 1: Write `lib/supabase/proxy.ts`**

```ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { gateDecision } from '@/lib/auth/gate';
import { stateFromGeoHeader } from '@/lib/auth/geo';

// Routes the gate guards. The public landing, the auth pages, and the geo page are exempt.
const GATED_PREFIXES = ['/home'];

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: keep getUser() right after client creation (refreshes the session cookie).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isGated = GATED_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
  if (!isGated) return response;

  const geoState = stateFromGeoHeader(request.headers.get('x-vercel-ip-country-region'));

  let disclosureAccepted = false;
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('ai_disclosure_accepted_at')
      .eq('id', user.id)
      .maybeSingle();
    disclosureAccepted = Boolean(profile?.ai_disclosure_accepted_at);
  }

  const decision = gateDecision({ hasSession: Boolean(user), disclosureAccepted, geoState });
  if (decision !== 'allow') {
    const url = request.nextUrl.clone();
    url.pathname = decision;
    return NextResponse.redirect(url);
  }
  return response;
}
```

- [ ] **Step 2: Write `proxy.ts` (root)**

```ts
import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/proxy';

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
```

- [ ] **Step 3: Verify typecheck + build**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npm run build`
Expected: build succeeds and recognizes the proxy (no "invalid middleware/proxy" error). If Next
reports the entrypoint must be `middleware.ts`, rename `proxy.ts` → `middleware.ts` and the function
`proxy` → `middleware` (both filenames are defined in Next 16; `proxy` is the newer name).

- [ ] **Step 4: Commit**

```bash
git add lib/supabase/proxy.ts proxy.ts
git commit -m "phase-1: proxy — refresh session + apply gate on /home

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 7: StateSelect + SignUpForm

**Files:**
- Create: `components/auth/StateSelect.tsx`, `components/auth/SignUpForm.tsx`
- Test: `test/auth/sign-up-form.test.tsx`

- [ ] **Step 1: Write the failing test**

`test/auth/sign-up-form.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const signUp = vi.fn();
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ auth: { signUp } }),
}));

import { SignUpForm } from '@/components/auth/SignUpForm';

describe('SignUpForm', () => {
  beforeEach(() => signUp.mockReset());

  it('blocks a CA sign-up before calling Supabase', () => {
    render(<SignUpForm />);
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'longenough' } });
    fireEvent.change(screen.getByLabelText(/state/i), { target: { value: 'CA' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    expect(screen.getByText(/not available in your state/i)).toBeInTheDocument();
    expect(signUp).not.toHaveBeenCalled();
  });

  it('calls Supabase signUp with state metadata for an allowed state', async () => {
    signUp.mockResolvedValue({ data: {}, error: null });
    render(<SignUpForm />);
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'longenough' } });
    fireEvent.change(screen.getByLabelText(/state/i), { target: { value: 'TX' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => expect(signUp).toHaveBeenCalled());
    expect(signUp.mock.calls[0][0].options.data.state_code).toBe('TX');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run test/auth/sign-up-form.test.tsx`
Expected: FAIL — cannot resolve `@/components/auth/SignUpForm`.

- [ ] **Step 3: Write `components/auth/StateSelect.tsx`**

```tsx
import { US_STATES } from '@/lib/auth/states';

export function StateSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select
      aria-label="State"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-[var(--fg)]/15 bg-white/70 px-4 py-3 text-[var(--fg)]"
    >
      <option value="">Select your state</option>
      {US_STATES.map((s) => (
        <option key={s.code} value={s.code}>
          {s.name}
        </option>
      ))}
    </select>
  );
}
```

- [ ] **Step 4: Write `components/auth/SignUpForm.tsx`**

```tsx
'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { parseSignUp } from '@/lib/auth/validate';
import { isBlockedState } from '@/lib/auth/geo';
import { StateSelect } from './StateSelect';

export function SignUpForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [stateCode, setStateCode] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError('');
    if (isBlockedState(stateCode)) {
      setError('Ava is not available in your state yet.');
      return;
    }
    const parsed = parseSignUp({ email, password, stateCode });
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }
    const supabase = createClient();
    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { state_code: stateCode },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (err) {
      setError(err.message);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return <p className="font-medium text-[var(--accent)]">Check your email to confirm your account.</p>;
  }

  return (
    <form onSubmit={submit} noValidate className="flex w-full max-w-sm flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        Email
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
          className="rounded-lg border border-[var(--fg)]/15 bg-white/70 px-4 py-3" />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Password
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
          className="rounded-lg border border-[var(--fg)]/15 bg-white/70 px-4 py-3" />
      </label>
      <StateSelect value={stateCode} onChange={setStateCode} />
      <button type="submit" className="rounded-full bg-[var(--accent)] px-6 py-3 font-semibold text-white">
        Create account
      </button>
      {error && <p className="text-sm text-[var(--tier-flagged)]">{error}</p>}
    </form>
  );
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run test/auth/sign-up-form.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add components/auth/StateSelect.tsx components/auth/SignUpForm.tsx test/auth/sign-up-form.test.tsx
git commit -m "phase-1: sign-up form (email/password + state, CA/NY blocked)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 8: SignInForm + GoogleButton

**Files:**
- Create: `components/auth/GoogleButton.tsx`, `components/auth/SignInForm.tsx`
- Test: `test/auth/sign-in-form.test.tsx`

- [ ] **Step 1: Write the failing test**

`test/auth/sign-in-form.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const signInWithPassword = vi.fn();
const signInWithOAuth = vi.fn();
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ auth: { signInWithPassword, signInWithOAuth } }),
}));

import { SignInForm } from '@/components/auth/SignInForm';

describe('SignInForm', () => {
  beforeEach(() => {
    signInWithPassword.mockReset();
    signInWithOAuth.mockReset();
  });

  it('signs in with email + password', async () => {
    signInWithPassword.mockResolvedValue({ error: null });
    render(<SignInForm />);
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'longenough' } });
    fireEvent.click(screen.getByRole('button', { name: /^sign in$/i }));
    await waitFor(() => expect(signInWithPassword).toHaveBeenCalledWith({ email: 'a@b.com', password: 'longenough' }));
  });

  it('shows an error on bad credentials', async () => {
    signInWithPassword.mockResolvedValue({ error: { message: 'Invalid login credentials' } });
    render(<SignInForm />);
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'longenough' } });
    fireEvent.click(screen.getByRole('button', { name: /^sign in$/i }));
    await waitFor(() => expect(screen.getByText(/invalid login credentials/i)).toBeInTheDocument());
  });

  it('starts Google OAuth', () => {
    render(<SignInForm />);
    fireEvent.click(screen.getByRole('button', { name: /continue with google/i }));
    expect(signInWithOAuth).toHaveBeenCalledWith(
      expect.objectContaining({ provider: 'google' }),
    );
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run test/auth/sign-in-form.test.tsx`
Expected: FAIL — cannot resolve `@/components/auth/SignInForm`.

- [ ] **Step 3: Write `components/auth/GoogleButton.tsx`**

```tsx
'use client';
import { createClient } from '@/lib/supabase/client';

export function GoogleButton() {
  function go(): void {
    const supabase = createClient();
    void supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }
  return (
    <button
      type="button"
      onClick={go}
      className="rounded-full border border-[var(--fg)]/15 bg-white px-6 py-3 font-semibold text-[var(--fg)]"
    >
      Continue with Google
    </button>
  );
}
```

- [ ] **Step 4: Write `components/auth/SignInForm.tsx`**

```tsx
'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { GoogleButton } from './GoogleButton';

export function SignInForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError('');
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) {
      setError(err.message);
      return;
    }
    window.location.assign('/home');
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <form onSubmit={submit} noValidate className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border border-[var(--fg)]/15 bg-white/70 px-4 py-3" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border border-[var(--fg)]/15 bg-white/70 px-4 py-3" />
        </label>
        <button type="submit" className="rounded-full bg-[var(--accent)] px-6 py-3 font-semibold text-white">
          Sign in
        </button>
        {error && <p className="text-sm text-[var(--tier-flagged)]">{error}</p>}
      </form>
      <GoogleButton />
    </div>
  );
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run test/auth/sign-in-form.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add components/auth/GoogleButton.tsx components/auth/SignInForm.tsx test/auth/sign-in-form.test.tsx
git commit -m "phase-1: sign-in form + Google button

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 9: Auth callback + signout routes

**Files:**
- Create: `app/auth/callback/route.ts`, `app/auth/signout/route.ts`

No unit test (Supabase glue; live-verified in Task 12). Typecheck only.

- [ ] **Step 1: Write `app/auth/callback/route.ts`**

```ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }
  return NextResponse.redirect(new URL('/home', url.origin));
}
```

- [ ] **Step 2: Write `app/auth/signout/route.ts`**

```ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request): Promise<Response> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL('/', new URL(request.url).origin), { status: 303 });
}
```

- [ ] **Step 3: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/auth/callback/route.ts app/auth/signout/route.ts
git commit -m "phase-1: auth callback (code exchange) + signout routes

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 10: Disclosure gate (page + form + accept route)

**Files:**
- Create: `components/auth/DisclosureForm.tsx`, `app/disclosure/page.tsx`, `app/disclosure/accept/route.ts`
- Test: `test/auth/disclosure-form.test.tsx`

- [ ] **Step 1: Write the failing test**

`test/auth/disclosure-form.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DisclosureForm } from '@/components/auth/DisclosureForm';

describe('DisclosureForm', () => {
  it('disables submit until the box is checked', () => {
    render(<DisclosureForm />);
    const submit = screen.getByRole('button', { name: /agree and continue/i });
    expect(submit).toBeDisabled();
    fireEvent.click(screen.getByRole('checkbox'));
    expect(submit).not.toBeDisabled();
  });

  it('states it is AI and not medical advice', () => {
    render(<DisclosureForm />);
    expect(screen.getByText(/not medical advice/i)).toBeInTheDocument();
    // "AI" appears in both the paragraph and the checkbox label.
    expect(screen.getAllByText(/\bAI\b/).length).toBeGreaterThanOrEqual(1);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run test/auth/disclosure-form.test.tsx`
Expected: FAIL — cannot resolve `@/components/auth/DisclosureForm`.

- [ ] **Step 3: Write `components/auth/DisclosureForm.tsx`**

```tsx
'use client';
import { useState } from 'react';

export function DisclosureForm() {
  const [accepted, setAccepted] = useState(false);
  return (
    <form action="/disclosure/accept" method="post" className="flex max-w-md flex-col gap-4">
      <p className="text-[var(--fg)]/80">
        Ava is an AI companion — not a human and not medical advice. It shares wellness indicators, not
        a medical assessment. In a crisis, call or text 988, or 911.
      </p>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
        I understand Ava is an AI wellness companion and not medical advice.
      </label>
      <button
        type="submit"
        disabled={!accepted}
        className="rounded-full bg-[var(--accent)] px-6 py-3 font-semibold text-white disabled:opacity-60"
      >
        Agree and continue
      </button>
    </form>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run test/auth/disclosure-form.test.tsx`
Expected: PASS.

- [ ] **Step 5: Write `app/disclosure/page.tsx`**

```tsx
import { DisclosureForm } from '@/components/auth/DisclosureForm';

export default function DisclosurePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-6 px-6">
      <h1 className="text-2xl font-semibold">Before you start</h1>
      <DisclosureForm />
    </main>
  );
}
```

- [ ] **Step 6: Write `app/disclosure/accept/route.ts`**

```ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request): Promise<Response> {
  const origin = new URL(request.url).origin;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL('/sign-in', origin), { status: 303 });
  }
  await supabase
    .from('users')
    .update({ ai_disclosure_accepted_at: new Date().toISOString() })
    .eq('id', user.id);
  return NextResponse.redirect(new URL('/home', origin), { status: 303 });
}
```

- [ ] **Step 7: Run the disclosure test + typecheck**

Run: `npx vitest run test/auth/disclosure-form.test.tsx`
Expected: PASS.

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add components/auth/DisclosureForm.tsx app/disclosure test/auth/disclosure-form.test.tsx
git commit -m "phase-1: AI-disclosure gate (Layer 5) — checkbox + accept route

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 11: Pages — sign-in, sign-up, unavailable, authed /home + full verify

**Files:**
- Create: `app/(auth)/sign-in/page.tsx`, `app/(auth)/sign-up/page.tsx`, `app/unavailable/page.tsx`, `app/(app)/layout.tsx`, `app/(app)/home/page.tsx`

- [ ] **Step 1: Write the auth pages**

`app/(auth)/sign-in/page.tsx`:

```tsx
import Link from 'next/link';
import { SignInForm } from '@/components/auth/SignInForm';

export default function SignInPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-6">
      <h1 className="text-2xl font-semibold">Welcome back</h1>
      <SignInForm />
      <p className="text-sm text-[var(--fg)]/60">
        New here? <Link href="/sign-up" className="text-[var(--accent)]">Create an account</Link>
      </p>
    </main>
  );
}
```

`app/(auth)/sign-up/page.tsx`:

```tsx
import Link from 'next/link';
import { SignUpForm } from '@/components/auth/SignUpForm';

export default function SignUpPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-6">
      <h1 className="text-2xl font-semibold">Create your account</h1>
      <SignUpForm />
      <p className="text-sm text-[var(--fg)]/60">
        Already have one? <Link href="/sign-in" className="text-[var(--accent)]">Sign in</Link>
      </p>
    </main>
  );
}
```

- [ ] **Step 2: Write `app/unavailable/page.tsx`**

```tsx
export default function UnavailablePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold">Not available in your state yet</h1>
      <p className="text-[var(--fg)]/70">
        Ava isn&apos;t available in your state right now. We&apos;ll let you know when that changes.
      </p>
    </main>
  );
}
```

- [ ] **Step 3: Write the authed area `app/(app)/layout.tsx` (server-side gate)**

```tsx
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { gateDecision } from '@/lib/auth/gate';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let disclosureAccepted = false;
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('ai_disclosure_accepted_at')
      .eq('id', user.id)
      .maybeSingle();
    disclosureAccepted = Boolean(profile?.ai_disclosure_accepted_at);
  }

  // geoState is null here (server components don't see the geo header); proxy.ts covers geo.
  const decision = gateDecision({ hasSession: Boolean(user), disclosureAccepted, geoState: null });
  if (decision !== 'allow') redirect(decision);

  return <>{children}</>;
}
```

- [ ] **Step 4: Write `app/(app)/home/page.tsx`**

```tsx
export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-6 px-6">
      <h1 className="text-3xl font-semibold">You&apos;re in.</h1>
      <p className="text-[var(--fg)]/70">
        Your wellness check-in is coming soon. We&apos;ll bring your radar here once it&apos;s ready.
      </p>
      <form action="/auth/signout" method="post">
        <button type="submit" className="rounded-full border border-[var(--fg)]/15 px-5 py-2 text-sm">
          Sign out
        </button>
      </form>
    </main>
  );
}
```

- [ ] **Step 5: Full suite, lint, build**

Run: `npm run test`
Expected: PASS — all auth pure + component tests plus prior suites.

Run: `npm run lint`
Expected: clean.

Run: `npm run build`
Expected: succeeds; routes include `/sign-in`, `/sign-up`, `/disclosure`, `/unavailable`, `/home`,
`/auth/callback`, `/auth/signout`, `/disclosure/accept`.

- [ ] **Step 6: Commit**

```bash
git add "app/(auth)" "app/(app)" app/unavailable
git commit -m "phase-1: auth pages + geo page + gated authed home

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 12: Live verification (GATED on Google OAuth + email)

**Prereqs (you do these):**
1. **Supabase → Authentication → Providers → Email:** "Confirm email" ON (default).
2. **Google OAuth:** create an OAuth client in Google Cloud Console (Authorized redirect URI:
   `https://kwmitrnypadzuqueefxi.supabase.co/auth/v1/callback`). In Supabase → Authentication →
   Providers → Google, paste the Client ID + Secret and enable it.
3. **Supabase → Authentication → URL Configuration:** add `http://localhost:3000/auth/callback` to
   the redirect allowlist; Site URL `http://localhost:3000`.

- [ ] **Step 1: Start the dev server**

Run (background, sandbox disabled — see the dev-server gotcha): `npm run dev`
Expected: Ready; `.env.local` loaded.

- [ ] **Step 2: Email/password sign-up + gate**

Open `http://localhost:3000/sign-up`, register with a real email + a non-CA/NY state. Expect "Check
your email." Confirm via the email link → lands on `/home` after disclosure, OR is redirected to
`/disclosure` first; accept → `/home`.
Then via MCP `execute_sql` (project `kwmitrnypadzuqueefxi`):
```sql
select email, state_code, ai_disclosure_accepted_at from public.users order by created_at desc limit 3;
```
Expected: the new user row exists with the chosen `state_code` and a non-null `ai_disclosure_accepted_at`
after acceptance.

- [ ] **Step 3: Geo-block path**

Sign up (or in) selecting **California** → expect the form shows "not available in your state" and no
Supabase call (self-reported block). Confirm no CA row was created.

- [ ] **Step 4: Gate redirects**

While signed out, visit `http://localhost:3000/home` → redirected to `/sign-in`. While signed in but
before accepting disclosure, `/home` → `/disclosure`.

- [ ] **Step 5: Google sign-in**

Click "Continue with Google" → complete OAuth → returns to `/auth/callback` → `/home` (after
disclosure). Confirm a `users` row was created for the Google account.

- [ ] **Step 6: Clean up test users (optional)**

Via MCP `execute_sql`, delete test rows from `public.users` (auth.users cascade) or leave them in dev.

- [ ] **Step 7: Re-run advisors**

MCP `get_advisors` (security). Expected: no new findings beyond the intended INFOs.

---

## Done criteria (Slice 1B-i)

- [ ] `npm run test`, `npm run lint`, `npm run build` green.
- [ ] `gateDecision`/`geo`/`validate` unit-tested; sign-in/up/disclosure forms component-tested.
- [ ] `users` table live with RLS owner-only + sign-up trigger; advisors clean.
- [ ] Live: email/password sign-up→confirm→home; Google sign-in; CA/NY blocked; gate redirects work.
- [ ] Public landing `/` still reachable without auth.

## Deferred to 1B-ii (explicit)

The 🔒 health tables + `credit_ledger` + `compliance_log` + RLS + field encryption, and wiring the
safeguard pipeline's injected `log` to the real `compliance_log` writer (incl. the disclosure-accepted
audit event).
