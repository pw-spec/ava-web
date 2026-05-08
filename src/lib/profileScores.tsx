"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { NEUTRAL_SCORES, type HealthScores } from "@/types";
import type { IntakeAnswers } from "@/lib/intakeAnswers";

interface ProfileScoresContextValue {
  /** Current health scores. Defaults to NEUTRAL_SCORES until intake completes. */
  scores: HealthScores;
  /** True once the intake has handed off real scores. */
  hasProfileScores: boolean;
  /** Raw intake answers. Used by /profile to show "what you told us." */
  intake: IntakeAnswers | null;
  /** Called from /qualify on finish — writes both scores and intake. */
  setProfile: (scores: HealthScores, intake: IntakeAnswers) => void;
  /** Legacy entry point that sets scores only (kept for /chat fallback). */
  setProfileScores: (scores: HealthScores) => void;
}

const ProfileScoresContext = createContext<ProfileScoresContextValue | null>(
  null,
);

export function ProfileScoresProvider({ children }: { children: ReactNode }) {
  const [scores, setScores] = useState<HealthScores>(NEUTRAL_SCORES);
  const [intake, setIntake] = useState<IntakeAnswers | null>(null);
  const [hasProfileScores, setHasProfileScores] = useState(false);

  const setProfile = useCallback(
    (nextScores: HealthScores, nextIntake: IntakeAnswers) => {
      setScores(nextScores);
      setIntake(nextIntake);
      setHasProfileScores(true);
    },
    [],
  );

  const setProfileScores = useCallback((nextScores: HealthScores) => {
    setScores(nextScores);
    setHasProfileScores(true);
  }, []);

  const value = useMemo<ProfileScoresContextValue>(
    () => ({
      scores,
      hasProfileScores,
      intake,
      setProfile,
      setProfileScores,
    }),
    [scores, hasProfileScores, intake, setProfile, setProfileScores],
  );

  return (
    <ProfileScoresContext.Provider value={value}>
      {children}
    </ProfileScoresContext.Provider>
  );
}

export function useProfileScores(): ProfileScoresContextValue {
  const value = useContext(ProfileScoresContext);
  if (!value) {
    throw new Error("useProfileScores must be used inside ProfileScoresProvider");
  }
  return value;
}
