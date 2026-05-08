/**
 * Single source of truth for state-level launch availability.
 *
 * Strategy (see docs/COMPLIANCE_BASELINE.md §3 + §4 for the why):
 *   - **NY** is geo-blocked day 1. NY AI Companion Law (effective Nov 5, 2025)
 *     carries $15K/day AG civil penalties. Until we have insurance with a
 *     regulatory-defense rider AND counsel on retainer, the per-day exposure
 *     is existential for a bootstrapped operator.
 *   - **CA** is deferred ~6 months. CA AB 489 + CA SB 243 (both effective
 *     Jan 1, 2026) are compliance-able but the SB 243 private right of
 *     action ($1K/violation + attorneys' fees) requires careful
 *     implementation review. Re-enable after a dedicated CA compliance
 *     audit + insurance is in place.
 *   - All other states are gated only by the clinical partner's DEA / state
 *     license map. We assume OpenLoop / CareValidate covers the listed
 *     SERVED_STATES — the partnership contract will confirm the actual
 *     map; UNAVAILABLE_BY_PARTNER is the placeholder for the 2-3 states
 *     they don't cover.
 *
 * When OpenLoop signs, sync this file with their licensure map and bump the
 * SERVED_STATES count in marketing copy.
 */

import type { LaunchStateStatus } from "@/types";

/** States where we will not enroll patients on day 1. */
export const BLOCKED_STATES: ReadonlySet<string> = new Set(["NY", "CA"]);

/**
 * States we expect the clinical partner does not cover. Placeholder until
 * OpenLoop / CareValidate confirms. These would also be blocked.
 */
export const UNAVAILABLE_BY_PARTNER: ReadonlySet<string> = new Set([
  // populate once the partnership contract is signed
]);

/** Reasons surfaced to the user. Plain language only — no legal jargon. */
export const BLOCKED_STATE_NOTES: Readonly<Record<string, string>> = {
  NY: "We're working on bringing Ava to New York — expanding here next year.",
  CA: "California launch is later this year. Drop your email and we'll save your spot.",
};

/** Public-facing copy fragment for marketing claims. */
export const SERVED_STATES_LABEL = "30+ US states";

export function isStateAvailable(stateCode: string): boolean {
  if (!stateCode || stateCode.length !== 2) return false;
  return (
    !BLOCKED_STATES.has(stateCode) && !UNAVAILABLE_BY_PARTNER.has(stateCode)
  );
}

export function statusForState(stateCode: string): LaunchStateStatus {
  if (!stateCode || stateCode.length !== 2) return "unknown";
  if (BLOCKED_STATES.has(stateCode)) return "deferred";
  if (UNAVAILABLE_BY_PARTNER.has(stateCode)) return "no_partner";
  return "available";
}

export function blockedStateMessage(stateCode: string): string | null {
  if (!BLOCKED_STATES.has(stateCode) && !UNAVAILABLE_BY_PARTNER.has(stateCode)) {
    return null;
  }
  return (
    BLOCKED_STATE_NOTES[stateCode] ??
    "We're not yet available in your state. Drop your email and we'll let you know when we are."
  );
}
