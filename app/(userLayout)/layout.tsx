import { Suspense } from "react";
import Logo from "@/components/common/Logo";
import SearchBar from "@/components/main/SearchBar";
import UserMenu from "@/components/main/UserMenu";
import Footer from "@/components/common/Footer";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import LocationSelector from "@/components/main/LocationSelector";
import MobileNavigation from "@/components/common/MobileNavigation";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-dvh bg-gray-50/30">
      {/* 1단: 유저 탑 바 */}
      <div className="bg-white border-b border-gray-50 h-14 sm:h-[60px] px-4 sm:px-8">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-end gap-2 sm:gap-6">
          <LanguageSwitcher />
          <div className="w-[1px] h-3 bg-gray-200" />
          <UserMenu />
        </div>
      </div>

      {/* 2단: 검색 & 로고 메인 헤더 */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50 px-4 sm:px-8 py-3 sm:py-4">
        <div className="max-w-7xl mx-auto grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 sm:flex sm:justify-between sm:gap-4">
          <Logo className="flex-shrink-0 [&>span]:hidden sm:[&>span]:inline" href="/home" />
          <Suspense fallback={<div className="col-span-2 row-start-2 flex-1 max-w-2xl h-[52px] bg-gray-50 rounded-full animate-pulse" />}>
            <SearchBar />
          </Suspense>
          <LocationSelector />
        </div>
      </header>

      {/* 메인 컨텐츠 영역 */}
      <main className="max-w-7xl mx-auto w-full min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-10">
        {children}
      </main>

      <Footer />
      <MobileNavigation />
    </div>
  );
}
