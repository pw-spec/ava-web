-- Prepaid credits as a tracked LIABILITY. Grants are written only by the service role (the Stripe
-- webhook); a user may read their own ledger but never mint credits. Balance = sum(delta).
create table if not exists public.credit_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  delta integer not null,                                   -- + grant, − consume/expire/refund (whole credits)
  reason text not null,                                     -- e.g. purchase:wellness_profile
  unit_price_cents integer not null default 0,              -- cash paid per credit this grant (refund/liability math)
  expires_at timestamptz,                                   -- grants only; null for consume/expire/refund
  stripe_event_id text unique,                              -- idempotency: a webhook retry hits 23505 → no-op
  created_at timestamptz not null default now()
);
alter table public.credit_ledger enable row level security;
create policy "credit_ledger_select_own" on public.credit_ledger
  for select to authenticated using ((select auth.uid()) = user_id);
-- no insert/update/delete policy: only the service role writes grants.
create index if not exists credit_ledger_user_idx on public.credit_ledger (user_id);

-- Paid PRIVATE-profile artifact + purchase entitlement. Owner-readable; service-role writes only.
-- The report is the private profile (encrypted, in-account only) — never the shareable brag card.
create table if not exists public.wellness_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  session_id uuid,                                          -- which check-in the report reads
  stripe_checkout_id text unique,                           -- ties the unlock to the payment; idempotent upsert
  status text not null,                                     -- paid → ready
  report text,                                              -- encrypted (v1:) written read; null until ready
  created_at timestamptz not null default now()
);
alter table public.wellness_profiles enable row level security;
create policy "wellness_profiles_select_own" on public.wellness_profiles
  for select to authenticated using ((select auth.uid()) = user_id);
-- no insert/update/delete policy: service-role writes only.
create index if not exists wellness_profiles_user_idx on public.wellness_profiles (user_id, created_at desc);
