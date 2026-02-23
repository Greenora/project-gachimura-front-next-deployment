import { Suspense } from "react";
import Logo from "@/components/common/Logo";
import SearchBar from "@/components/main/SearchBar";
import UserMenu from "@/components/main/UserMenu";
import Footer from "@/components/common/Footer";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import LocationSelector from "@/components/main/LocationSelector";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50/30">
      {/* 1단: 유저 탑 바 */}
      <div className="bg-white border-b border-gray-50 h-[60px] px-8 hidden sm:block">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-end gap-6">
          <LanguageSwitcher />
          <div className="w-[1px] h-3 bg-gray-200" />
          <UserMenu />
        </div>
      </div>

      {/* 2단: 검색 & 로고 메인 헤더 */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50 px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <Logo className="flex-shrink-0" href="/home" />
          <Suspense fallback={<div className="flex-1 max-w-2xl h-[52px] bg-gray-50 rounded-full animate-pulse" />}>
            <SearchBar />
          </Suspense>
          <LocationSelector />
        </div>
      </header>

      {/* 메인 컨텐츠 영역 */}
      <main className="max-w-7xl mx-auto w-full flex-1 px-8 py-10">
        {children}
      </main>

      <Footer />
    </div>
  );
}
