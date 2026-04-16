import { Suspense } from "react";
import Logo from "@/components/common/Logo";
import SearchBar from "@/components/main/SearchBar";
import UserMenu from "@/components/main/UserMenu";
import Sidebar from "@/components/main/Sidebar";
import Footer from "@/components/common/Footer";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import LocationSelector from "@/components/main/LocationSelector";
import CreatePartyButton from "@/components/main/CreatePartyButton";
import ChatListButton from "@/components/main/ChatListButton";
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
    <div className="flex flex-col min-h-screen bg-gray-50/30">
      {/* 1단: 유저 탑 바 (가장 위) - 높이 60px로 조정 */}
      <div className="bg-white border-b border-gray-50 h-[60px] px-8 hidden sm:block" role="toolbar" aria-label={texts.main.personalSettingsAria}>
        <div className="max-w-7xl mx-auto h-full flex items-center justify-end gap-6">
          <LanguageSwitcher />
          <div className="w-[1px] h-3 bg-gray-200" />
          <UserMenu />
        </div>
      </div>

      {/* 2단: 검색 & 로고 메인 헤더 */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50 px-8 py-4" role="banner">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* 왼쪽: 로고 */}
          <Logo href="/home" className="flex-shrink-0" />

          {/* 중간: 검색바 */}
          <Suspense fallback={<div className="flex-1 max-w-2xl h-[52px] bg-gray-50 rounded-full animate-pulse" />}>
            <SearchBar />
          </Suspense>

          {/* 오른쪽: 위치 설정 */}
          <LocationSelector />
        </div>
      </header>

      {/* 3단: 메인 컨텐츠 영역 (사이드바 + 그리드) */}
      <div className="max-w-7xl mx-auto w-full flex-1 px-8 py-10 flex">
        {/* 왼쪽: 필터 사이드바 */}
        <Sidebar />

        {/* 오른쪽: 정렬 및 파티 그리드 */}
        <main className="flex-1" id="main-content">
          {children}
        </main>
      </div>

      <Footer />

      <ChatListButton />

      {/* 플로팅 버튼 (모임 시작하기) */}
      <div className="fixed bottom-10 right-10 z-[100]" role="complementary" aria-label={texts.main.quickActionsAria}>
        <CreatePartyButton />
      </div>
    </div>
  );
}
