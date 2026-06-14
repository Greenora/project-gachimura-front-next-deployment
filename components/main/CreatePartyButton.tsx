"use client";

import { useLanguage } from "@/app/hooks/LanguageContext";
import Link from "next/link";

interface CreatePartyButtonProps {
  variant?: "compact" | "floating";
}

export default function CreatePartyButton({ variant = "floating" }: CreatePartyButtonProps) {
  const { texts } = useLanguage();
  const isCompact = variant === "compact";

  return (
    <div className="relative">
      <Link
        href="/create-party"
        aria-label={texts.main.startParty}
        className={`group flex items-center rounded-full bg-[#166534] text-white transition-all focus:outline-none focus:ring-4 focus:ring-green-100 focus:ring-offset-2 hover:bg-[#14532d] active:scale-95 ${
          isCompact
            ? "min-w-[108px] justify-center gap-2 whitespace-nowrap px-4 py-2 text-[13px] font-black shadow-lg shadow-green-900/15 hover:scale-[1.02]"
            : "gap-2.5 px-6 py-3 shadow-2xl shadow-green-900/20 hover:scale-105"
        }`}
      >
        <svg width={isCompact ? 16 : 24} height={isCompact ? 16 : 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:rotate-90" aria-hidden="true">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        <span className={`${isCompact ? "text-[13px]" : "text-[14px]"} font-black tracking-tight`}>
          {texts.main.startParty}
        </span>
      </Link>
    </div>
  );
}
