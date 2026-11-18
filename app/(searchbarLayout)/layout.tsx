import { Suspense } from "react";
import Logo from "@/components/common/Logo";
import SearchBar from "@/components/main/SearchBar";
import UserMenu from "@/components/main/UserMenu";
import Sidebar from "@/components/main/Sidebar";
import Footer from "@/components/common/Footer";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import LocationSelector from "@/components/main/LocationSelector";
import ChatListButton from "@/components/main/ChatListButton";
import HomeCommunityTabs from "@/components/main/HomeCommunityTabs";
import BottomRightQuickAction from "@/components/main/BottomRightQuickAction";
import MobileNavigation from "@/components/common/MobileNavigation";
import { cookies } from "next/headers";
import { Language } from "@/app/common/types";
import { menu } from "@/app/constants/menu";

export default async function SearchbarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("language")?.value as Language) || Language.korean;
  const validLang = Object.values(Language).includes(lang) ? lang : Language.korean;
  const texts = menu[validLang];

  return (
    <div className="flex flex-col min-h-dvh bg-gray-50/30">
      {/* 1단: 유저 탑 바 (가장 위) - 높이 60px로 조정 */}
      <div className="bg-white border-b border-gray-50 h-14 sm:h-[60px] px-4 sm:px-8" role="toolbar" aria-label={texts.main.personalSettingsAria}>
        <div className="max-w-7xl mx-auto h-full flex items-center justify-end gap-2 sm:gap-6">
          <LanguageSwitcher />
          <div className="w-[1px] h-3 bg-gray-200" />
          <UserMenu />
        </div>
      </div>

      {/* 2단: 검색 & 로고 메인 헤더 */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50 px-4 sm:px-8 py-3 sm:py-4" role="banner">
        <div className="max-w-7xl mx-auto grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 sm:flex sm:justify-between sm:gap-4">
          {/* 왼쪽: 로고 */}
          <Logo href="/home" className="flex-shrink-0 [&>span]:hidden sm:[&>span]:inline" />

          {/* 중간: 검색바 */}
          <Suspense fallback={<div className="col-span-2 row-start-2 sm:order-none flex-1 max-w-2xl h-[52px] bg-gray-50 rounded-full animate-pulse" />}>
            <SearchBar />
          </Suspense>

          {/* 오른쪽: 위치 설정 */}
          <LocationSelector />
        </div>
      </header>

      <div className="bg-white border-b border-gray-100 px-4 sm:px-8 py-3">
        <div className="max-w-7xl mx-auto">
          <HomeCommunityTabs />
        </div>
      </div>

      {/* 3단: 메인 컨텐츠 영역 (사이드바 + 그리드) */}
      <div className="max-w-7xl mx-auto w-full flex-1 px-4 py-6 sm:px-8 sm:py-10 flex flex-col md:flex-row gap-5 md:gap-0">
        {/* 왼쪽: 필터 사이드바 */}
        <Sidebar />

        {/* 오른쪽: 정렬 및 파티 그리드 */}
        <main className="flex-1 min-w-0" id="main-content">
          {children}
        </main>
      </div>

      <Footer />

      <ChatListButton />

      <BottomRightQuickAction />
      <MobileNavigation />
    </div>
  );
}
