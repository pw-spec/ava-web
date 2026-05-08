/**
 * Wearable + ambient-data provider stubs for Phase 2.5+.
 *
 * Right now nothing is implemented — this file defines the type contract
 * and provider records that future code (and Ava's system prompt) will
 * consume. When Phase 2.5 ships, the `notImplemented` flag flips off and
 * each provider gets a real OAuth + sync implementation.
 *
 * See `docs/PRODUCT_ROADMAP.md` Phase 2.5 + 3 and
 * `src/lib/serviceCatalog.ts` entries `apple-health`, `oura`, `whoop`,
 * `cgm-correlation` for the strategic context.
 */

export type WearableProviderId =
  | "apple_health"
  | "oura"
  | "whoop"
  | "stelo"
  | "lingo";

export type WearableSignal =
  | "hrv"
  | "resting_heart_rate"
  | "sleep_duration"
  | "sleep_stages"
  | "sleep_score"
  | "readiness"
  | "strain"
  | "recovery"
  | "body_temperature"
  | "activity_calories"
  | "steps"
  | "weight"
  | "glucose_continuous";

export interface WearableProvider {
  id: WearableProviderId;
  name: string;
  /** OAuth-only or requires native app for HealthKit / Health Connect? */
  authMethod: "oauth" | "healthkit" | "healthconnect";
  /** Signals we expect to ingest from this provider. */
  supportedSignals: ReadonlyArray<WearableSignal>;
  /** Rough cadence we'd sync data at. */
  syncCadence: "realtime" | "hourly" | "daily" | "on_demand";
  /** Phase from `serviceCatalog.ts`. */
  phase: "phase_2_5" | "phase_3";
  notImplemented: true;
  /** What's needed before we can ship this provider. */
  vendorDependencies: ReadonlyArray<string>;
}

export const WEARABLE_PROVIDERS: ReadonlyArray<WearableProvider> = [
  {
    id: "apple_health",
    name: "Apple Health",
    authMethod: "healthkit",
    supportedSignals: [
      "hrv",
      "resting_heart_rate",
      "sleep_duration",
      "sleep_stages",
      "activity_calories",
      "steps",
      "weight",
    ],
    syncCadence: "daily",
    phase: "phase_2_5",
    notImplemented: true,
    vendorDependencies: [
      "Native iOS app (HealthKit framework)",
      "Apple Developer account + entitlement",
      "Privacy / data-use disclosure to user",
    ],
  },
  {
    id: "oura",
    name: "Oura Ring",
    authMethod: "oauth",
    supportedSignals: [
      "hrv",
      "resting_heart_rate",
      "sleep_duration",
      "sleep_stages",
      "sleep_score",
      "readiness",
      "body_temperature",
    ],
    syncCadence: "daily",
    phase: "phase_2_5",
    notImplemented: true,
    vendorDependencies: [
      "Oura Cloud API v2 access (free developer tier exists)",
      "OAuth client credentials",
    ],
  },
  {
    id: "whoop",
    name: "Whoop",
    authMethod: "oauth",
    supportedSignals: [
      "hrv",
      "resting_heart_rate",
      "sleep_duration",
      "sleep_stages",
      "strain",
      "recovery",
    ],
    syncCadence: "daily",
    phase: "phase_2_5",
    notImplemented: true,
    vendorDependencies: [
      "Whoop developer API access (application required)",
      "OAuth client credentials",
    ],
  },
  {
    id: "stelo",
    name: "Stelo CGM (OTC)",
    authMethod: "oauth",
    supportedSignals: ["glucose_continuous"],
    syncCadence: "realtime",
    phase: "phase_3",
    notImplemented: true,
    vendorDependencies: [
      "Stelo / Dexcom developer API (TBD on developer access for OTC product)",
    ],
  },
  {
    id: "lingo",
    name: "Lingo CGM (OTC)",
    authMethod: "oauth",
    supportedSignals: ["glucose_continuous"],
    syncCadence: "realtime",
    phase: "phase_3",
    notImplemented: true,
    vendorDependencies: [
      "Abbott Lingo developer API access (TBD)",
    ],
  },
];

export function getWearableProvider(
  id: WearableProviderId,
): WearableProvider | undefined {
  return WEARABLE_PROVIDERS.find((p) => p.id === id);
}

export function getWearablesForPhase(
  phase: WearableProvider["phase"],
): ReadonlyArray<WearableProvider> {
  return WEARABLE_PROVIDERS.filter((p) => p.phase === phase);
}

/**
 * Future shape of summarized wearable state per patient. Kept here as a
 * type stub so the rest of the codebase has a stable target to build
 * against. Not yet populated anywhere.
 */
export interface PatientWearableSnapshot {
  patientId: string;
  /** Last sync timestamp per provider. */
  lastSyncAt: Partial<Record<WearableProviderId, number>>;
  /** Rolling 30-day averages, surfaced to Ava's prompt context. */
  averages: {
    hrv30d?: number;
    restingHeartRate30d?: number;
    sleepDuration30dHrs?: number;
    sleepScore30d?: number;
    activityCalories30d?: number;
    glucoseFasting30dMgDl?: number;
  };
  /** Trend deltas vs prior 30 days — feeds Ava's "your HRV is down 18%" line. */
  trends: {
    hrvDeltaPct?: number;
    sleepDurationDeltaPct?: number;
    glucoseFastingDeltaMgDl?: number;
  };
}
