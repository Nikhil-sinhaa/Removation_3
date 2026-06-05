"use client";

import { Hero } from "@/components/landing/Hero";
import { MarqueeBadges } from "@/components/landing/MarqueeBadges";
import { SocialProofStat } from "@/components/landing/SocialProofStat";
import { LogoMarquee } from "@/components/landing/LogoMarquee";
import { ToolsShowcase } from "@/components/landing/ToolsShowcase";
import { OutcomeCards } from "@/components/landing/OutcomeCards";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { RoleCards } from "@/components/landing/RoleCards";
import { Testimonials } from "@/components/landing/Testimonials";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { FAQ } from "@/components/landing/FAQ";

export default function Home() {
  return (
    <div className="bg-black text-white relative">
      {/* 1. Hero Section */}
      <Hero />

      {/* 2. Scrolling Recognition Marquee */}
      <MarqueeBadges />

      {/* 3. Social Proof Stat */}
      <SocialProofStat />

      {/* 4. Scrolling City/Partner Logo Marquee */}
      <LogoMarquee />

      {/* 5. Interactive Tools Showcase */}
      <ToolsShowcase />

      {/* 6. Outcome-focused Value Cards */}
      <OutcomeCards />

      {/* 7. Clear 3-step Workflow */}
      <HowItWorks />

      {/* 8. Ecosystem Role Cards */}
      <RoleCards />

      {/* 9. Minimal Quote Testimonials */}
      <Testimonials />

      {/* 10. High-impact Final CTA */}
      <FinalCTA />

      {/* 11. Custom FAQ Accordion */}
      <FAQ />
    </div>
  );
}