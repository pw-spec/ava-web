# DATA-MODEL.md

Supabase (PostgreSQL) schema for Ava. Row Level Security is ON for every table. Health-adjacent fields are encrypted at rest.

## Security principles (read first)

- **RLS on every table.** A user can only ever read/write their own rows. Service-role key is used only in server routes, never shipped to the client.
- **Encrypt sensitive fields at rest.** Symptom signals, scores, summaries, and report text are sensitive. Use Supabase column encryption (pgsodium / vault) or app-layer encryption for the fields marked 🔒 below.
- **Minimize retention.** Do not store raw conversation transcripts longer than needed to generate the session summary. Store the 150-word summary, not the full transcript.
- **The share path cannot see sensitive data.** Enforced by a dedicated view + RLS (see §Share view), not just app logic.

## Tables

### `users` (extends Supabase auth.users)
| column | type | notes |
|---|---|---|
| id | uuid (PK, = auth uid) | |
| email | text | |
| display_name | text | optional, user-set |
| state_code | text | US state, for geo-block + referral geo-rules |
| created_at | timestamptz | |
| ai_disclosure_accepted_at | timestamptz | required before any chat |

### `user_facts` 🔒
| column | type | notes |
|---|---|---|
| id | uuid (PK) | |
| user_id | uuid (FK) | RLS: owner only |
| age_band | text | "30-39" etc — band, not exact DOB |
| lifestyle | jsonb 🔒 | sleep habits, training, etc. |
| wearable | text | "whoop"/"oura"/null |
| updated_at | timestamptz | |

### `session_summaries` 🔒
| column | type | notes |
|---|---|---|
| id | uuid (PK) | |
| user_id | uuid (FK) | |
| summary | text 🔒 | ~150 words, Claude Sonnet generated |
| created_at | timestamptz | |
| session_type | text | "text" / "avatar" |

Only the **last 3** are injected into the prompt context.

### `health_scores` 🔒
| column | type | notes |
|---|---|---|
| id | uuid (PK) | |
| user_id | uuid (FK) | |
| energy | smallint 🔒 | 0–100 |
| strength | smallint 🔒 | 0–100 |
| sleep | smallint 🔒 | 0–100 |
| drive | smallint 🔒 | 0–100 |
| focus | smallint 🔒 | 0–100 |
| body | smallint 🔒 | 0–100 |
| overall | smallint | 0–100 (derived; NOT marked sensitive — used by share view) |
| created_at | timestamptz | enables trend/progress |

> Note: `overall` is intentionally the only score the share path can read. Per-axis scores are 🔒 and never leave the private profile.

### `credit_ledger`
| column | type | notes |
|---|---|---|
| id | uuid (PK) | |
| user_id | uuid (FK) | |
| delta | integer | + on purchase/grant, − on consumption/expiry/refund (whole credits) |
| reason | text | "purchase:profile_29" / "consume:avatar_min" / "grant:sub_plus" / "expire:ttl" / "refund:session_failure" / "refund:voluntary" |
| unit_price_cents | integer | cash the user paid per credit in this grant (for refund/liability math); 0 for free grants |
| expires_at | timestamptz | grants only; default now()+`CREDIT_EXPIRY_MONTHS` (12). NULL for consumption/expiry/refund rows |
| balance_after | integer | denormalized running balance |
| created_at | timestamptz | |

Balance = sum(delta). Never store balance as float. Decrement happens server-side per session-minute; see avatar metering in `docs/ARCHITECTURE.md`. A daily job writes `expire:ttl` rows for grants past `expires_at`. See `docs/CREDIT-LIABILITY-AND-EXIT.md`.

### `purchases`
| column | type | notes |
|---|---|---|
| id | uuid (PK) | |
| user_id | uuid (FK) | |
| stripe_session_id | text | idempotency key |
| product | text | "profile_29" / "sub_plus" / "topup_30" etc |
| amount_cents | integer | |
| status | text | "paid"/"refunded" |
| created_at | timestamptz | |

### `subscriptions`
| column | type | notes |
|---|---|---|
| id | uuid (PK) | |
| user_id | uuid (FK) | |
| stripe_subscription_id | text | |
| plan | text | "plus"/"pro"/"max" |
| status | text | "active"/"canceled"/"past_due" |
| current_period_end | timestamptz | drives monthly credit grant |

### `referral_clicks`
| column | type | notes |
|---|---|---|
| id | uuid (PK) | |
| user_id | uuid (FK) | |
| partner | text | "hone"/"bluechew"/etc (Ava = RevOffers partners only) |
| category | text | "trt"/"ed"/"weight"/etc |
| clicked_at | timestamptz | |
| converted | boolean | set later if/when CPA confirmed (treat as upside) |

### `avatar_sessions`
| column | type | notes |
|---|---|---|
| id | uuid (PK) | |
| user_id | uuid (FK) | |
| heygen_session_id | text | |
| started_at / ended_at | timestamptz | wall-clock = billed minutes |
| credits_consumed | integer | |
| fell_back_to_text | boolean | true if concurrency cap hit |

## Share view (compliance-critical)

Create a Postgres view `share_card_data` that exposes ONLY:
- `user_id`
- `display_name` (optional)
- `overall` (current)
- `overall_previous` + `progress_delta` (for the progress card)
- radar **silhouette geometry** derived from per-axis scores (the *shape*, not the labeled values — compute normalized polygon points server-side; do not expose which axis is which)

The `/api/share` route reads from this view only. It has no SELECT grant on `health_scores` per-axis columns or any 🔒 field. This makes "sensitive data leaks into a public brag card" structurally impossible, not just discouraged.

## Audit logs (separated from PII — exit/lawsuit protection)

Compliance events live in their **own store, deliberately PII-free**, so that on shutdown we can "delete user PII, keep compliance logs" as one clean operation (see `docs/CREDIT-LIABILITY-AND-EXIT.md` §7).

### `compliance_log` (NOT a 🔒 health table — de-identified)
| column | type | notes |
|---|---|---|
| id | uuid (PK) | |
| user_ref | text | a salted hash / opaque ref, NOT the email or raw uid — survives PII deletion |
| event | text | "emergency_detected" / "filter_block" / "disclosure_accepted" / "geo_block" / "refund" |
| outcome | text | what happened (e.g. "bypassed_llm", "regenerated") — never the user's symptoms |
| created_at | timestamptz | |

Rule: this table never stores symptom content, scores, or anything that re-identifies a user's health state. It records *that* a safeguard fired and *when* — the evidence we operated compliantly.

## Liability view (internal, owner-only)

`outstanding_liability` view computes, per user and in total:
- `current_balance` = sum(`credit_ledger.delta`) for non-expired grants
- `liability_cents` = Σ(remaining credits × their grant `unit_price_cents`) + prepaid-unconsumed subscription value

Surfaced on an owner-only `/admin/liability` page (auth + IP allowlist). Operating rule: bank balance never drops below total `liability_cents`. See `docs/CREDIT-LIABILITY-AND-EXIT.md` §3.

## Migrations

- Use Supabase migrations (SQL files under `/supabase/migrations`).
- Phase 0 migration: `users`, `user_facts`, `session_summaries`, `health_scores`, `credit_ledger` (with `expires_at`, `unit_price_cents`), `compliance_log`, RLS policies, encryption setup.
- Phase 1 migration: `purchases`, `subscriptions`, `avatar_sessions`, `referral_clicks`, `share_card_data` view, `outstanding_liability` view, credit-expiry job.
