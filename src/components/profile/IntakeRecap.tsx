import Link from "next/link";
import type { IntakeAnswers } from "@/lib/intakeAnswers";
import { HEALTH_CATEGORY_OPTIONS } from "@/lib/intakeFlow";
import type { HealthCategory } from "@/types";

const DURATION_LABELS: Record<string, string> = {
  lt1mo: "Less than a month",
  "1to3mo": "1-3 months",
  "3to6mo": "3-6 months",
  "6to12mo": "6-12 months",
  gt1yr: "More than a year",
};

const FERTILITY_LABELS: Record<string, string> = {
  yes: "Family planning · in scope",
  no: "No fertility plans",
  maybe: "Family planning · undecided",
};

const PRIOR_EVAL_LABELS: Record<string, string> = {
  yes: "Previously evaluated",
  no: "First evaluation",
  once: "Lapsed evaluation",
};

const CONDITION_LABELS: Record<string, string> = {
  heart: "Heart / blood pressure",
  prostate: "Prostate",
  sleep_apnea: "Sleep apnea",
  diabetes: "Diabetes",
  blood_clots: "Blood clots / DVT",
  polycythemia: "Polycythemia",
};

interface IntakeRecapProps {
  intake: IntakeAnswers;
}

export function IntakeRecap({ intake }: IntakeRecapProps) {
  const conditions = (intake.conditions ?? []).filter((c) => c !== "none");
  const durationLabel = intake.duration
    ? DURATION_LABELS[intake.duration]
    : undefined;

  const primaryConcern = intake.primary_concern as HealthCategory | undefined;
  const concernLabel = primaryConcern
    ? HEALTH_CATEGORY_OPTIONS.find((o) => o.value === primaryConcern)?.label
    : undefined;

  return (
    <section className="section" style={{ paddingBlock: "32px" }}>
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
              What you told us
            </span>
            <Link
              href="/qualify"
              className="mono"
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
                letterSpacing: "0.06em",
                textDecoration: "none",
              }}
            >
              Edit →
            </Link>
          </div>

          <dl
            className="grid grid-cols-1 gap-x-8 gap-y-5 px-6 py-5 sm:grid-cols-2"
            style={{ fontSize: 13.5 }}
          >
            <Row
              label="Primary concern"
              value={
                concernLabel && durationLabel
                  ? `${concernLabel} · ${durationLabel.toLowerCase()}`
                  : concernLabel ?? "—"
              }
              emphasized
            />
            <Row label="Location" value={intake.state ? intake.state : "—"} />
            <Row label="Age" value={intake.age ? `${intake.age}` : "—"} />
            <Row
              label="Prior evaluation"
              value={
                intake.prior_eval ? PRIOR_EVAL_LABELS[intake.prior_eval] : "—"
              }
            />
            <Row
              label="Conditions"
              value={
                conditions.length === 0
                  ? "None reported"
                  : conditions
                      .map((c) => CONDITION_LABELS[c] ?? c)
                      .join(" · ")
              }
            />
            <Row
              label="Medications"
              value={intake.medications?.trim() || "None reported"}
            />
            <Row
              label="Family planning"
              value={
                intake.fertility ? FERTILITY_LABELS[intake.fertility] : "—"
              }
            />
          </dl>
        </div>
      </div>
    </section>
  );
}

function Row({
  label,
  value,
  emphasized,
}: {
  label: string;
  value: string;
  emphasized?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <dt
        className="mono"
        style={{
          fontSize: 10,
          color: "var(--text-muted)",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </dt>
      <dd
        style={{
          color: emphasized ? "var(--text-primary)" : "var(--text-ava)",
          fontSize: emphasized ? 15 : 13.5,
          fontWeight: emphasized ? 500 : 400,
          lineHeight: 1.4,
        }}
      >
        {value}
      </dd>
    </div>
  );
}
