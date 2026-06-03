import { describe, it, expect } from 'vitest';
import { gateDecision } from '@/lib/auth/gate';

const base = { hasSession: false, disclosureAccepted: false, geoState: null as string | null };

describe('gateDecision', () => {
  it('blocks a CA/NY geo first, even with a full session', () => {
    expect(gateDecision({ hasSession: true, disclosureAccepted: true, geoState: 'CA' })).toBe('/unavailable');
  });
  it('redirects to sign-in when there is no session', () => {
    expect(gateDecision({ ...base })).toBe('/sign-in');
  });
  it('redirects to disclosure when signed in but not accepted', () => {
    expect(gateDecision({ hasSession: true, disclosureAccepted: false, geoState: null })).toBe('/disclosure');
  });
  it('allows a signed-in, accepted, non-blocked user', () => {
    expect(gateDecision({ hasSession: true, disclosureAccepted: true, geoState: 'TX' })).toBe('allow');
  });
});
