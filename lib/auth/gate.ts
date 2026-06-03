import { isBlockedState } from './geo';

export interface GateInput {
  hasSession: boolean;
  disclosureAccepted: boolean;
  /** Whether we know the user's state (self-reported at sign-up or onboarding). */
  hasState: boolean;
  /** The state we know for this user: stored profile state_code, else IP-derived. */
  geoState: string | null;
}

export type GateResult = 'allow' | '/sign-in' | '/disclosure' | '/unavailable';

export function gateDecision(input: GateInput): GateResult {
  if (isBlockedState(input.geoState)) return '/unavailable';
  if (!input.hasSession) return '/sign-in';
  // Onboarding: a user must have both a known state and an accepted disclosure.
  if (!input.hasState || !input.disclosureAccepted) return '/disclosure';
  return 'allow';
}
