import type { OutputFilterResult } from './types';

// REVIEW: clinician + attorney sign-off required before GATE 1. Starter lists; expected to grow.
const CONDITION_NAMES = [
  'hypogonadism',
  'low testosterone',
  'low t',
  'erectile dysfunction',
  'hypothyroidism',
  'diabetes',
  'depression',
  'sleep apnea',
];

const DRUG_NAMES = [
  'testosterone',
  'trt',
  'clomid',
  'enclomiphene',
  'sildenafil',
  'viagra',
  'cialis',
  'tadalafil',
  'bluechew',
  'finasteride',
  'semaglutide',
  'ozempic',
];

const DOSAGE = /\b\d+\s?(mg|milligrams|mcg|iu|ml)\b/i;
const CLINICAL_PHRASE =
  /\b(i diagnose|i can diagnose|you are diagnosed|my (?:clinical )?assessment)\b/i;

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** A condition name attributed to the user ("you ... <condition>"), incl. "you likely have ...". */
function statesUserCondition(text: string): boolean {
  return CONDITION_NAMES.some((c) =>
    new RegExp(`\\byou\\b[^.?!]*\\b${escapeRe(c)}\\b`, 'i').test(text),
  );
}

export function scanOutput(text: string): OutputFilterResult {
  const matches: string[] = [];

  if (DOSAGE.test(text)) matches.push('dosage');
  if (CLINICAL_PHRASE.test(text)) matches.push('clinical_claim');

  for (const drug of DRUG_NAMES) {
    if (new RegExp(`\\b${escapeRe(drug)}\\b`, 'i').test(text)) {
      matches.push(`drug:${drug}`);
      break;
    }
  }

  if (statesUserCondition(text)) matches.push('diagnosis');

  if (matches.length === 0) {
    return { blocked: false, matches: [] };
  }
  return { blocked: true, reason: matches.join(','), matches };
}
