"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useLanguage } from "@/app/hooks/LanguageContext";

function SidebarContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { texts } = useLanguage();

  const filter = searchParams.get("filter") || "latest";
  const showCompleted = searchParams.get("completed") !== "false"; // 기본값 true

  const updateParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.push(`/home?${params.toString()}`, { scroll: false });
  };

  return (
    <aside className="w-64 flex-shrink-0 pr-8 hidden md:block">
      <div className="sticky top-[104px] space-y-10">
        {/* 필터 타이틀 */}
        <div>
          <h2 className="text-[18px] font-black text-gray-900 mb-6">{texts.main.sidebarTitle}</h2>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => updateParams("filter", "latest")}
              aria-pressed={filter === "latest"}
              className={`w-fit px-6 py-2.5 rounded-full text-[13px] font-bold transition-all focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 ${filter === "latest"
                ? "bg-gray-900 text-white shadow-lg shadow-gray-200"
                : "bg-white text-gray-500 border border-gray-100 hover:border-gray-300"
                }`}
            >
              {texts.main.latest}
            </button>
            <button
              onClick={() => updateParams("filter", "imminent")}
              aria-pressed={filter === "imminent"}
              className={`w-fit px-6 py-2.5 rounded-full text-[13px] font-bold transition-all focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 ${filter === "imminent"
                ? "bg-gray-900 text-white shadow-lg shadow-gray-200"
                : "bg-white text-gray-500 border border-gray-100 hover:border-gray-300"
                }`}
            >
              {texts.main.imminent}
            </button>
          </div>
        </div>

        {/* 구분선 */}
        <div className="h-[1px] bg-gray-100 w-full" />

        {/* 옵션 */}
        <button
          className="flex items-center gap-3 group cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-4 rounded-lg p-1"
          onClick={() => updateParams("completed", showCompleted ? "false" : "true")}
          role="checkbox"
          aria-checked={showCompleted}
        >
          <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${showCompleted ? "bg-[#166534]" : "border-2 border-gray-200 bg-white"
            }`}>
            {showCompleted && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            )}
          </div>
          <span className="text-[14px] font-bold text-gray-700 select-none">{texts.main.showCompleted}</span>
        </button>
      </div>
    </aside>
  );
}

export default function Sidebar() {
  return (
    <Suspense fallback={<div className="w-64 flex-shrink-0 pr-8 hidden md:block" />}>
      <SidebarContent />
    </Suspense>
  );
}
