"use client";

import { useLocation } from "@/app/hooks/useLocation";
import { useLanguage } from "@/app/hooks/LanguageContext";
import { Language } from "@/app/common/types";

export default function LocationSelector() {
  const { region, district, isLoading, error, updateLocation } = useLocation();
  const { texts, lang } = useLanguage();

  const displayLocationText = (() => {
    if (isLoading) return <span className="animate-pulse">{texts.main.locating}</span>;
    if (error) return <span className="truncate text-[12px] text-red-500">{texts.main.locationPermissionRequired}</span>;
    if (region && district) return `${region} · ${district}`;
    if (region) return region;
    return texts.main.currentLocation;
  })();

  return (
    <div className="min-w-0 w-full max-w-[240px] justify-self-end sm:w-[240px] sm:shrink-0">
    <button
      onClick={updateLocation}
      aria-label={texts.main.currentLocation}
      disabled={isLoading}
      className="flex min-h-11 w-full items-center gap-2 rounded-full border border-transparent bg-gray-50 px-3 sm:px-4 py-2.5 transition-all group hover:border-gray-200 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 disabled:opacity-70"
    >
      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-green-700 shadow-sm transition-transform group-hover:scale-110">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
      </div>

      <div className="min-w-0 flex-1 flex flex-col items-start pr-1">
        <span className="w-full truncate text-[11px] font-bold leading-tight text-gray-400">{texts.main.currentLocation}</span>
        <span className="w-full truncate text-[14px] font-black leading-tight text-gray-900" aria-live="polite">
          {displayLocationText}
        </span>
      </div>
    </button>
    {error && (
      <p role="status" className="mt-1 text-xs leading-relaxed text-gray-600">
        {lang === Language.japanese ? "位置情報がなくても検索・絞り込みを利用できます。" : "위치 없이도 검색과 필터를 이용할 수 있어요."}
      </p>
    )}
    </div>
  );
}
