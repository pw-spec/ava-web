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
