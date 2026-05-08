import { AnimatedRadar } from "@/components/charts/AnimatedRadar";
import { SeverityChip } from "@/components/profile/SeverityChip";
import { severityColor, type SeverityLevel } from "@/lib/scoring";
import type { HealthScores } from "@/types";

interface ProfileHeroProps {
  overall: number;
  severity: SeverityLevel;
  subtitle: string;
  scores: HealthScores;
}

export function ProfileHero({
  overall,
  severity,
  subtitle,
  scores,
}: ProfileHeroProps) {
  return (
    <section className="section relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 75% 30%, var(--accent-glow) 0%, transparent 60%)",
        }}
      />

      <div className="section-narrow relative grid grid-cols-1 items-center gap-10 lg:grid-cols-[1fr_1fr]">
        <div className="flex flex-col gap-4">
          <p className="section-eyebrow">02 · Your assessment</p>

          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 200,
              fontSize: "clamp(36px, 5.4vw, 56px)",
              lineHeight: 1.05,
              letterSpacing: "-0.025em",
              color: "var(--text-primary)",
            }}
          >
            Your health profile.
          </h1>

          <div className="mt-2 flex items-baseline gap-3">
            <span
              className="tnum"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 88,
                fontWeight: 200,
                lineHeight: 1,
                color: severityColor(overall),
                letterSpacing: "-0.03em",
                transition: "color 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              {overall}
            </span>
            <span
              className="tnum"
              style={{
                fontSize: 22,
                fontWeight: 300,
                color: "var(--text-muted)",
              }}
            >
              / 100
            </span>
          </div>

          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: 15,
              lineHeight: 1.55,
            }}
          >
            {subtitle}.
          </p>

          <div className="mt-3 flex items-center gap-2">
            <SeverityChip severity={severity} />
          </div>
        </div>

        <div className="flex justify-center lg:justify-end">
          <AnimatedRadar scores={scores} size={260} />
        </div>
      </div>
    </section>
  );
}
