# CREDIT-LIABILITY-AND-EXIT.md

How Ava handles prepaid credits as a *liability* and how the product supports a clean, lawsuit-resistant shutdown. Pairs with `docs/DATA-MODEL.md` (schema), `docs/COMPLIANCE.md` (data/logs), and `docs/business-strategy.md` §17A (the why).

> Core idea: **a prepaid credit is money we owe, not money we've earned.** The product must always be able to refund every outstanding balance, and a shutdown must never strand a user's credits or their data.

## 1. Credits are deferred revenue

- When a user buys credits or a subscription, the cash is collected but the *service is owed*. Treat unredeemed credits as a liability on the books, not profit.
- Subscription cash is only "earned" as its included credits are consumed or expire.
- In many states, prepaid balances are regulated like **gift cards** (consumer protection + unclaimed-property/escheat). Expiration rules vary by state — the ToS language and expiration period are an **attorney sign-off item** (GATE 1).

## 2. Credit expiration (build this in from day one)

- Every credit grant has an **`expires_at`** (default **12 months** from grant). Configurable per grant via `CREDIT_EXPIRY_MONTHS` (default 12).
- A daily job expires credits past `expires_at`: write a `credit_ledger` row with negative `delta`, `reason = "expire:ttl"`. Balance is always `sum(delta)`.
- Show users their expiring balance and date in-app (avoids "you took my money" complaints — the #1 chargeback trigger).
- **Do not implement "never expire."** It creates a perpetual, unbounded liability.

> Attorney dependency: some states limit/prohibit expiration on gift-card-like balances. Ship expiration *configurable* and confirm the legal period before launch. Do not hardcode an assumption.

## 3. The credit-liability reserve (the key financial discipline)

The product must surface, at all times, the total cash value of outstanding obligations so the operator never spends into the reserve.

- Maintain a computed metric **`outstanding_liability_cents`** = sum over all users of `current_credit_balance × per_credit_cash_value` + prepaid-but-unconsumed subscription value.
- `per_credit_cash_value` = the cash the user effectively paid per credit (track the purchase price, not COGS — we may owe a refund of what they *paid*).
- Expose this on an internal `/admin/liability` view (owner-only, behind auth + IP allowlist). It answers one question: *"If everyone asked for a refund today, how much do we owe?"*
- **Operating rule (human, not code):** the Mercury balance never drops below `outstanding_liability_cents`. The admin view exists to enforce this.

## 4. Refunds & failure handling (budgeted, not surprise)

- **Technical failure is always on us.** If an avatar session crashes mid-stream, refund the consumed credits for that session automatically (`reason = "refund:session_failure"`) and log it. The `avatar_sessions.fell_back_to_text` / failure flags drive this.
- **Voluntary refunds:** support a refund path that reverses the Stripe charge *and* removes the corresponding credits (can't let a user keep credits after a refund). Reverse both in one transaction.
- **Chargebacks:** on a Stripe dispute webhook, flag the user, freeze their balance, and reconcile (the credits are effectively refunded by the bank). Don't let a charged-back user keep spending.

## 5. Subscription cancellation

- Cancel at **period end** by default (user keeps access through what they paid for). Mid-period cancellation with a refund must be **pro-rated**.
- On cancel, stop future monthly credit grants; previously granted credits keep their own `expires_at`.
- Never take a monthly fee and then disable service mid-period — that is the cleanest path to a dispute.

## 6. Clean-exit / wind-down support (build the switches, don't wait until shutdown)

The product must be *able* to wind down cleanly on command. Implement these as real, tested capabilities, not shutdown-day improvisation:

- **Maintenance / sunset flag** (`APP_SUNSET_MODE`): when on, blocks new purchases and new sessions, shows a wind-down notice, but still allows refunds and data export/deletion.
- **Advance-notice banner:** a configurable notice (≥30 days) shown to all users before sunset.
- **Bulk refund routine:** an admin-triggered job that refunds every outstanding credit and pro-rated subscription balance to the original payment method via Stripe, drawing from the funded reserve. Logs every refund.
- **Honor stated expiration:** balances already past `expires_at` need no refund (they were expired per ToS) — only live balances are refunded.

## 7. Data & log handling at shutdown (lawsuit protection)

This is where wind-down meets `docs/COMPLIANCE.md`. **Split the two on shutdown:**

- **Delete user PII and sensitive health data** (the 🔒 fields, summaries, scores, facts). Never leave an abandoned database of men's-health data. Be able to *demonstrate* deletion (deletion log without the deleted content).
- **Retain compliance/safeguard audit logs separately** — emergency-detection fires, output-filter blocks, disclosure-acceptance timestamps. These prove we operated compliantly and are legal protection if an AI-companion-law claim survives the company. Store them de-identified (event + timestamp + outcome, not the user's symptoms).

> Build the data model so PII and compliance logs are in **separate tables/stores** from the start, so "delete PII, keep compliance logs" is a clean operation, not a surgical extraction. See `docs/DATA-MODEL.md` §Audit logs.

## 8. Acceptance checklist (feeds GATE 1)

- [ ] Every credit grant has `expires_at`; expiry job tested.
- [ ] `outstanding_liability_cents` computed and visible on `/admin/liability`.
- [ ] Session-failure auto-refund works and is logged.
- [ ] Refund path reverses Stripe charge AND removes credits atomically.
- [ ] Chargeback webhook freezes balance.
- [ ] Subscription cancel = period-end (or pro-rated refund); no mid-period dead service.
- [ ] `APP_SUNSET_MODE` blocks new spend, allows refunds + deletion.
- [ ] Bulk refund routine tested against the reserve.
- [ ] PII deletion and compliance-log retention are separate, tested operations.
- [ ] ToS/privacy language for expiration + wind-down + deletion reviewed by attorney.
