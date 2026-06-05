-- Public, NON-SENSITIVE brag-card snapshot. Service-role only (RLS on, 0 policies — same as waitlist):
-- /api/share writes via the admin client; the public /share/[token] page reads one row by token via admin.
create table if not exists public.share_cards (
  token text primary key,                                   -- unguessable, url-safe
  user_id uuid not null references auth.users (id) on delete cascade,
  overall integer,                                          -- snapshot; non-diagnostic public metric
  silhouette jsonb not null,                                -- 6 normalized values, ANONYMIZED order (shape only)
  display_name text,                                        -- optional first name; null = anonymous
  created_at timestamptz not null default now()
);
alter table public.share_cards enable row level security;
-- intentionally no policies: RLS-on + 0 policies = service-role-only access.
