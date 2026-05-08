import Link from "next/link";
import { brandConfig, BRAND } from "@/lib/brand";

export function LandingFooter() {
  const brand = brandConfig[BRAND];

  return (
    <footer
      className="section"
      style={{
        paddingBlock: "56px 32px",
        borderTop: "1px solid var(--border-subtle)",
      }}
    >
      <div className="section-narrow">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          {/* Brand block */}
          <div className="flex flex-col gap-3">
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 22,
                fontWeight: 300,
                color: "var(--text-primary)",
                letterSpacing: "-0.01em",
              }}
            >
              {brand.name}
            </span>
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: 13,
                lineHeight: 1.6,
                maxWidth: 320,
              }}
            >
              An AI health companion for men&apos;s hormone optimization.
              Lab-grade testing, board-certified clinicians, treatment if
              medically appropriate.
            </p>
            <span
              className="ai-badge mt-3"
              style={{ alignSelf: "flex-start", fontSize: 10 }}
            >
              <span aria-hidden>ⓘ</span> AI · not a doctor
            </span>
          </div>

          <FooterColumn
            title="Service"
            links={[
              { label: "How it works", href: "/#how-it-works" },
              { label: "What we measure", href: "/#what-we-measure" },
              { label: "Pricing", href: "/#pricing" },
              { label: "Talk to Ava", href: "/qualify" },
            ]}
          />

          <FooterColumn
            title="Legal"
            links={[
              { label: "Privacy policy", href: "/privacy" },
              { label: "Terms of service", href: "/terms" },
              { label: "AI disclosure", href: "/terms#ava-is-an-ai" },
            ]}
          />

          <FooterColumn
            title="Contact"
            links={[
              { label: "pw@eigen-holdings.com", href: "mailto:pw@eigen-holdings.com" },
              { label: "988 (mental health crisis)", href: "tel:988" },
              { label: "911 (medical emergency)", href: "tel:911" },
            ]}
          />
        </div>

        <div
          className="mt-10 flex flex-col gap-3 pt-6 md:flex-row md:items-center md:justify-between"
          style={{ borderTop: "1px solid var(--border-subtle)" }}
        >
          <p
            style={{
              color: "var(--text-dim)",
              fontSize: 11,
              lineHeight: 1.5,
            }}
          >
            © {new Date().getFullYear()} Eigen Holdings LLC · Delaware ·
            All treatment decisions by licensed providers.
          </p>
          <p
            className="mono"
            style={{
              color: "var(--text-dim)",
              fontSize: 10,
              letterSpacing: "0.06em",
            }}
          >
            withava.co
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: Array<{ label: string; href: string }>;
}) {
  return (
    <div className="flex flex-col gap-3">
      <span
        className="mono"
        style={{
          fontSize: 10,
          color: "var(--text-muted)",
          letterSpacing: "0.16em",
          textTransform: "uppercase",
        }}
      >
        {title}
      </span>
      <ul className="flex flex-col gap-2">
        {links.map((l) => (
          <li key={l.href + l.label}>
            <Link
              href={l.href}
              className="underline-offset-4 hover:underline"
              style={{
                color: "var(--text-secondary)",
                fontSize: 13,
              }}
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
