import type { EmergencyHit } from './types';

// REVIEW: clinician + attorney sign-off required before GATE 1. Starter patterns; expected to grow.
// Tuned for recall over precision: a false positive is acceptable, a false negative is not.
// Never name or describe self-harm methods anywhere in this file.
const SELF_HARM_PATTERNS: RegExp[] = [
  /\bkill(?:ing)? (?:myself|me)\b/i,
  /\bsuicid/i,
  /\bend(?:ing)? (?:it all|my life|things)\b/i,
  /\bwant to die\b/i,
  /\bdon'?t want to (?:live|be alive|be here|exist)\b/i,
  /\b(?:hurt|harm) (?:myself|me)\b/i,
  /\bno reason to live\b/i,
  /\bbetter off dead\b/i,
];

const MEDICAL_CRISIS_PATTERNS: RegExp[] = [
  /\bchest pain\b/i,
  /\bcan'?t breathe\b/i,
  /\btrouble breathing\b/i,
  /\bheart attack\b/i,
  /\bstroke\b/i,
  /\boverdos/i,
  /\bunconscious\b/i,
];

export function scanForEmergency(text: string): EmergencyHit {
  for (const pattern of SELF_HARM_PATTERNS) {
    if (pattern.test(text)) return { hit: true, category: 'self_harm' };
  }
  for (const pattern of MEDICAL_CRISIS_PATTERNS) {
    if (pattern.test(text)) return { hit: true, category: 'medical_crisis' };
  }
  return { hit: false };
}
