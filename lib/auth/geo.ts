import { BLOCKED_STATES } from './states';

export function isBlockedState(state: string | null | undefined): boolean {
  if (!state) return false;
  return BLOCKED_STATES.has(state.toUpperCase());
}

/** Platform geo header (e.g. Vercel `x-vercel-ip-country-region` = "CA", or "US-CA"). */
export function stateFromGeoHeader(header: string | null | undefined): string | null {
  if (!header) return null;
  const m = header.trim().toUpperCase().match(/([A-Z]{2})$/);
  return m ? m[1] : null;
}
