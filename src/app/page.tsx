import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { HookReel } from "@/components/landing/HookReel";
import { WhatWeMeasure } from "@/components/landing/WhatWeMeasure";
import { SeeItInAction } from "@/components/landing/SeeItInAction";
import { TrustStrip } from "@/components/landing/TrustStrip";
import { Pricing } from "@/components/landing/Pricing";
import { Testimonials } from "@/components/landing/Testimonials";
import { FAQ } from "@/components/landing/FAQ";
import { LandingFooter } from "@/components/landing/LandingFooter";

/**
 * Landing — multi-section scroll, Hone-register aesthetic.
 * Replaces the original single-screen minimalism per the redesign decision.
 * Cf. docs/business_context.md §13 working principles + the redesign
 * conversation thread.
 */
export default function HomePage() {
  return (
    <main className="flex min-h-dvh flex-col">
      <Hero />
      <SectionAnchor id="how-it-works" />
      <HowItWorks />
      <HookReel />
      <SectionAnchor id="what-we-measure" />
      <WhatWeMeasure />
      <SeeItInAction />
      <TrustStrip />
      <SectionAnchor id="pricing" />
      <Pricing />
      <Testimonials />
      <FAQ />
      <LandingFooter />
    </main>
  );
}

/** Empty anchor so smooth-scroll links from the footer work. */
function SectionAnchor({ id }: { id: string }) {
  return <span id={id} aria-hidden style={{ scrollMarginTop: 24 }} />;
}
