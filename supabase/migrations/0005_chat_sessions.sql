-- One row per chat check-in. Owner-managed via the user's RLS-scoped client.
create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'ended')),
  started_at timestamptz not null default now(),
  ended_at timestamptz
);
alter table public.chat_sessions enable row level security;
create policy "chat_sessions_select_own" on public.chat_sessions
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "chat_sessions_insert_own" on public.chat_sessions
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "chat_sessions_update_own" on public.chat_sessions
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Link the existing health tables to a session.
alter table public.health_scores
  add column if not exists session_id uuid references public.chat_sessions (id) on delete cascade;
-- One score snapshot per session (enables the per-turn upsert on conflict (session_id)).
create unique index if not exists health_scores_session_id_key on public.health_scores (session_id);
-- health_scores previously had only select+insert; the per-turn upsert needs an owner UPDATE policy.
create policy "health_scores_update_own" on public.health_scores
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

alter table public.session_summaries
  add column if not exists session_id uuid references public.chat_sessions (id) on delete cascade;
