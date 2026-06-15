"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/app/hooks/LanguageContext";
import { Language } from "@/app/common/types";
import { clientFetch } from "@/app/hooks/useClientFetch";

interface TrendingTopic {
  tag: string;
  count: number;
}

export default function HomeCommunityTabs() {
  const pathname = usePathname();
  const { lang } = useLanguage();
  const [topTopic, setTopTopic] = useState<TrendingTopic | null>(null);
  const isCommunity = pathname.startsWith("/community");
  const activeIndex = isCommunity ? 1 : 0;

  const ariaLabel = lang === Language.japanese ? "ページ切り替え" : "페이지 전환";
  const homeLabel = lang === Language.japanese ? "ホーム" : "홈";
  const communityLabel = lang === Language.japanese ? "コミュニティ" : "커뮤니티";
  const topicLabel = lang === Language.japanese ? "今日の話題" : "오늘의 토픽";
  const aiChatLabel = lang === Language.japanese ? "AIレシピ推薦" : "AI 요리 추천";
  const communityLocale = lang === Language.japanese ? "ja" : "ko";

  useEffect(() => {
    if (!isCommunity) {
      return;
    }

    let isMounted = true;

    const fetchTrending = async () => {
      try {
        const data = await clientFetch<{ topics: TrendingTopic[] }>(
          `/community/topics/trending?limit=1&locale=${communityLocale}`,
        );
        if (isMounted) {
          setTopTopic(data?.topics?.[0] || null);
        }
      } catch {
        if (isMounted) {
          setTopTopic(null);
        }
      }
    };

    fetchTrending();

    return () => {
      isMounted = false;
    };
  }, [isCommunity, communityLocale]);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 md:flex-nowrap" role="navigation" aria-label={ariaLabel}>
      <div className="relative grid h-[58px] w-[282px] grid-cols-2 rounded-full bg-gray-100 p-1">
        <span
          aria-hidden="true"
          className={`absolute bottom-1 left-1 top-1 w-[calc(50%-4px)] rounded-full bg-white shadow-sm transition-transform duration-300 ${
            activeIndex === 1 ? "translate-x-full" : "translate-x-0"
          }`}
        />

        <Link
          href="/home"
          className={`relative z-10 flex h-[50px] items-center justify-center whitespace-nowrap rounded-full px-3 text-center text-[13px] font-bold leading-none tracking-tight transition-colors sm:text-sm ${
            activeIndex === 0 ? "text-green-700" : "text-gray-500 hover:text-gray-800"
          }`}
          aria-current={activeIndex === 0 ? "page" : undefined}
        >
          {homeLabel}
        </Link>

        <Link
          href="/community"
          className={`relative z-10 flex h-[50px] items-center justify-center whitespace-nowrap rounded-full px-3 text-center text-[13px] font-bold leading-none tracking-tight transition-colors sm:text-sm ${
            activeIndex === 1 ? "text-green-700" : "text-gray-500 hover:text-gray-800"
          }`}
          aria-current={activeIndex === 1 ? "page" : undefined}
        >
          {communityLabel}
        </Link>
      </div>

      <div className="flex items-center gap-2 md:shrink-0">
        {isCommunity && (
          <span className="hidden max-w-[180px] truncate rounded-full border border-green-100 bg-green-50 px-3 py-1 text-[12px] font-bold text-green-700 sm:inline-flex">
            {topicLabel}: {topTopic?.tag || "#-"}
          </span>
        )}
        <Link
          href="/recipe-chat"
          className="group flex items-center rounded-full bg-[#166534] text-white transition-all focus:outline-none focus:ring-4 focus:ring-green-100 focus:ring-offset-2 hover:bg-[#14532d] active:scale-95 min-w-[108px] justify-center gap-2 whitespace-nowrap px-4 py-2 text-[13px] font-black shadow-lg shadow-green-900/15 hover:scale-[1.02]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:scale-110">
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
            <path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5 5 3Z" opacity="0.5" />
            <path d="m19 17 1 2.5 2.5.5-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1 1-2.5Z" opacity="0.5" />
          </svg>
          <span>{aiChatLabel}</span>
        </Link>
      </div>
    </div>
  );
}
