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
