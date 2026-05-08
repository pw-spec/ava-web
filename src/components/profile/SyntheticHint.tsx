import Link from "next/link";

export function SyntheticHint() {
  return (
    <section className="section" style={{ paddingTop: 0, paddingBottom: 48 }}>
      <div className="section-narrow" style={{ maxWidth: 540 }}>
        <div
          className="card text-center"
          style={{
            background: "rgba(20, 168, 154, 0.05)",
            borderColor: "var(--accent-border)",
          }}
        >
          <p style={{ color: "var(--text-secondary)", fontSize: 13.5 }}>
            You&apos;re viewing the demo profile with neutral scores.
          </p>
          <Link
            href="/qualify"
            className="cta-secondary mt-4"
            style={{ display: "inline-flex" }}
          >
            Take the 5-minute assessment →
          </Link>
        </div>
      </div>
    </section>
  );
}
