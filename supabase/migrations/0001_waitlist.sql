-- Waitlist for the Ava landing email capture.
create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source text,
  created_at timestamptz not null default now()
);

-- RLS on, with NO anon/public policies: inserts happen server-side via the
-- service role only (which bypasses RLS). The anon key can neither read nor write.
alter table public.waitlist enable row level security;
