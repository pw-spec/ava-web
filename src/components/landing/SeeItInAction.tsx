import Link from "next/link";
import { VideoPlaceholder } from "@/components/video/VideoPlaceholder";

export function SeeItInAction() {
  return (
    <section className="section">
      <div className="section-narrow">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <p className="section-eyebrow">See how Ava works</p>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 200,
              fontSize: "clamp(28px, 4vw, 44px)",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              color: "var(--text-primary)",
              maxWidth: 640,
            }}
          >
            A 60-second walkthrough of the assessment.
          </h2>
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: 15,
              lineHeight: 1.6,
              maxWidth: 540,
            }}
          >
            Ava asks each question. You answer with a tap. Every response
            structures into a clinical intake your provider sees before
            ordering labs.
          </p>
        </div>

        <div className="mx-auto" style={{ maxWidth: 880 }}>
          <VideoPlaceholder
            kind="demo"
            label="Ava intake walkthrough — 60 seconds"
            caption="Click to play (audio on)"
            duration="1:02"
          />
        </div>

        <div className="mt-8 flex justify-center">
          <Link href="/qualify" className="cta-primary">
            Try it yourself
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
              <path
                d="M3 7h8m-3-4 4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
