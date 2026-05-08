"use client";

import { useEffect, useRef, useState, useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { IntakeShell } from "@/components/intake/IntakeShell";
import { AvaQuestion } from "@/components/intake/AvaQuestion";
import { SingleSelect } from "@/components/intake/inputs/SingleSelect";
import { MultiSelect } from "@/components/intake/inputs/MultiSelect";
import { StateDropdown } from "@/components/intake/inputs/StateDropdown";
import { AgeInput } from "@/components/intake/inputs/AgeInput";
import { TextInput } from "@/components/intake/inputs/TextInput";
import { StateWaitlist } from "@/components/intake/StateWaitlist";
import { INTAKE_FLOW, TOTAL_STEPS, type IntakeStep } from "@/lib/intakeFlow";
import {
  deriveScoresFromIntake,
  type IntakeAnswers,
} from "@/lib/intakeAnswers";
import { isStateAvailable } from "@/lib/launchStates";
import { captureWaitlistEntry } from "@/lib/waitlist";
import { useProfileScores } from "@/lib/profileScores";
import type { HealthCategory } from "@/types";

type AnswerMap = Record<string, unknown>;

export default function QualifyPage() {
  const router = useRouter();
  const { setProfile } = useProfileScores();

  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [submitting, setSubmitting] = useState(false);
  const [blockedStateCode, setBlockedStateCode] = useState<string | null>(null);

  // Container ref so we can move focus to the first interactive element on
  // each step transition — keyboard users land in the answer area, not back
  // on the previous Continue button.
  const stepContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!stepContainerRef.current) return;
    if (blockedStateCode) return; // waitlist UI manages its own focus
    const focusable = stepContainerRef.current.querySelector<HTMLElement>(
      'button[type="button"]:not([disabled]), input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    focusable?.focus({ preventScroll: true });
  }, [stepIndex, blockedStateCode]);

  const step: IntakeStep | undefined = INTAKE_FLOW[stepIndex];
  const currentValue = step ? answers[step.field] : undefined;
  const valid = step ? step.validate(currentValue) : false;

  const setAnswer = useCallback(
    (field: string, value: unknown) => {
      setAnswers((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const advance = useCallback(() => {
    if (!step || !valid) return;

    // Geo-gate at the state-of-residence step. We do not enroll patients in
    // blocked states (NY day 1; CA deferred — see src/lib/launchStates.ts).
    if (step.field === "state" && typeof currentValue === "string") {
      if (!isStateAvailable(currentValue)) {
        setBlockedStateCode(currentValue);
        return;
      }
    }

    if (stepIndex < TOTAL_STEPS - 1) {
      setStepIndex((i) => i + 1);
      return;
    }
    // Final step — derive scores, hand off both scores + raw intake, navigate.
    setSubmitting(true);
    const intake: IntakeAnswers = answers as IntakeAnswers;
    const derived = deriveScoresFromIntake(intake);
    setProfile(derived, intake);
    window.setTimeout(() => router.push("/profile"), 900);
  }, [answers, currentValue, router, setProfile, step, stepIndex, valid]);

  const handleWaitlistSubmit = useCallback(
    (email: string) => {
      void captureWaitlistEntry({
        state: blockedStateCode ?? "unknown",
        email,
        source: "qualify-state-block",
      });
    },
    [blockedStateCode],
  );

  const handlePickDifferentState = useCallback(() => {
    setBlockedStateCode(null);
    setAnswers((prev) => ({ ...prev, state: undefined }));
  }, []);

  const goBack = useCallback(() => {
    if (stepIndex > 0) setStepIndex((i) => i - 1);
  }, [stepIndex]);

  // Allow Enter to advance for inputs that don't have their own form
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter" && valid && !submitting) {
        e.preventDefault();
        advance();
      }
    },
    [advance, submitting, valid],
  );

  if (!step) return null;

  // Resolve initial value defaults per input kind so the input is controlled.
  const ensuredValue = ensureValue(step, currentValue);

  // Geo-gated short-circuit — replaces the rest of the intake with the
  // waitlist UI when the user picked a state we don't yet serve.
  if (blockedStateCode) {
    return (
      <IntakeShell current={1} total={TOTAL_STEPS}>
        <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-7 px-5 py-8 sm:px-6 sm:py-10">
          <StateWaitlist
            stateCode={blockedStateCode}
            onSubmit={handleWaitlistSubmit}
            onPickDifferentState={handlePickDifferentState}
          />
        </div>
      </IntakeShell>
    );
  }

  return (
    <IntakeShell current={stepIndex + 1} total={TOTAL_STEPS}>
      <div
        ref={stepContainerRef}
        className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-7 px-5 py-8 sm:px-6 sm:py-10"
        onKeyDown={onKeyDown}
      >
        <AvaQuestion
          stepId={step.id}
          message={step.ava}
          helper={step.helper}
        />

        <div className="question-in" style={{ animationDelay: "120ms" }}>
          {renderInput(step, ensuredValue, (v) => setAnswer(step.field, v))}
        </div>

        <div className="mt-auto flex flex-col items-stretch gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={goBack}
            disabled={stepIndex === 0 || submitting}
            className="cta-secondary"
            style={{
              opacity: stepIndex === 0 ? 0.35 : 1,
              cursor: stepIndex === 0 ? "not-allowed" : "pointer",
              minWidth: 110,
            }}
          >
            ← Back
          </button>

          <button
            type="button"
            onClick={advance}
            disabled={!valid || submitting}
            className="cta-primary"
            style={{ minWidth: 200 }}
          >
            {submitting
              ? "Building your profile…"
              : stepIndex === TOTAL_STEPS - 1
                ? "Finish — show my profile"
                : "Continue"}
            {!submitting && (
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
            )}
          </button>
        </div>
      </div>
    </IntakeShell>
  );
}

/** Make sure the controlled input always has a sensible value. */
function ensureValue(step: IntakeStep, current: unknown): unknown {
  switch (step.input.kind) {
    case "age":
      return typeof current === "number" ? current : step.input.default;
    case "multi":
      return Array.isArray(current) ? current : [];
    case "state":
    case "single":
    case "yesno":
    case "text":
    case "email":
      return typeof current === "string" ? current : "";
  }
}

function renderInput(
  step: IntakeStep,
  value: unknown,
  set: (v: unknown) => void,
): ReactNode {
  const inp = step.input;
  switch (inp.kind) {
    case "state":
      return (
        <StateDropdown
          value={typeof value === "string" ? value : ""}
          onChange={(v) => set(v)}
        />
      );
    case "age":
      return (
        <AgeInput
          value={typeof value === "number" ? value : inp.default}
          min={inp.min}
          max={inp.max}
          onChange={(v) => set(v)}
        />
      );
    case "single":
      return (
        <SingleSelect
          options={inp.options}
          value={typeof value === "string" ? value : undefined}
          onChange={(v) => set(v)}
        />
      );
    case "multi":
      return (
        <MultiSelect
          options={inp.options}
          value={Array.isArray(value) ? (value as string[]) : []}
          onChange={(v) => set(v)}
          noneValue={inp.noneValue}
          noneLabel={inp.noneLabel}
        />
      );
    case "yesno":
      return (
        <SingleSelect
          options={inp.options}
          value={typeof value === "string" ? value : undefined}
          onChange={(v) => set(v)}
          variant="compact"
        />
      );
    case "text":
      return (
        <TextInput
          value={typeof value === "string" ? value : ""}
          placeholder={inp.placeholder}
          onChange={(v) => set(v)}
          multiline
          autoFocus
        />
      );
    case "email":
      return (
        <TextInput
          value={typeof value === "string" ? value : ""}
          placeholder="you@example.com"
          inputType="email"
          onChange={(v) => set(v)}
          autoFocus
        />
      );
  }
}

// Re-export so HEALTH_CATEGORY type is reachable for tests if needed.
export type { HealthCategory };
