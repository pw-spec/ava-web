import { describe, it, expect } from 'vitest';
import { isBlockedState, stateFromGeoHeader } from '@/lib/auth/geo';
import { US_STATES, BLOCKED_STATES } from '@/lib/auth/states';

describe('isBlockedState', () => {
  it('blocks CA and NY (case-insensitive)', () => {
    expect(isBlockedState('CA')).toBe(true);
    expect(isBlockedState('ny')).toBe(true);
  });
  it('allows other states and empty input', () => {
    expect(isBlockedState('TX')).toBe(false);
    expect(isBlockedState('')).toBe(false);
    expect(isBlockedState(null)).toBe(false);
    expect(isBlockedState(undefined)).toBe(false);
  });
});

describe('stateFromGeoHeader', () => {
  it('reads a 2-letter region and a US-XX form', () => {
    expect(stateFromGeoHeader('CA')).toBe('CA');
    expect(stateFromGeoHeader('US-NY')).toBe('NY');
  });
  it('returns null for missing/garbage', () => {
    expect(stateFromGeoHeader(null)).toBeNull();
    expect(stateFromGeoHeader('')).toBeNull();
    expect(stateFromGeoHeader('???')).toBeNull();
  });
});

describe('states data', () => {
  it('has 51 entries (50 states + DC) and CA/NY are blocked', () => {
    expect(US_STATES).toHaveLength(51);
    expect(BLOCKED_STATES.has('CA')).toBe(true);
    expect(BLOCKED_STATES.has('NY')).toBe(true);
  });
});
