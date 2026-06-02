import { describe, it, expect } from 'vitest';
import { CRISIS_CARD } from '@/lib/safeguards/crisis-card';

describe('crisis card', () => {
  it('is a crisis-kind card naming 988 and 911', () => {
    expect(CRISIS_CARD.kind).toBe('crisis');
    const blob = JSON.stringify(CRISIS_CARD);
    expect(blob).toContain('988');
    expect(blob).toContain('911');
  });

  it('lists at least two resources', () => {
    expect(CRISIS_CARD.resources.length).toBeGreaterThanOrEqual(2);
  });
});
