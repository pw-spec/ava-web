import type { RadarProfile } from '@/lib/scoring';
import { RadarChart } from '@/components/radar/RadarChart';

type Props =
  | { state: 'locked' }
  | { state: 'preparing' }
  | { state: 'ready'; report: string; profile: RadarProfile };

/** The private Wellness Profile page body. Pure renderer of the three states; the page component
 *  loads the data and picks the state. The report is the private artifact — never the brag card. */
export function ProfileView(props: Props) {
  if (props.state === 'locked') {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Your full Wellness Profile</h1>
        <p className="text-sm text-muted-foreground">
          All six axes, with a written read on what they mean together — yours for <strong>$29</strong>.
        </p>
        <a href="/home" className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
          Continue your check-in →
        </a>
      </main>
    );
  }

  if (props.state === 'preparing') {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-3 p-6 text-center">
        <h1 className="text-xl font-semibold text-foreground">Preparing your profile…</h1>
        <p className="text-sm text-muted-foreground">Ava is writing your full read. This only takes a moment.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight text-foreground">Your Profile</h1>
      </header>
      <div className="flex justify-center rounded-3xl border border-border bg-card p-4">
        <RadarChart profile={props.profile} />
      </div>
      <section className="rounded-3xl border border-border bg-card p-5">
        <h2 className="mb-2 text-sm font-semibold text-foreground">Your read</h2>
        <p className="whitespace-pre-line text-sm leading-relaxed text-card-foreground">{props.report}</p>
      </section>
    </main>
  );
}
