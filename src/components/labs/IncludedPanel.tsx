const INCLUDED = [
  {
    group: "Hormones",
    items: ["Total T", "Free T", "SHBG", "Estradiol", "LH", "FSH", "Prolactin"],
  },
  { group: "Thyroid", items: ["TSH", "Free T3", "Free T4"] },
  {
    group: "Metabolic",
    items: ["HbA1c", "Lipid panel", "Vitamin D", "ALT/AST", "PSA"],
  },
];

export function IncludedPanel() {
  return (
    <section className="section" style={{ paddingTop: 16 }}>
      <div className="section-narrow">
        <div
          className="card-elevated"
          style={{
            padding: 0,
            overflow: "hidden",
          }}
        >
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{ borderBottom: "1px solid var(--border-divider)" }}
          >
            <span
              className="mono"
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
              }}
            >
              What&apos;s in the panel
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

          <div className="grid grid-cols-1 sm:grid-cols-3">
            {INCLUDED.map((g, i) => (
              <div
                key={g.group}
                className="px-6 py-5"
                style={{
                  borderRight:
                    i === INCLUDED.length - 1
                      ? undefined
                      : "1px solid var(--border-subtle)",
                  borderBottom:
                    i !== INCLUDED.length - 1
                      ? "1px solid var(--border-subtle)"
                      : undefined,
                }}
              >
                <p
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: "var(--gold-light)",
                    letterSpacing: "0.04em",
                    marginBottom: 12,
                  }}
                >
                  {g.group}
                </p>
                <ul className="flex flex-col gap-2">
                  {g.items.map((m) => (
                    <li
                      key={m}
                      className="flex items-center gap-2"
                      style={{ fontSize: 13.5, color: "var(--text-ava)" }}
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
