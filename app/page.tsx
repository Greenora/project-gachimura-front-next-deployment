"use client";

import HeroSection from "@/components/home/HeroSection";
import FeaturesSection from "@/components/home/FeaturesSection";
import CallToAction from "@/components/home/CallToAction";

export default function Home() {
  return (
    <main className="bg-white text-slate-900">
      <HeroSection />
      <FeaturesSection />
      <CallToAction />
    </main>
  );
}