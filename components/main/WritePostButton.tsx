"use client";

import Link from "next/link";
import { useLanguage } from "@/app/hooks/LanguageContext";
import { Language } from "@/app/common/types";

interface WritePostButtonProps {
  variant?: "compact" | "floating";
}

export default function WritePostButton({ variant = "compact" }: WritePostButtonProps) {
  const { lang } = useLanguage();
  const isCompact = variant === "compact";
  const label = lang === Language.japanese ? "投稿する" : "글쓰기";

  return (
    <Link
      href="/community?compose=1"
      aria-label={label}
      className={`group inline-flex items-center rounded-full bg-[#166534] text-white transition-all hover:bg-[#14532d] active:scale-95 ${
        isCompact
          ? "min-w-[88px] justify-center gap-2 whitespace-nowrap px-4 py-2 text-[13px] font-black shadow-lg shadow-green-900/15 hover:scale-[1.02]"
          : "gap-2.5 px-6 py-3 text-[14px] font-black shadow-2xl shadow-green-900/20 hover:scale-105"
      }`}
    >
      <svg width={isCompact ? 16 : 24} height={isCompact ? 16 : 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:rotate-90" aria-hidden="true">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
      <span>{label}</span>
    </Link>
  );
}
