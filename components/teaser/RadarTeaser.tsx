'use client';
import { useState } from 'react';
import { computeProfile, type Axis, type Severity, type Signals } from '@/lib/scoring';
import { RadarChart } from '@/components/radar/RadarChart';
import { EmailCapture } from './EmailCapture';

interface Question {
  axis: Axis;
  prompt: string;
  options: { label: string; severity: Severity }[];
}

const QUESTIONS: Question[] = [
  {
    axis: 'energy',
    prompt: 'How are your energy levels lately?',
    options: [
      { label: 'Running on empty', severity: 1 },
      { label: 'Up and down', severity: 2 },
      { label: 'Great', severity: 4 },
    ],
  },
  {
    axis: 'sleep',
    prompt: 'How well are you sleeping?',
    options: [
      { label: 'Barely', severity: 1 },
      { label: 'Okay', severity: 2 },
      { label: 'Like a rock', severity: 4 },
    ],
  },
  {
    axis: 'drive',
    prompt: 'How is your drive and motivation?',
    options: [
      { label: 'Low', severity: 1 },
      { label: 'Some days', severity: 2 },
      { label: 'Fired up', severity: 4 },
    ],
  },
];

export function RadarTeaser() {
  const [signals, setSignals] = useState<Signals>({});
  const [showCapture, setShowCapture] = useState(false);
  const profile = computeProfile(signals);

  function answer(axis: Axis, severity: Severity): void {
    setSignals((prev) => ({ ...prev, [axis]: [severity] }));
  }

  return (
    <div className="grid w-full max-w-4xl gap-10 md:grid-cols-2 md:items-center">
      <div className="flex flex-col gap-5">
        {QUESTIONS.map((q) => (
          <div key={q.axis} data-testid={`q-${q.axis}`} className="flex flex-col gap-2">
            <p className="font-medium text-[var(--fg)]">{q.prompt}</p>
            <div className="flex flex-wrap gap-2">
              {q.options.map((o) => {
                const selected = signals[q.axis]?.[0] === o.severity;
                return (
                  <button
                    key={o.label}
                    type="button"
                    onClick={() => answer(q.axis, o.severity)}
                    aria-pressed={selected}
                    className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                      selected
                        ? 'border-transparent bg-[var(--brand)] text-white'
                        : 'border-[var(--fg)]/15 bg-white/40 text-[var(--fg)] hover:border-[var(--brand)]'
                    }`}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {showCapture ? (
          <EmailCapture />
        ) : (
          <button
            type="button"
            onClick={() => setShowCapture(true)}
            className="mt-2 self-start rounded-full bg-[var(--brand)] px-6 py-3 font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5"
          >
            Get your full profile
          </button>
        )}
      </div>

      <div className="flex justify-center">
        <RadarChart profile={profile} />
      </div>
    </div>
  );
}
