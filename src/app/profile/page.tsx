"use client";

import { ProfileTopBar } from "@/components/profile/ProfileTopBar";
import { ProfileHero } from "@/components/profile/ProfileHero";
import { IntakeRecap } from "@/components/profile/IntakeRecap";
import { ScoreBreakdown } from "@/components/profile/ScoreBreakdown";
import { Interpretation } from "@/components/profile/Interpretation";
import { NextSteps } from "@/components/profile/NextSteps";
import { SyntheticHint } from "@/components/profile/SyntheticHint";
import { ProfileFooter } from "@/components/profile/ProfileFooter";
import {
  classifyScore,
  overallScore,
  severityHeadline,
  weakestCategories,
} from "@/lib/scoring";
import { useProfileScores } from "@/lib/profileScores";
import { HEALTH_CATEGORY_OPTIONS } from "@/lib/intakeFlow";
import type { HealthCategory } from "@/types";

/** Health profile results — see docs/SPEC.md "Page 3: Profile". */
export default function ProfilePage() {
  const { scores, hasProfileScores, intake } = useProfileScores();
  const overall = overallScore(scores);
  const severity = classifyScore(overall);
  const weakest = weakestCategories(scores, 2);
  const subtitle = `${severityHeadline(severity)} — especially ${weakest
    .map((w) => w.label.toLowerCase())
    .join(", ")}`;

  const primaryConcern = intake?.primary_concern as HealthCategory | undefined;
  const concernLabel = primaryConcern
    ? HEALTH_CATEGORY_OPTIONS.find((o) => o.value === primaryConcern)?.label
    : undefined;

  return (
    <main className="flex min-h-dvh flex-col">
      <ProfileTopBar />

      <ProfileHero
        overall={overall}
        severity={severity}
        subtitle={subtitle}
        scores={scores}
      />

      {hasProfileScores && intake && <IntakeRecap intake={intake} />}

      <ScoreBreakdown scores={scores} primary={primaryConcern} />

      <Interpretation
        severity={severity}
        concernLabel={concernLabel}
        duration={intake?.duration}
      />

      <NextSteps />

      {!hasProfileScores && <SyntheticHint />}

      <ProfileFooter />
    </main>
  );
}
