import type { Brand, BrandConfig } from "@/types";

const fromEnv = process.env.NEXT_PUBLIC_BRAND;

export const BRAND: Brand = fromEnv === "lux" ? "lux" : "ava";

/**
 * Tagline copy comes from docs/business_context.md §4 "Dual-Brand Strategy".
 * - Ava (mainstream / high-performer hook): "You're not lazy. You're depleted."
 * - Lux (performance hook):                  "Can't perform like you used to?"
 *
 * The Ava-mainstream / Lux-performance split exists because the same
 * underlying condition (low T) lives in two completely different psychologies
 * — the CrossFit guy who can't recover and the man who can't perform reach
 * the same clinic via different doors.
 */
export const brandConfig: Record<Brand, BrandConfig> = {
  ava: {
    name: "Ava",
    domain: "withava.co",
    tagline: "You're not lazy. You're depleted.",
    cta: "Talk to me",
    accent: "#0d9488",
    personality: "athletic, warm, evidence-based",
  },
  lux: {
    name: "Lux",
    domain: "withlux.co",
    tagline: "Can't perform like you used to?",
    cta: "Talk to me",
    accent: "#7c3aed",
    personality: "confident, direct, no-judgment",
  },
};
