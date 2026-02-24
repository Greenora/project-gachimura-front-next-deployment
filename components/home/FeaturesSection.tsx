"use client";

import FeatureItem from "./FeatureItem";
import { useLanguage } from "@/app/hooks/LanguageContext";

export default function FeaturesSection() {
  const { texts } = useLanguage();
  return (
    <section className="relative z-10 bg-slate-50 py-32 px-4">
      <div className="max-w-5xl mx-auto space-y-40">
        <FeatureItem
          title={texts.home.feature1Title}
          description={texts.home.feature1Desc}
          image="/neighborhood-sharing.png"
        />
        <FeatureItem
          title={texts.home.feature2Title}
          description={texts.home.feature2Desc}
          image="/smart-split.png"
          reverse
        />
      </div>
    </section>
  );
}
