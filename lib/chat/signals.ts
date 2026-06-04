import type { Signals } from '@/lib/scoring';
import type { SignalsTurn } from '@/lib/safeguards/types';

/** Append a turn's severities to the accumulated signals (pure). */
export function mergeSignals(accumulated: Signals, turn: SignalsTurn): Signals {
  const existing = accumulated[turn.axis] ?? [];
  return { ...accumulated, [turn.axis]: [...existing, ...turn.severities] };
}
