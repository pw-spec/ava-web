"use client";

import { useState } from "react";
import { LabsTopBar } from "@/components/labs/LabsTopBar";
import { LabsHero } from "@/components/labs/LabsHero";
import { IncludedPanel } from "@/components/labs/IncludedPanel";
import { ProcessSteps } from "@/components/labs/ProcessSteps";
import {
  TierPicker,
  type Tier,
  type TierName,
} from "@/components/labs/TierPicker";
import { DisclosureGate } from "@/components/labs/DisclosureGate";
import { LabsFooter } from "@/components/labs/LabsFooter";

// PRICING — keep in sync with src/components/landing/Pricing.tsx and
// docs/business_context.md §6. See May 2026 audit for the rationale on
// $199 / $299 (avoids the contested $129-179 mid-market lane).
const TIERS: ReadonlyArray<Tier> = [
  {
    name: "Base",
    price: 199,
    blurb: "Assessment, lab panel, clinician review, and TRT if appropriate.",
    highlight: false,
  },
  {
    name: "Premium",
    price: 299,
    blurb:
      "Base plus peptides, longevity stack, advanced markers, quarterly video consult.",
    highlight: true,
  },
];

export default function LabsPage() {
  const [acknowledged, setAcknowledged] = useState(false);
  const [tier, setTier] = useState<TierName>("Base");
  const [checkoutNotice, setCheckoutNotice] = useState(false);

  const handleStart = () => {
    if (!acknowledged) return;
    setCheckoutNotice(true);
  };

  const selectedTier = TIERS.find((t) => t.name === tier) ?? TIERS[0];

  return (
    <main className="flex min-h-dvh flex-col">
      <LabsTopBar />
      <LabsHero />
      <IncludedPanel />
      <ProcessSteps />
      <TierPicker tiers={TIERS} selected={tier} onSelect={setTier} />
      <DisclosureGate
        tierName={selectedTier.name}
        tierPrice={selectedTier.price}
        acknowledged={acknowledged}
        onToggle={setAcknowledged}
        onStart={handleStart}
        checkoutNotice={checkoutNotice}
      />
      <LabsFooter />
    </main>
  );
}
