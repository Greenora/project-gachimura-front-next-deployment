"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useLanguage } from "@/app/hooks/LanguageContext";

export default function CallToAction() {
  const { texts } = useLanguage();
  return (
    <section className="relative z-10 py-24 md:py-32 flex flex-col items-center justify-center bg-gradient-to-b from-white to-slate-50 border-t border-slate-100">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-2xl px-6"
      >
        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-6 tracking-tight">
          {texts.home.heroTitle.split('\n').join(' ')}
        </h2>
        <p className="text-lg text-slate-600 mb-10 leading-relaxed">
          {texts.home.heroSubtitle.split('\n').join(' ')}
        </p>
        <Link
          href="/login"
          className="inline-block px-12 py-5 bg-slate-900 text-white rounded-full font-bold hover:bg-slate-800 transition-all text-xl shadow-xl hover:shadow-2xl hover:-translate-y-1 active:scale-95"
        >
          {texts.home.toAction}
        </Link>
      </motion.div>
    </section>
  );
}
