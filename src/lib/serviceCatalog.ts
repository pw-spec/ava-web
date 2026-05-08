/**
 * Single source of truth for what services Ava offers, what's planned,
 * and what's explicitly out of scope. Future UI reads from here so a
 * service that's currently `enabled: false` can be turned on by flipping
 * the flag (no UI changes required) once the vendor dependency is met.
 *
 * See `docs/PRODUCT_ROADMAP.md` for the strategic narrative behind each
 * entry, and `docs/VENDOR_CALL_PREP.md` for the conversations needed to
 * unblock each phase.
 */

export type ServiceCategory =
  /** Core TRT pharmacology + monitoring. */
  | "core"
  /** Adjacent men's-health or peptide adds (ED, hair, Sermorelin, etc.). */
  | "adjacent"
  /** Wearable / ambient data integrations. */
  | "wearable"
  /** Advanced biomarker / imaging panels. */
  | "advanced";

export type ServicePhase =
  | "phase_1" // shipping at launch
  | "phase_1_5" // 30-90 days post-launch, vendor-blocked
  | "phase_2" // Month 3-6, backend integration required
  | "phase_2_5" // Month 6-9, wearables / mobile app
  | "phase_3" // Month 9-12, CGM + AI longitudinal
  | "never"; // explicit scope rejection

export type ServiceTier = "base" | "premium";

export interface ServiceDefinition {
  /** Stable ID — used as feature-flag key, never user-visible. */
  id: string;
  /** User-visible name. Keep short. */
  name: string;
  /** Short user-visible description (used in tier feature lists, FAQ). */
  description: string;
  category: ServiceCategory;
  /** Lowest tier that includes this. */
  tierMinimum: ServiceTier;
  /** Roadmap phase (see PRODUCT_ROADMAP.md). */
  phase: ServicePhase;
  /** What we need from a vendor before this can ship. */
  vendorDependencies: ReadonlyArray<string>;
  /** Live/visible in the product? Flip to true once dependencies met. */
  enabled: boolean;
  /** Optional — short note on why this exists / why it doesn't. */
  rationale?: string;
}

export const SERVICE_CATALOG: ReadonlyArray<ServiceDefinition> = [
  // -----------------------------------------------------------------
  // PHASE 1 — Live at launch
  // -----------------------------------------------------------------
  {
    id: "trt-injectable",
    name: "Injectable testosterone",
    description: "Self-administered cypionate or enanthate. Standard TRT first-line.",
    category: "core",
    tierMinimum: "base",
    phase: "phase_1",
    vendorDependencies: [
      "OpenLoop / CareValidate clinician licensure (state-by-state)",
      "Compounding pharmacy partner",
    ],
    enabled: true,
  },
  {
    id: "anastrozole",
    name: "Anastrozole (when clinically indicated)",
    description: "Aromatase inhibitor — reduces estrogen conversion when E2 levels warrant.",
    category: "core",
    tierMinimum: "base",
    phase: "phase_1",
    vendorDependencies: [
      "OpenLoop protocol bundles at no extra cost when E2 indicated",
    ],
    enabled: true,
    rationale:
      "Standard of care for TRT. Henry / Marek / Defy all bundle. Charging extra is predatory.",
  },
  {
    id: "hcg",
    name: "HCG (chorionic gonadotropin)",
    description: "Maintains testicular function during TRT; partial fertility preservation.",
    category: "core",
    tierMinimum: "base",
    phase: "phase_1",
    vendorDependencies: ["OpenLoop protocol", "Compounding pharmacy"],
    enabled: true,
  },
  {
    id: "enclomiphene",
    name: "Enclomiphene (fertility-preserving alternative)",
    description:
      "SERM that boosts endogenous testosterone production — preserves fertility. " +
      "Alternative to TRT for men trying to conceive in the next 1-3 years.",
    category: "core",
    tierMinimum: "base",
    phase: "phase_1",
    vendorDependencies: ["OpenLoop offers protocol", "Compounding pharmacy stocks"],
    enabled: true,
    rationale:
      "Maximus owns the fertility-conscious niche today (Founders Fund $15M, FT 7th-fastest-growing). Adding lets us serve the 28-45 cohort that injectable TRT scares off — ~+15-20% TAM.",
  },
  {
    id: "hormone-panel-base",
    name: "Comprehensive 17+ marker hormone panel",
    description: "Total T, Free T, SHBG, Estradiol, LH, FSH, DHEA-S, Prolactin, TSH, Free T3/T4, plus metabolic markers.",
    category: "advanced",
    tierMinimum: "base",
    phase: "phase_1",
    vendorDependencies: ["Quest Diagnostics partnership confirmed"],
    enabled: true,
  },
  {
    id: "clinician-evaluation",
    name: "Board-certified clinician review",
    description: "Independent licensed clinician reviews intake + labs and makes prescribing decisions.",
    category: "core",
    tierMinimum: "base",
    phase: "phase_1",
    vendorDependencies: ["OpenLoop / CareValidate clinical network"],
    enabled: true,
  },
  {
    id: "ai-intake",
    name: "AI-guided structured assessment",
    description: "Ava conducts a 9-step conversational intake. The differentiator vs every form-based competitor.",
    category: "core",
    tierMinimum: "base",
    phase: "phase_1",
    vendorDependencies: [],
    enabled: true,
  },
  {
    id: "ava-followup",
    name: "Unlimited Ava check-ins",
    description: "Free-form follow-up conversation with Ava post-intake.",
    category: "core",
    tierMinimum: "base",
    phase: "phase_1",
    vendorDependencies: [],
    enabled: true,
  },
  {
    id: "quarterly-monitoring",
    name: "Quarterly lab monitoring",
    description: "Lab redraw every 90 days year 1, every 6 months thereafter.",
    category: "core",
    tierMinimum: "base",
    phase: "phase_1",
    vendorDependencies: ["Quest cadence", "OpenLoop clinical interpretation"],
    enabled: true,
  },
  {
    id: "sermorelin",
    name: "Sermorelin (GH-releasing peptide)",
    description: "For recovery + sleep. Premium tier.",
    category: "adjacent",
    tierMinimum: "premium",
    phase: "phase_1",
    vendorDependencies: [
      "Compounding pharmacy stocks (regulatory scrutiny escalating 2025-2026)",
    ],
    enabled: true,
    rationale: "Marek owns the deep-peptide play; we offer the lighter Sermorelin + NAD+ stack at premium without going full bro.",
  },
  {
    id: "nad-plus",
    name: "NAD+ supplementation",
    description: "Longevity peptide stack adjunct. Premium tier.",
    category: "adjacent",
    tierMinimum: "premium",
    phase: "phase_1",
    vendorDependencies: ["Compounding pharmacy"],
    enabled: true,
  },
  {
    id: "premium-video-consult",
    name: "Quarterly deep-dive video consult",
    description: "30-min synchronous video with the clinician. Premium tier.",
    category: "core",
    tierMinimum: "premium",
    phase: "phase_1",
    vendorDependencies: ["OpenLoop video infrastructure", "Scheduling tooling"],
    enabled: true,
  },

  // -----------------------------------------------------------------
  // PHASE 1.5 — Vendor-blocked, code-light (Month 1-3 post-launch)
  // -----------------------------------------------------------------
  {
    id: "advanced-panel",
    name: "Advanced biomarker panel (~30 markers)",
    description:
      "Adds ApoB, Lp(a), hs-CRP, HbA1c, fasting insulin, ferritin, B12, " +
      "vitamin D, IGF-1, total bilirubin to the base hormone panel. Premium tier.",
    category: "advanced",
    tierMinimum: "premium",
    phase: "phase_1_5",
    vendorDependencies: [
      "Quest panel customization",
      "OpenLoop clinical interpretation review",
    ],
    enabled: false,
    rationale:
      "Hone Premium has 40+ markers; Marek has 60-100+. Our 17-marker base + 3 advanced (IGF-1, hsCRP, ferritin) is structurally light at $299. Expanding to ~30 makes the radar chart more credible without over-claiming Function-Health-tier breadth.",
  },
  {
    id: "premium-async-messaging",
    name: "Async clinician messaging (premium)",
    description: "Patient ↔ clinician messaging post-prescription. Premium-tier first.",
    category: "core",
    tierMinimum: "premium",
    phase: "phase_1_5",
    vendorDependencies: ["OpenLoop messaging API + BAA"],
    enabled: false,
  },

  // -----------------------------------------------------------------
  // PHASE 2 — Backend integration required (Month 3-6)
  // -----------------------------------------------------------------
  {
    id: "ed-treatment",
    name: "ED treatment (sildenafil / tadalafil)",
    description: "Cross-sell for ~70% of TRT patients who also want ED Rx.",
    category: "adjacent",
    tierMinimum: "base",
    phase: "phase_2",
    vendorDependencies: ["OpenLoop ED protocol", "Pharmacy network adds"],
    enabled: false,
    rationale:
      "Highest-ROI cross-sell. Same hormonal/sexual-health frame, no brand dilution. Hims/Henry/Defy all bundle.",
  },
  {
    id: "hair-loss",
    name: "Hair loss (finasteride / minoxidil)",
    description: "Hormone-mediated (DHT pathway). Fits clinical scope.",
    category: "adjacent",
    tierMinimum: "base",
    phase: "phase_2",
    vendorDependencies: ["OpenLoop protocol", "Pharmacy network adds"],
    enabled: false,
    rationale: "Common adjunct for men optimizing across the same axis. Hims and Hone offer.",
  },
  {
    id: "async-messaging-base",
    name: "Async clinician messaging (base)",
    description: "Move messaging from premium-only to all-tier once stable.",
    category: "core",
    tierMinimum: "base",
    phase: "phase_2",
    vendorDependencies: ["Phase 1.5 premium messaging proven"],
    enabled: false,
  },
  {
    id: "refill-self-service",
    name: "Self-service refill request",
    description: "Patient initiates a refill from /profile; clinician approves async.",
    category: "core",
    tierMinimum: "base",
    phase: "phase_2",
    vendorDependencies: ["OpenLoop refill API"],
    enabled: false,
  },

  // -----------------------------------------------------------------
  // PHASE 2.5 — Wearables (Month 6-9)
  // -----------------------------------------------------------------
  {
    id: "apple-health",
    name: "Apple Health import",
    description: "HRV, sleep stages, activity, weight feed Ava's interpretation layer.",
    category: "wearable",
    tierMinimum: "base",
    phase: "phase_2_5",
    vendorDependencies: [
      "Native iOS app (HealthKit) OR Apple Health Records subset",
      "Apple Developer entitlement",
    ],
    enabled: false,
  },
  {
    id: "oura",
    name: "Oura Ring integration",
    description: "HRV, sleep, readiness, body temperature.",
    category: "wearable",
    tierMinimum: "premium",
    phase: "phase_2_5",
    vendorDependencies: ["Oura developer API access (OAuth, free tier exists)"],
    enabled: false,
    rationale: "Best first wearable to ship — pure OAuth, no native app required.",
  },
  {
    id: "whoop",
    name: "Whoop integration",
    description: "Strain, recovery, HRV, sleep.",
    category: "wearable",
    tierMinimum: "premium",
    phase: "phase_2_5",
    vendorDependencies: ["Whoop developer API access"],
    enabled: false,
  },
  {
    id: "ava-wearable-interpretation",
    name: "Ava references wearable data in conversation",
    description:
      "Ava can ask about HRV trends, sleep stages, activity drops in the post-intake chat. " +
      "This is the moat material — symptoms × biomarkers × ambient data.",
    category: "core",
    tierMinimum: "base",
    phase: "phase_2_5",
    vendorDependencies: [
      "At least one wearable provider live",
      "Backend stores summarized wearable state per patient",
      "Claude system-prompt updated to access summarized wearable state",
    ],
    enabled: false,
    rationale:
      "Real moat material — Hone, Henry, Marek structurally cannot replicate without rebuilding their stack. They don't have the AI conversation layer.",
  },

  // -----------------------------------------------------------------
  // PHASE 3 — CGM + AI longitudinal (Month 9-12)
  // -----------------------------------------------------------------
  {
    id: "cgm-correlation",
    name: "CGM correlation (Stelo / Lingo)",
    description: "Continuous glucose data correlated with hormonal + lab patterns.",
    category: "wearable",
    tierMinimum: "premium",
    phase: "phase_3",
    vendorDependencies: [
      "Stelo or Lingo OAuth API",
      "Backend pattern-detection layer",
    ],
    enabled: false,
    rationale: "Where Ava begins to overlap with Levels for metabolic optimization. Differentiates from pure-TRT competitors.",
  },
  {
    id: "longitudinal-pattern-ai",
    name: "AI-driven longitudinal pattern detection",
    description:
      'When a patient asks "why is my recovery still bad?", Ava correlates ' +
      "free T × HRV × glucose × sleep and gives a multi-factor read instead " +
      "of just hormone numbers.",
    category: "core",
    tierMinimum: "premium",
    phase: "phase_3",
    vendorDependencies: [
      "Stored historical biomarkers + wearable data",
      "Claude system-prompt update with multi-source context",
    ],
    enabled: false,
  },
  {
    id: "before-after-radar",
    name: "Before/after radar comparison (Day 90 / 180 / 365)",
    description: "Show protocol effects over time on /profile.",
    category: "core",
    tierMinimum: "base",
    phase: "phase_3",
    vendorDependencies: ["Stored historical biomarkers"],
    enabled: false,
  },

  // -----------------------------------------------------------------
  // NEVER — explicit scope rejections
  // -----------------------------------------------------------------
  {
    id: "glp-1",
    name: "GLP-1 weight loss",
    description: "Wegovy / Zepbound / compounded semaglutide.",
    category: "adjacent",
    tierMinimum: "base",
    phase: "never",
    vendorDependencies: [],
    enabled: false,
    rationale:
      "Crowded by Hims + Henry + Hone. Wegovy at $149 destroyed the pricing arbitrage. Regulatory whiplash on compounding (NextMed enforcement Dec 2025; FDA bulk-list scrutiny). Different patient psychology — they want to be 'thin', not 'optimized'. Let competitors burn cash here.",
  },
  {
    id: "womens-hrt",
    name: "Women's HRT / perimenopause",
    description: "Estradiol, progesterone, women's TRT.",
    category: "adjacent",
    tierMinimum: "base",
    phase: "never",
    vendorDependencies: [],
    enabled: false,
    rationale:
      "Breaks men-focused brand. Different system prompt, different intake language, different psychology. Hone serves both — let them. Lux (sister brand) targets women indirectly via sexual-performance hook.",
  },
  {
    id: "mental-health-rx",
    name: "Mental health Rx (SSRIs)",
    description: "Anxiety / depression prescribing.",
    category: "adjacent",
    tierMinimum: "base",
    phase: "never",
    vendorDependencies: [],
    enabled: false,
    rationale:
      "Different prescribing comfort, state-by-state controls, no TRT synergy beyond marketing. Hims has it — they bill mental health $49/mo and burn clinician time we don't have.",
  },
  {
    id: "iv-therapy",
    name: "IV therapy / NAD+ infusions in-clinic",
    description: "Defy-style menu.",
    category: "adjacent",
    tierMinimum: "base",
    phase: "never",
    vendorDependencies: [],
    enabled: false,
    rationale: "Requires physical clinics or partner network. Off-brand for a digital-first AI product. Hone partners with ivee.",
  },
  {
    id: "ketamine",
    name: "Ketamine therapy",
    description: "Defy offers it.",
    category: "adjacent",
    tierMinimum: "base",
    phase: "never",
    vendorDependencies: [],
    enabled: false,
    rationale: "Different specialty entirely. Founder has no domain expertise. Off-brand.",
  },
  {
    id: "owned-imaging",
    name: "Owned full-body MRI / DEXA infrastructure",
    description: "Hone partners with Prenuvo + BodySpec.",
    category: "advanced",
    tierMinimum: "premium",
    phase: "never",
    vendorDependencies: [],
    enabled: false,
    rationale: "Capital-intensive. Partner if at all, but skip until Year 2.",
  },
];

// ----- Selectors / helpers -------------------------------------------

/** Services live in the product right now (UI should display these). */
export function getEnabledServices(): ReadonlyArray<ServiceDefinition> {
  return SERVICE_CATALOG.filter((s) => s.enabled);
}

/** Services in a specific tier that are currently live. */
export function getEnabledServicesForTier(
  tier: ServiceTier,
): ReadonlyArray<ServiceDefinition> {
  return SERVICE_CATALOG.filter(
    (s) =>
      s.enabled &&
      (tier === "premium" || s.tierMinimum === "base"),
  );
}

/** Services planned for a given phase — for roadmap UI / internal dashboards. */
export function getServicesForPhase(
  phase: ServicePhase,
): ReadonlyArray<ServiceDefinition> {
  return SERVICE_CATALOG.filter((s) => s.phase === phase);
}

export function isServiceEnabled(id: string): boolean {
  return SERVICE_CATALOG.find((s) => s.id === id)?.enabled === true;
}
