import type { CrisisCard } from './types';

// Names 988 and 911 only. Never describes self-harm methods.
export const CRISIS_CARD: CrisisCard = {
  kind: 'crisis',
  headline: 'If you are in crisis, help is available right now.',
  resources: [
    { label: '988 Suicide & Crisis Lifeline', contact: 'Call or text 988' },
    { label: 'Emergency services', contact: 'Call 911' },
  ],
};
