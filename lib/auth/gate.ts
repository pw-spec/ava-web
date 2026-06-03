import { isBlockedState } from './geo';

export interface GateInput {
  hasSession: boolean;
  disclosureAccepted: boolean;
  geoState: string | null;
}

export type GateResult = 'allow' | '/sign-in' | '/disclosure' | '/unavailable';

export function gateDecision(input: GateInput): GateResult {
  if (isBlockedState(input.geoState)) return '/unavailable';
  if (!input.hasSession) return '/sign-in';
  if (!input.disclosureAccepted) return '/disclosure';
  return 'allow';
}
