"use client";

export type TierName = "Base" | "Premium";

export interface Tier {
  name: TierName;
  price: number;
  blurb: string;
  highlight: boolean;
}

interface TierPickerProps {
  tiers: ReadonlyArray<Tier>;
  selected: TierName;
  onSelect: (tier: TierName) => void;
}

export function TierPicker({ tiers, selected, onSelect }: TierPickerProps) {
  return (
    <section className="section" style={{ paddingTop: 16 }}>
      <div className="section-narrow">
        <p className="section-eyebrow mb-7">Pick your tier</p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
          {tiers.map((t) => {
            const isSelected = selected === t.name;
            return (
              <button
                type="button"
                key={t.name}
                onClick={() => onSelect(t.name)}
                className="text-left"
                style={{
                  background: t.highlight
                    ? "linear-gradient(180deg, rgba(28, 32, 42, 0.85) 0%, rgba(20, 24, 33, 0.85) 100%)"
                    : "var(--bg-card)",
                  border: isSelected
                    ? `1.5px solid ${
                        t.highlight ? "var(--gold-light)" : "var(--accent-light)"
                      }`
                    : `1px solid ${
                        t.highlight
                          ? "var(--gold-border)"
                          : "var(--border-subtle)"
                      }`,
                  borderRadius: 18,
                  padding: 24,
                  cursor: "pointer",
                  transition: "border-color 240ms ease",
                }}
                aria-pressed={isSelected}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <span
                      className="mono"
                      style={{
                        fontSize: 11,
                        color: "var(--text-muted)",
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                      }}
                    >
                      {t.name}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: 40,
                        fontWeight: 200,
                        color: t.highlight
                          ? "var(--gold-light)"
                          : "var(--text-primary)",
                        lineHeight: 1,
                        letterSpacing: "-0.02em",
                        marginTop: 4,
                      }}
                      className="tnum"
                    >
                      ${t.price}
                      <span
                        style={{
                          fontSize: 13,
                          color: "var(--text-muted)",
                          marginLeft: 4,
                          fontWeight: 400,
                          fontFamily: "var(--font-inter), sans-serif",
                        }}
                      >
                        /mo
                      </span>
                    </span>
                  </div>
                  <Indicator selected={isSelected} highlighted={t.highlight} />
                </div>
                <p
                  style={{
                    color: "var(--text-secondary)",
                    fontSize: 13.5,
                    lineHeight: 1.55,
                    marginTop: 14,
                  }}
                >
                  {t.blurb}
                </p>
              </button>
            );
          })}
        </div>
        <p className="mt-4" style={{ color: "var(--text-muted)", fontSize: 12 }}>
          HSA / FSA approved · Cancel anytime · 30-day money-back if treatment
          isn&apos;t right for you.
        </p>
      </div>
    </section>
  );
}

function Indicator({
  selected,
  highlighted,
}: {
  selected: boolean;
  highlighted?: boolean;
}) {
  const tone = highlighted ? "var(--gold-light)" : "var(--accent-light)";
  return (
    <span
      aria-hidden
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 22,
        height: 22,
        borderRadius: "50%",
        border: `1.5px solid ${selected ? tone : "var(--border-emphasis)"}`,
        background: selected ? tone : "transparent",
        flexShrink: 0,
        transition: "all 220ms ease",
      }}
    >
      {selected && (
        <svg width="11" height="11" viewBox="0 0 11 11" aria-hidden>
          <path
            d="M2 5.5 L4.5 8 L9 3"
            stroke="var(--bg-primary)"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      )}
    </span>
  );
}
