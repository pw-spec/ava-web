import { pointForValue, polygonPoints } from '@/components/radar/geometry';

const SIZE = 200;
const C = SIZE / 2;
const R = 78;
const FULL = [100, 100, 100, 100, 100, 100];

/** Composition A — the public day-one brag card. Pure/server component. The silhouette is
 *  UNLABELED (shape only); `clipUrl` is the future templated Ava clip (placeholder until then). */
export function ShareCard({
  overall,
  silhouette,
  displayName,
  clipUrl,
}: {
  overall: number;
  silhouette: number[];
  displayName?: string | null;
  clipUrl?: string;
}) {
  const copy = displayName ? `${displayName} got a wellness baseline with Ava.` : 'Got my baseline with Ava.';

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-5 shadow-[0_8px_30px_rgba(43,38,34,0.10)]">
        <div className="mb-3 flex items-center justify-between">
          <span className="font-bold tracking-tight text-foreground">Ava</span>
          <span className="text-xs text-muted-foreground">wellness baseline</span>
        </div>

        {clipUrl ? (
          <video
            className="mb-4 aspect-video w-full rounded-2xl object-cover"
            src={clipUrl}
            autoPlay
            muted
            loop
            playsInline
          />
        ) : (
          <div
            aria-label="Ava clip (coming soon)"
            className="mb-4 flex aspect-video w-full items-center justify-center rounded-2xl"
            style={{ background: 'linear-gradient(135deg, var(--brand), var(--brand-2))' }}
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-background/85 text-brand">
              ▶
            </span>
          </div>
        )}

        <div className="flex items-center gap-4">
          <div>
            <div className="text-5xl font-extrabold leading-none tracking-tight text-foreground tabular-nums">
              {overall}
            </div>
            <div className="text-xs text-muted-foreground">out of 100</div>
          </div>
          <svg
            width={96}
            height={96}
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            role="img"
            aria-label="Wellness silhouette"
            className="shrink-0"
          >
            <polygon points={polygonPoints(FULL, C, C, R)} fill="none" stroke="var(--border)" strokeWidth={1.5} />
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const e = pointForValue(i, 100, C, C, R);
              return <line key={i} x1={C} y1={C} x2={e.x} y2={e.y} stroke="var(--border)" strokeOpacity={0.6} />;
            })}
            <polygon
              points={polygonPoints(silhouette, C, C, R)}
              fill="var(--brand-2)"
              fillOpacity={0.35}
              stroke="var(--brand)"
              strokeWidth={2}
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <p className="mt-4 text-sm font-semibold text-foreground">{copy}</p>
        <a
          href="/"
          className="mt-4 block rounded-full bg-primary px-4 py-2.5 text-center text-sm font-semibold text-primary-foreground"
        >
          Map your six with Ava →
        </a>
      </div>
    </main>
  );
}
