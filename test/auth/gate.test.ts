import { describe, it, expect } from 'vitest';
import { gateDecision } from '@/lib/auth/gate';

const ok = { hasSession: true, disclosureAccepted: true, hasState: true, geoState: null as string | null };

describe('gateDecision', () => {
  it('blocks a CA/NY geo first, even with a full session', () => {
    expect(gateDecision({ ...ok, geoState: 'CA' })).toBe('/unavailable');
  });

  it('blocks when the stored/known state is NY', () => {
    expect(gateDecision({ ...ok, geoState: 'NY' })).toBe('/unavailable');
  });

  it('redirects to sign-in when there is no session', () => {
    expect(gateDecision({ ...ok, hasSession: false })).toBe('/sign-in');
  });

  it('redirects to disclosure when signed in but disclosure not accepted', () => {
    expect(gateDecision({ ...ok, disclosureAccepted: false })).toBe('/disclosure');
  });

  it('redirects to disclosure when the user has no state yet (e.g. Google sign-up)', () => {
    expect(gateDecision({ ...ok, hasState: false })).toBe('/disclosure');
  });

  it('allows a signed-in, accepted, stated, non-blocked user', () => {
    expect(gateDecision({ ...ok, geoState: 'TX' })).toBe('allow');
  });
});
