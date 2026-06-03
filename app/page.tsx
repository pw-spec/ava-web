import { RadarTeaser } from '@/components/teaser/RadarTeaser';

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col items-center gap-12 px-6 py-16">
      <header className="flex flex-col items-center gap-4 text-center">
        <span className="text-sm font-semibold uppercase tracking-widest text-[var(--accent)]">
          Ava
        </span>
        <h1 className="max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl">
          See where your wellness really stands.
        </h1>
        <p className="max-w-xl text-lg text-[var(--fg)]/70">
          Answer a few quick questions and watch your six-axis profile take shape. No appointments,
          no judgment — just a clear picture and a companion in your corner.
        </p>
      </header>

      <RadarTeaser />

      <footer className="mt-auto flex flex-col items-center gap-1 pt-12 text-center text-xs text-[var(--fg)]/50">
        <p>Ava is an AI companion · not medical advice.</p>
        <p>Wellness indicators, not a medical assessment.</p>
      </footer>
    </main>
  );
}
