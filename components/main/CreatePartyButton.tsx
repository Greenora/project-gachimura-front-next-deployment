"use client";

import { useLanguage } from "@/app/hooks/LanguageContext";
import Link from "next/link";

export default function CreatePartyButton() {
  const { texts } = useLanguage();

  return (
    <div className="fixed bottom-10 right-10 z-[100]">
      <Link
        href="/create-party"
        aria-label={texts.main.startParty}
        className="flex items-center gap-2.5 px-6 py-3 bg-[#166534] hover:bg-[#14532d] shadow-2xl shadow-green-900/20 text-white rounded-full transition-all hover:scale-105 active:scale-95 group focus:outline-none focus:ring-4 focus:ring-green-100 focus:ring-offset-2"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:rotate-90" aria-hidden="true">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        <span className="text-[14px] font-black tracking-tight">{texts.main.startParty}</span>
      </Link>
    </div>
  );
}
