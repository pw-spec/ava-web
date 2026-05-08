import Link from "next/link";

export const metadata = {
  title: "Terms of Service — Ava",
};

const LAST_UPDATED = "April 28, 2026";

export default function TermsPage() {
  return (
    <main className="relative min-h-dvh px-6 py-12">
      <article className="mx-auto w-full max-w-2xl">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="text-[11px] underline-offset-4 hover:underline"
            style={{ color: "var(--text-muted)" }}
          >
            ← Ava
          </Link>
          <span className="ai-badge" style={{ fontSize: 10 }}>
            <span aria-hidden>ⓘ</span> AI · not a doctor
          </span>
        </div>

        <h1
          className="mt-8"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 40,
            fontWeight: 300,
            color: "var(--text-primary)",
            letterSpacing: "0.02em",
            lineHeight: 1.1,
          }}
        >
          Terms of Service
        </h1>
        <p
          className="mt-2"
          style={{ color: "var(--text-dim)", fontSize: 11 }}
        >
          Last updated {LAST_UPDATED}
        </p>

        <Section title="Ava is an AI">
          Ava is an artificial-intelligence health companion operated by Eigen
          Holdings LLC. Ava is not a licensed medical provider and never holds
          out as one. Anything Ava says is informational and never constitutes
          medical advice, diagnosis, or treatment.
        </Section>

        <Section title="No medical advice">
          The conversational assessment, health score, and recommendations
          surfaced by Ava are general informational tools — not a clinical
          evaluation. You should not act on Ava&apos;s output without
          consulting a qualified healthcare professional.
        </Section>

        <Section title="Treatment decisions">
          All prescribing, dosage, and treatment decisions are made by
          independent licensed clinicians at our partner clinical-services
          providers, in their sole professional judgment. A prescription is
          never guaranteed. Treatment is provided only when medically
          appropriate.
        </Section>

        <Section title="Lab kits and subscriptions">
          Lab kits are billed monthly at the price displayed at checkout
          ($199/month at launch). You may cancel at any time, with billing
          stopping at the end of the current billing period. Refunds for
          shipped lab kits are evaluated case-by-case.
        </Section>

        <Section title="Eligibility">
          You must be at least 18 years old and located in the United States to
          use Ava. Treatment availability varies by state based on local
          licensure.
        </Section>

        <Section title="Acceptable use">
          You agree not to misuse the service: no automated scraping, no
          attempts to bypass safety filters, no impersonation, and no use of
          the service for purposes other than your own personal health
          inquiry.
        </Section>

        <Section title="Crisis resources">
          Ava is not equipped to handle medical or mental-health emergencies.
          If you are in crisis, call or text 988. If you are experiencing a
          medical emergency, call 911.
        </Section>

        <Section title="Limitation of liability">
          To the fullest extent permitted by law, Eigen Holdings LLC is not
          liable for any indirect, incidental, or consequential damages arising
          from your use of Ava. Your sole remedy for dissatisfaction with the
          service is to cancel.
        </Section>

        <Section title="Contact">
          Questions about these terms? Email
          <span
            style={{ color: "var(--text-primary)", marginLeft: 4 }}
          >
            legal@withava.co
          </span>
          .
        </Section>
      </article>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 18,
          fontWeight: 400,
          color: "var(--text-primary)",
          letterSpacing: "0.02em",
        }}
      >
        {title}
      </h2>
      <p
        className="mt-2"
        style={{
          color: "var(--text-secondary)",
          fontSize: 14,
          lineHeight: 1.7,
        }}
      >
        {children}
      </p>
    </section>
  );
}
