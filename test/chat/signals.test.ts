import { describe, it, expect } from 'vitest';
import { mergeSignals } from '@/lib/chat/signals';
import type { Signals } from '@/lib/scoring';

describe('mergeSignals', () => {
  it('appends a turn to an empty accumulator', () => {
    expect(mergeSignals({}, { axis: 'energy', severities: [2, 3] })).toEqual({ energy: [2, 3] });
  });

  it('appends to an existing axis without mutating the input', () => {
    const acc: Signals = { energy: [2] };
    const next = mergeSignals(acc, { axis: 'energy', severities: [4] });
    expect(next).toEqual({ energy: [2, 4] });
    expect(acc).toEqual({ energy: [2] }); // unchanged (pure)
  });

  it('keeps other axes intact', () => {
    expect(mergeSignals({ sleep: [1] }, { axis: 'energy', severities: [3] })).toEqual({
      sleep: [1],
      energy: [3],
    });
  });
});
