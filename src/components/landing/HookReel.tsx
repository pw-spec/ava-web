import Link from "next/link";
import { VideoPlaceholder } from "@/components/video/VideoPlaceholder";

const HOOKS = [
  {
    tag: "Energy",
    label: "Crashing every afternoon at 2pm.",
  },
  {
    tag: "Recovery",
    label: "Three days sore from a workout that used to take one.",
  },
  {
    tag: "Sleep",
    label: "Waking up at 3am, can't fall back.",
  },
  {
    tag: "Drive",
    label: "Lost the edge — and you can't pin it on stress.",
  },
];

export function HookReel() {
  return (
    <section className="section">
      <div className="section-narrow">
        <div className="mb-8 flex flex-col gap-3">
          <p className="section-eyebrow">Where this usually starts</p>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 200,
              fontSize: "clamp(28px, 4vw, 40px)",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              color: "var(--text-primary)",
            }}
          >
            One of these is probably why you&apos;re here.
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5">
          {HOOKS.map((h) => (
            <Link
              key={h.tag}
              href="/qualify"
              className="group flex flex-col gap-3"
              aria-label={`${h.tag} — ${h.label} — start the assessment`}
            >
              <VideoPlaceholder
                kind="hook"
                label={h.label}
                duration={`0:${10 + Math.floor(Math.random() * 5)}`}
              />
              <div className="flex items-center justify-between">
                <span
                  className="mono"
                  style={{
                    fontSize: 11,
                    color: "var(--accent-light)",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                  }}
                >
                  {h.tag}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--text-muted)",
                    transition: "color 240ms ease",
                  }}
                  className="group-hover:[color:var(--accent-light)]"
                >
                  Start →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
