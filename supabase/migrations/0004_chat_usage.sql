-- Per-user, per-day free chat counter. Read-own; written only via the bump function.
create table if not exists public.chat_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null default (now() at time zone 'utc')::date,
  count integer not null default 0,
  primary key (user_id, day)
);
alter table public.chat_usage enable row level security;
create policy "chat_usage_select_own" on public.chat_usage
  for select to authenticated using ((select auth.uid()) = user_id);

-- Atomic increment, returns the new count for today. Service-role only.
create or replace function public.bump_chat_usage(p_user uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_count integer;
begin
  insert into public.chat_usage (user_id, day, count)
  values (p_user, (now() at time zone 'utc')::date, 1)
  on conflict (user_id, day) do update set count = public.chat_usage.count + 1
  returning count into new_count;
  return new_count;
end;
$$;

revoke execute on function public.bump_chat_usage(uuid) from public, anon, authenticated;
