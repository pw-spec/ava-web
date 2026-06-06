# Phase 1C-c (brag card) — Day-One Shareable Card — Design

**Date:** 2026-06-04
**Phase:** 1 (Ava MVP) — Slice 1C-c, part 1 of the funnel-close (the brag card)
**Status:** Approved for planning

## Context

1C-b made Ava a real chat with a live radar + memory. 1C-c is the funnel close: the **Gap reveal**, the
**Decision CTA**, and the **day-one brag card**. We are building the **brag card first** — it's the cleanest
standalone (fully shippable, no Stripe, viral, and it makes the compliance-critical "two artifacts never
merged" rule real). The Gap reveal + Decision CTA come after (the CTA's purchase is blocked on Stripe = 1D).

The brag card is the **shareable** artifact (PRODUCT-SPEC §Profile Artifacts): *sensitive data stripped*,
"show off." It is NOT the private profile (full radar + Sonnet report; in-account, RLS-protected, never
reachable by the share path). **The two artifacts never merge.**

## The decision recap (from brainstorming)

- **Composition A — "Player + card"** (a video hero slot on top, then the overall number beside an unlabeled
  silhouette, then "got my baseline" + CTA). Composition **B (poster)** + the real templated Ava clip are
  **deferred** (see Deferred + the `brag-card-poster-variant` memory) — they depend on the avatar foundation
  (HeyGen / Phase 1F) which isn't built.
- The video slot ships a **branded placeholder** now; the templated Ava clip drops into the same slot later
  with no rework. (Rule 3: the avatar is never per-user-generated and never shown to anonymous traffic — a
  public share page is anonymous traffic, so the future clip is a *templated render*, behind GATE-1 legal.)
- Mechanism: a public **share page** `/share/[token]` + a `next/og` preview image. Content: overall number +
  **unlabeled** silhouette + "got my baseline with Ava" + a quiet CTA. **No tier label.** Name optional.

## Scope

**In scope**
- Migration `0006_share_cards` — a standalone, **non-sensitive** snapshot table (RLS on, **zero policies =
  service-role-only**, like `waitlist`).
- `lib/share/card.ts#buildShareCard(client, userId)` — the **single** server-side assembler of the stripped
  card: reads the user's latest scores (their RLS client; decrypts), emits **only** `{ overall, silhouette }`
  where `silhouette` is the 6 normalized axis values **shuffled into an anonymized order** (shape preserved,
  axis identity destroyed). Never per-axis labels, never the private record.
- `app/api/share/route.ts` — authed + gated POST; builds the card, generates an unguessable token, inserts the
  `share_cards` row (admin client), returns `{ token, url }`.
- `app/share/[token]/page.tsx` — **public** (no gate) page rendering composition A from the stripped row;
  `app/share/[token]/opengraph-image.tsx` (`next/og`) — the still preview; `generateMetadata` wires OG tags.
- `components/share/ShareCard.tsx` — presentational composition A (video hero placeholder + number +
  silhouette + copy + CTA), reused by the page.
- The **"Share my baseline"** trigger in the chat (radar drawer) → `/api/share` → link + copy / native share.
- Unit/component tests + a live render check.

**Out of scope (later / deferred)**
- The **Poster (B)** composition + the **real templated Ava clip** → avatar foundation (≈1F) — see memory.
- The **Gap reveal + Decision CTA** (the rest of the 1C-c funnel) — and the CTA's purchase (Stripe = 1D).
- The **progress card** (delta-led, Phase 2 priority shareable).
- A name-input UI (the API accepts an optional `displayName`; the in-app field is a fast-follow — ships
  anonymous by default).
- Card revocation / "my shared cards" management.

## Architecture & data flow

```
RadarDrawer "Share my baseline" (shown only when overall !== null)
   └─ POST /api/share { displayName? }            (authed)
        getUser → 401 ; full gate → 403
        card = buildShareCard(supabase /*user RLS client*/, user.id)   // { overall, silhouette }
          └─ if card.overall === null → 400 "finish a check-in first"
        token = generateShareToken()               // crypto-random, url-safe
        adminClient.insert share_cards { token, user_id, overall, silhouette, display_name }
        ◀── { token, url: `${APP_URL}/share/${token}` }
   client: reveal the link + copy button + navigator.share

/share/<token>   (PUBLIC server component — NO gate)
   adminClient.select share_cards where token = <token>   // one stripped row, or notFound() → 404
   render <ShareCard overall silhouette displayName /> (video hero = placeholder; clipUrl slot for later)
   + /share/<token>/opengraph-image  (ImageResponse still)  → rich link previews
```

The card's per-axis scores never leave the server: `buildShareCard` is the only assembler and emits only
`{overall, silhouette}`; the private-profile path is entirely separate code. The public page reads a row that
**contains no 🔒/encrypted/labeled field** — sensitive data structurally cannot reach it.

## Data model — migration `0006_share_cards`

```sql
create table public.share_cards (
  token text primary key,                                   -- unguessable, url-safe
  user_id uuid not null references auth.users (id) on delete cascade,
  overall integer,                                          -- snapshot (non-diagnostic, public per DATA-MODEL)
  silhouette jsonb not null,                                -- 6 normalized values, ANONYMIZED order (shape only)
  display_name text,                                        -- optional first name; null = anonymous
  created_at timestamptz not null default now()
);
alter table public.share_cards enable row level security;
-- No policies: RLS-on + 0 policies = service-role-only (same hardening as waitlist/compliance_log).
-- /api/share writes via the admin client; the public page reads one row by token via the admin client.
```

`silhouette` holds **no axis labels and an anonymized order**, so even the raw row can't be mapped to "which
axis is low." `overall` is the only score value, and it is explicitly the public metric (PRODUCT-SPEC /
DATA-MODEL). Cascade-deletes on user delete (wind-down). Applied via the Supabase MCP; advisors re-checked
(expect the intended `rls_enabled_no_policy` INFO, like `waitlist`).

## `buildShareCard` (the single assembler)

```
buildShareCard(client, userId): Promise<{ overall: number | null; silhouette: number[] }>
```
- `getLatestHealthScores(client, userId)` → `{ axes, overall } | null`. If null → `{ overall: null, silhouette: [] }`
  (the route turns this into a 400).
- `silhouette = shufflePermutation(scoresToValues(axes))` — `scoresToValues` (existing radar geometry) yields
  the 6 values in AXES order with `null→0`; a **crypto-random permutation** (`node:crypto`) then anonymizes the
  order. The result is a length-6 `number[]` of shape values, with no axis identity.
- Returns **only** `{ overall, silhouette }`. Server-only. This module is the sole place the card is assembled;
  it imports nothing from the private-profile/report path.

## Share page + OG image

- `app/share/[token]/page.tsx` — public server component: `getSupabaseAdmin().from('share_cards').select(...).eq('token', token).maybeSingle()`;
  null → `notFound()` (404). Renders `<ShareCard overall silhouette displayName />`. No auth, no gate (the row
  is non-sensitive). `generateMetadata` sets `title`/`description` + `og:image` → the dynamic OG route.
- `app/share/[token]/opengraph-image.tsx` — `ImageResponse` (`next/og`): the still card (overall + the
  silhouette polygon + "got my baseline with Ava" + Ava wordmark) in the warm palette, rendered with inline
  flexbox JSX (OG runtime constraint). Reads the same row by token.
- `components/share/ShareCard.tsx` — presentational composition A: a `<VideoHero clipUrl?>` (branded
  **placeholder** when no `clipUrl`; the templated Ava clip slots in later), the overall number, the unlabeled
  silhouette (SVG via `polygonPoints(silhouette, …)`), "Got my baseline with Ava", and the CTA
  ("Map your six → " + the app URL). No tier label, no axis labels.

## Trigger UX

A **"Share my baseline"** button in the `RadarDrawer` (rendered only when `profile.overall !== null` — you need
a baseline to share). On tap → `POST /api/share` → on success reveal the `url` with a copy button and
`navigator.share()` (mobile share sheet) when available; on failure a quiet inline error. Ships **anonymous**
(no name field this slice; the API accepts `displayName` for the future field).

## Compliance (load-bearing)

- **Two artifacts never merge:** `buildShareCard` is the only card assembler and emits only `{overall, silhouette}`;
  the private profile (full labeled radar + report) is separate code and never touches the share path.
- **Silhouette is shape-only + anonymized:** unlabeled, shuffled order → never "which axis is which," never a
  per-axis value displayed. **No tier label** (mildly evaluative). No symptoms / condition language — ever.
- **`share_cards` has no sensitive field:** no encrypted column, no labeled per-axis score; a public-by-token
  read is safe. Service-role-only (no `anon` grant) → no enumeration.
- **Avatar/video:** the slot is a placeholder; no avatar render is triggered by the public page (rule 3). The
  future clip is a single templated render (name/score overlaid, not per-user), behind GATE-1 legal
  (likeness/consent).
- Name is opt-in (PII on a public page), default anonymous.

## Error handling

- No baseline yet (`overall === null`) → `/api/share` returns 400 and the trigger is hidden/disabled.
- Unknown/expired token → the page `notFound()` (404); the OG route returns a neutral fallback image.
- `/api/share` unauth → 401; gate not satisfied → 403; token-insert conflict → regenerate once (16-byte token
  makes collision astronomically unlikely).
- A share-write failure surfaces a quiet inline error in the trigger; it never blocks the chat.

## Testing

- **`buildShareCard` (unit):** given axes+overall → returns `{overall, silhouette}` only; `silhouette` is a
  length-6 permutation of `scoresToValues(axes)` (multiset-equal, order may differ); no axis labels in the
  output; `null` scores → `{overall:null, silhouette:[]}`.
- **`/api/share` (unit, mocked deps):** 401 unauth; 403 gate; 400 when no baseline; happy path generates a
  token, inserts via the admin client, returns `{token, url}` with the app URL.
- **`ShareCard` (component):** renders the overall number, the silhouette SVG (role="img"), the "baseline"
  copy + CTA; shows the **placeholder** hero when `clipUrl` is absent; renders no tier label / no axis labels.
- **Share page (unit):** a known token renders the card; an unknown token → 404 (test the data-fetch + the
  `notFound` branch via a thin loader, since server components + `next/og` are awkward in jsdom).
- **Migration:** applied via MCP; RLS on + 0 policies verified; advisors clean.
- `npm run test` / `lint` / `build` green; live render check on `/share/<token>` + the OG preview.

## Implementation note (size)

Larger than one tight plan; the implementation may split into: **(i)** data + API + migration (`0006`,
`buildShareCard`, `/api/share`); **(ii)** the public page + OG image + `ShareCard`; **(iii)** the radar-drawer
"Share my baseline" trigger. All land behind the same slice.

## Acceptance criteria

- [ ] `0006_share_cards` live; RLS on + 0 policies (service-role-only); advisors clean.
- [ ] `buildShareCard` emits only `{overall, silhouette}`; silhouette is shape-only + anonymized order; it is
      the single card assembler.
- [ ] `/api/share` (authed/gated) creates a card from the user's own scores and returns a public `/share/<token>` URL;
      400 when there's no baseline.
- [ ] `/share/<token>` renders composition A (video-hero placeholder + overall + unlabeled silhouette + copy +
      CTA) publicly; unknown token → 404; the OG image previews as a card.
- [ ] No tier label, no axis labels, no per-axis values, no encrypted field on the public card; name opt-in.
- [ ] "Share my baseline" in the radar drawer creates + surfaces the link (copy / native share).
- [ ] `npm run test` / `lint` / `build` green.

## Deferred (explicit)

Poster (B) composition + the real templated Ava clip (avatar foundation/1F — see `brag-card-poster-variant`
memory); the Gap reveal + Decision CTA (Stripe = 1D); the progress card (Phase 2); a name-input UI; card
revocation/management.
