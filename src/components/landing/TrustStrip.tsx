// PRE-LAUNCH ATTORNEY REVIEW REQUIRED
// Every claim below makes a specific factual representation. They become
// true when the listed partnerships are signed and operational. DO NOT
// publish this strip publicly until each item is substantiated by an
// executed contract or active integration. See docs/COMPLIANCE_BASELINE.md
// §6 (FTC) for enforcement context.
const ITEMS = [
  {
    label: "Reviewed by",
    value: "Board-certified endocrinologists",
  },
  {
    label: "Lab partner",
    value: "Quest Diagnostics",
  },
  {
    label: "Compliance",
    value: "HIPAA-aligned infrastructure",
  },
  {
    label: "Coverage",
    value: "30+ US states (NY, CA opening later)",
  },
  {
    label: "Guarantee",
    value: "30-day money-back",
  },
];

export function TrustStrip() {
  return (
    <section
      className="section"
      style={{
        paddingBlock: "48px",
        background:
          "linear-gradient(180deg, rgba(20, 24, 33, 0.5) 0%, rgba(14, 18, 24, 0.5) 100%)",
        borderTop: "1px solid var(--border-subtle)",
        borderBottom: "1px solid var(--border-subtle)",
      }}
    >
      <div className="section-narrow">
        <ul
          className="grid grid-cols-2 gap-x-6 gap-y-6 md:grid-cols-5"
          role="list"
        >
          {ITEMS.map((it) => (
            <li
              key={it.label}
              className="flex flex-col gap-1.5"
              style={{ minWidth: 0 }}
            >
              <span
                className="mono"
                style={{
                  fontSize: 10,
                  color: "var(--text-muted)",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                }}
              >
                {it.label}
              </span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: "var(--text-primary)",
                  lineHeight: 1.4,
                }}
              >
                {it.value}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
