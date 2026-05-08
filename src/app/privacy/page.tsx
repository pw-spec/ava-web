import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — Ava",
};

const LAST_UPDATED = "April 28, 2026";

export default function PrivacyPage() {
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
          Privacy Policy
        </h1>
        <p
          className="mt-2"
          style={{ color: "var(--text-dim)", fontSize: 11 }}
        >
          Last updated {LAST_UPDATED}
        </p>

        <Section title="AI disclosure">
          Ava is an AI health companion built by Eigen Holdings LLC. Ava is
          <strong style={{ color: "var(--text-primary)" }}> not</strong> a
          doctor, nurse, pharmacist, or licensed medical provider. Anything
          Ava says is informational and never a substitute for evaluation by a
          qualified clinician.
        </Section>

        <Section title="What we collect">
          During a conversation Ava may collect: your responses to her
          questions, the symptoms you describe, an aggregate health score, and
          (if you sign up) your email address. If you order a lab kit we
          additionally collect billing and shipping information through our
          payment processor.
        </Section>

        <Section title="How we store it">
          Conversation transcripts and any reported symptoms are stored
          encrypted at rest (AES-256) on our backend, hosted in a HIPAA-aligned
          environment. Frontend pages never persist your health data — every
          session refresh starts fresh in your browser.
        </Section>

        <Section title="Who can see it">
          Your data is shared with the licensed clinicians who review your lab
          results, and with the lab and pharmacy partners required to deliver
          care. We do not sell your data to third parties, and we do not share
          identifiable health information with advertisers.
        </Section>

        <Section title="Cookies and analytics">
          We use a minimal set of analytics that exclude health content — only
          page views, click events, and funnel completion. We do not log the
          contents of conversations to any analytics provider.
        </Section>

        <Section title="Your choices">
          You can request a copy of your data, request deletion, or opt out of
          marketing email at any time by emailing
          <span
            style={{ color: "var(--text-primary)", marginLeft: 4 }}
          >
            privacy@withava.co
          </span>
          .
        </Section>

        <Section title="Crisis resources">
          Ava is not equipped for medical emergencies. If you are in crisis,
          please call or text the 988 Suicide & Crisis Lifeline. If you are
          experiencing a medical emergency, call 911.
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
