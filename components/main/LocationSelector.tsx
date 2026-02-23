"use client";

import { useLocation } from "@/app/hooks/useLocation";
import { useLanguage } from "@/app/hooks/LanguageContext";

export default function LocationSelector() {
  const { region, district, isLoading, updateLocation } = useLocation();
  const { texts } = useLanguage();

  return (
    <button
      onClick={updateLocation}
      className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 rounded-full transition-all group border border-transparent hover:border-gray-200"
    >
      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-green-700 shadow-sm transition-transform group-hover:scale-110">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
      </div>

      <div className="flex flex-col items-start pr-2">
        <span className="text-[11px] font-bold text-gray-400 leading-tight">{texts.main.currentLocation}</span>
        <span className="text-[14px] font-black text-gray-900 leading-tight">
          {isLoading ? (
            <span className="animate-pulse">{texts.main.locating}</span>
          ) : (
            `${region || texts.main.locating} · ${district || ""}`
          )}
        </span>
      </div>
    </button>
  );
}
