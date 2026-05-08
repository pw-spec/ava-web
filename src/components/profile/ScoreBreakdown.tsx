import { ScoreBar } from "@/components/charts/ScoreBar";
import { HEALTH_CATEGORIES, type HealthCategory, type HealthScores } from "@/types";

interface ScoreBreakdownProps {
  scores: HealthScores;
  primary?: HealthCategory;
}

export function ScoreBreakdown({ scores, primary }: ScoreBreakdownProps) {
  return (
    <section className="section" style={{ paddingBlock: "48px" }}>
      <div className="section-narrow" style={{ maxWidth: 720 }}>
        <p className="section-eyebrow mb-6">By category</p>
        <div className="flex flex-col gap-3.5">
          {HEALTH_CATEGORIES.map((c) => (
            <div
              key={c.key}
              style={{
                position: "relative",
                paddingLeft: primary === c.key ? 12 : 0,
                borderLeft:
                  primary === c.key
                    ? "2px solid var(--accent-light)"
                    : "2px solid transparent",
                transition: "padding 240ms ease",
              }}
            >
              <ScoreBar
                label={c.label}
                emoji={c.emoji}
                score={scores[c.key]}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
