"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/app/hooks/LanguageContext";
import { Language } from "@/app/common/types";
import CreatePartyButton from "@/components/main/CreatePartyButton";
import WritePostButton from "@/components/main/WritePostButton";
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
        {isCommunity ? <WritePostButton variant="compact" /> : <CreatePartyButton variant="compact" />}
      </div>
    </div>
  );
}
