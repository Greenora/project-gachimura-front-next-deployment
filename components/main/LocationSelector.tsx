"use client";

import { useLocation } from "@/app/hooks/useLocation";
import { useLanguage } from "@/app/hooks/LanguageContext";

export default function LocationSelector() {
  const { region, district, isLoading, error, updateLocation } = useLocation();
  const { texts } = useLanguage();

  return (
    <button
      onClick={updateLocation}
      aria-label={texts.main.currentLocation}
      className="flex w-[240px] min-w-[220px] max-w-[240px] items-center gap-2 rounded-full border border-transparent bg-gray-50 px-4 py-2.5 transition-all group hover:border-gray-200 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2"
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
          {isLoading ? (
            <span className="animate-pulse">{texts.main.locating}</span>
          ) : (
            error ? (
              <span className="truncate text-[12px] text-red-500">{texts.main.locationPermissionRequired}</span>
            ) : (
              `${region || texts.main.locating} · ${district || ""}`
            )
          )}
        </span>
      </div>
    </button>
  );
}
