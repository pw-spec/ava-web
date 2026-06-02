import { describe, it, expect } from 'vitest';
import { scanOutput } from '@/lib/safeguards/output-filter';

// From docs/COMPLIANCE.md §Layer 3 allow/deny table.
const ALLOWED = [
  'Your energy score is 32.',
  'Many men with similar patterns notice afternoon dips.',
  'A provider could help investigate this.',
  "Based on what you've shared, sleep seems like a theme.",
  "This isn't medical advice.",
];

const BLOCKED = [
  'You have low testosterone.',
  'You should take 200mg weekly.',
  'You have hypogonadism.',
  'Based on my clinical assessment, you need treatment.',
  'Try sildenafil 50mg before bed.',
];

describe('output filter allow/deny table', () => {
  it.each(ALLOWED)('allows: %s', (line) => {
    expect(scanOutput(line).blocked).toBe(false);
  });

  it.each(BLOCKED)('blocks: %s', (line) => {
    expect(scanOutput(line).blocked).toBe(true);
  });

  it('reports the matched reasons when blocking', () => {
    const result = scanOutput('You should take 200mg weekly.');
    expect(result.blocked).toBe(true);
    expect(result.matches).toContain('dosage');
  });
});
