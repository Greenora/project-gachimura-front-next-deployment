"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useLanguage } from "@/app/hooks/LanguageContext";

export default function HeroSection() {
  const { texts } = useLanguage();
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.3], [1, 1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.9]);

  return (
    <motion.section
      style={{ opacity, scale }}
      className="sticky top-0 h-screen flex flex-col items-center justify-center text-center px-4"
    >
      <span className="text-green-600 font-bold text-4xl mb-6 tracking-tight">
        {texts.home.gachimura}
      </span>
      <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-tight mb-6 whitespace-pre-line">
        {texts.home.heroTitle}
      </h1>
      <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto font-medium whitespace-pre-line">
        {texts.home.heroSubtitle}
      </p>
      <div className="absolute bottom-10 animate-bounce text-slate-300">
        <p className="text-sm mb-2">{texts.home.scrollMessage}</p>
        <svg
          className="w-6 h-6 mx-auto"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          ></path>
        </svg>
      </div>
    </motion.section>
  );
}
