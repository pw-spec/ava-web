const PANEL = [
  {
    group: "Hormones",
    markers: [
      "Total testosterone",
      "Free testosterone",
      "SHBG",
      "Estradiol",
      "LH",
      "FSH",
      "DHEA-S",
      "Prolactin",
    ],
  },
  {
    group: "Thyroid",
    markers: ["TSH", "Free T3", "Free T4"],
  },
  {
    group: "Metabolic",
    markers: [
      "Fasting glucose",
      "HbA1c",
      "Lipid panel",
      "ALT / AST",
      "Vitamin D",
      "PSA",
    ],
  },
];

export function WhatWeMeasure() {
  return (
    <section className="section">
      <div className="section-narrow">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
          {/* Left: heading + intro */}
          <div className="flex flex-col gap-5">
            <p className="section-eyebrow">What we measure</p>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 200,
                fontSize: "clamp(28px, 4vw, 44px)",
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
                color: "var(--text-primary)",
              }}
            >
              A full hormone panel. Not a one-marker glance.
            </h2>
            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: 15,
                lineHeight: 1.65,
                maxWidth: 460,
              }}
            >
              Your testosterone reading alone tells less than half the story.
              We test the supporting cast that interacts with it — thyroid,
              metabolic markers, prolactin, and prostate safety markers — so
              your clinician sees the whole signal, not just the headline.
            </p>
            <p
              className="mono"
              style={{
                color: "var(--text-muted)",
                fontSize: 11,
                letterSpacing: "0.08em",
                paddingTop: 4,
              }}
            >
              17+ biomarkers · Quest Diagnostics · CLIA-certified
            </p>
          </div>

          {/* Right: panel preview card */}
          <div
            className="card-elevated"
            style={{
              padding: 0,
              overflow: "hidden",
              background:
                "linear-gradient(180deg, rgba(28, 32, 42, 0.85) 0%, rgba(20, 24, 33, 0.85) 100%)",
            }}
          >
            {/* Card header */}
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: "1px solid var(--border-divider)" }}
            >
              <span
                className="mono"
                style={{
                  fontSize: 11,
                  color: "var(--text-muted)",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                }}
              >
                Sample lab panel
              </span>
              <span
                className="mono"
                style={{
                  fontSize: 11,
                  color: "var(--accent-light)",
                  letterSpacing: "0.06em",
                }}
              >
                AVA-HRP-01
              </span>
            </div>

            <div className="flex flex-col">
              {PANEL.map((g, i) => (
                <div
                  key={g.group}
                  className="px-6 py-5"
                  style={{
                    borderBottom:
                      i === PANEL.length - 1
                        ? "none"
                        : "1px solid var(--border-subtle)",
                  }}
                >
                  <div
                    className="mb-3 flex items-center gap-2"
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      color: "var(--gold-light)",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {g.group}
                  </div>
                  <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
                    {g.markers.map((m) => (
                      <li
                        key={m}
                        className="flex items-center gap-2"
                        style={{
                          fontSize: 13,
                          color: "var(--text-ava)",
                        }}
                      >
                        <Check />
                        <span>{m}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Check() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" aria-hidden>
      <path
        d="M2 5.5 L4.5 8 L9 3"
        stroke="var(--accent-light)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
