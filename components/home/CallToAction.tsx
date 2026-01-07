"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useLanguage } from "@/app/hooks/LanguageContext";

export default function CallToAction() {
  const { texts } = useLanguage();
  return (
    <section className="h-screen flex flex-col items-center justify-center bg-white">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center"
      >
        <h2 className="text-4xl md:text-5xl font-bold mb-8">{texts.home.toAction}</h2>
        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <Link
            href="/login"
            className="px-10 py-4 bg-slate-900 text-white rounded-full font-bold hover:bg-slate-800 transition-all text-lg"
          >
            {texts.common.login}
          </Link>
          <Link
            href="/signup"
            className="px-10 py-4 bg-white border-2 border-slate-900 text-slate-900 rounded-full font-bold hover:bg-slate-50 transition-all text-lg"
          >
            {texts.common.signup}
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
