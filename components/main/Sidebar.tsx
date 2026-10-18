"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Suspense } from "react";
import { useLanguage } from "@/app/hooks/LanguageContext";

function SidebarContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { texts } = useLanguage();

  const isCommunity = pathname.startsWith("/community");

  const filter = searchParams.get("filter") || (isCommunity ? "latest" : "latest");
  const showCompleted = searchParams.get("completed") !== "false"; // 기본값 true

  const updateParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    // 현재 페이지 경로에 맞게 이동 (커뮤니티면 /community, 홈이면 /home)
    const basePath = isCommunity ? "/community" : "/home";
    router.push(`${basePath}?${params.toString()}`, { scroll: false });
  };

  // 커뮤니티 페이지 사이드바
  if (isCommunity) {
    return (
      <>
      <label className="flex flex-col gap-2 text-sm font-bold text-gray-700 md:hidden">
        {texts.main.communitySidebarTitle}
        <select
          value={filter}
          onChange={event => updateParams("filter", event.target.value)}
          className="min-h-11 rounded-xl border border-gray-200 bg-white px-3 text-gray-900"
        >
          <option value="latest">{texts.main.communityLatest}</option>
          <option value="popular">{texts.main.communityPopular}</option>
          <option value="comments">{texts.main.communityMostComments}</option>
        </select>
      </label>
      <aside className="w-64 flex-shrink-0 pr-8 hidden md:block">
        <div className="sticky top-[104px] space-y-10">
          <div>
            <h2 className="text-[18px] font-black text-gray-900 mb-6">{texts.main.communitySidebarTitle}</h2>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => updateParams("filter", "latest")}
                aria-pressed={filter === "latest"}
                className={`w-fit px-6 py-2.5 rounded-full text-[13px] font-bold transition-all focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 ${filter === "latest"
                  ? "bg-gray-900 text-white shadow-lg shadow-gray-200"
                  : "bg-white text-gray-500 border border-gray-100 hover:border-gray-300"
                  }`}
              >
                {texts.main.communityLatest}
              </button>
              <button
                onClick={() => updateParams("filter", "popular")}
                aria-pressed={filter === "popular"}
                className={`w-fit px-6 py-2.5 rounded-full text-[13px] font-bold transition-all focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 ${filter === "popular"
                  ? "bg-gray-900 text-white shadow-lg shadow-gray-200"
                  : "bg-white text-gray-500 border border-gray-100 hover:border-gray-300"
                  }`}
              >
                {texts.main.communityPopular}
              </button>
              <button
                onClick={() => updateParams("filter", "comments")}
                aria-pressed={filter === "comments"}
                className={`w-fit px-6 py-2.5 rounded-full text-[13px] font-bold transition-all focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 ${filter === "comments"
                  ? "bg-gray-900 text-white shadow-lg shadow-gray-200"
                  : "bg-white text-gray-500 border border-gray-100 hover:border-gray-300"
                  }`}
              >
                {texts.main.communityMostComments}
              </button>
            </div>
          </div>
        </div>
      </aside>
      </>
    );
  }

  // 홈(파티) 페이지 사이드바 (기존 로직)
  return (
    <>
    <div className="flex flex-col gap-2 md:hidden">
      <label className="flex flex-col gap-2 text-sm font-bold text-gray-700">
        {texts.main.sidebarTitle}
        <select
          value={filter}
          onChange={event => updateParams("filter", event.target.value)}
          className="min-h-11 rounded-xl border border-gray-200 bg-white px-3 text-gray-900"
        >
          <option value="latest">{texts.main.latest}</option>
          <option value="imminent">{texts.main.imminent}</option>
        </select>
      </label>
      <label className="flex min-h-11 items-center gap-3 text-sm font-bold text-gray-700">
        <input
          type="checkbox"
          checked={showCompleted}
          onChange={event => updateParams("completed", String(event.target.checked))}
          className="h-5 w-5 accent-green-700"
        />
        {texts.main.showCompleted}
      </label>
    </div>
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
    </>
  );
}

export default function Sidebar() {
  return (
    <Suspense fallback={<div className="w-64 flex-shrink-0 pr-8 hidden md:block" />}>
      <SidebarContent />
    </Suspense>
  );
}
