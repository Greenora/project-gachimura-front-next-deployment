"use client";

import { Suspense } from "react";
import PartyList from "@/components/main/PartyList";
import { useLanguage } from "@/app/hooks/LanguageContext";

export default function HomePage() {
  const { texts } = useLanguage();

  return (
    <div className="flex flex-col gap-8">
      {/* 제목 및 정렬 */}
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-black text-gray-900 tracking-tight">
          {texts.main.nowRecruiting}
        </h1>
      </div>

      {/* 파티 리스트 그리드 */}
      <Suspense fallback={<div>Loading...</div>}>
        <PartyList />
      </Suspense>
    </div>
  );
}
