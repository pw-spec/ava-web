import { describe, it, expect } from 'vitest';
import { scanForEmergency } from '@/lib/safeguards/emergency-detection';

describe('scanForEmergency (tuned for recall)', () => {
  it.each([
    'I want to kill myself',
    "I don't want to live anymore",
    'I feel like ending it all',
    'sometimes I think I am better off dead',
    'I think I am having a heart attack',
    "I can't breathe",
  ])('flags crisis input: %s', (text) => {
    expect(scanForEmergency(text).hit).toBe(true);
  });

  it.each([
    'I feel tired in the afternoons',
    'My sleep has been rough lately',
    'I want to feel stronger',
    'Your energy score is 32',
  ])('passes benign input: %s', (text) => {
    expect(scanForEmergency(text).hit).toBe(false);
  });
});
