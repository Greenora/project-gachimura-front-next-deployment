import Logo from "@/components/common/Logo";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import UserMenu from "@/components/main/UserMenu";
import MobileNavigation from "@/components/common/MobileNavigation";

export default function TitleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-dvh bg-white">
      {/* 글로벌 상단바 */}
      <header className="h-16 sm:h-[72px] shrink-0 border-b border-gray-100/80 bg-white/90 backdrop-blur-md sticky top-0 z-50 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between gap-2">
          {/* 왼쪽: 로고 */}
          <Logo href="/home" className="shrink-0 [&>span]:hidden lg:[&>span]:inline" />

          {/* 오른쪽: 유저 정보 & 로그아웃 */}
          <div className="flex items-center gap-2 sm:gap-6">
            <LanguageSwitcher />
            <div className="hidden sm:block w-[1px] h-4 bg-gray-200" />
            <UserMenu />
          </div>
        </div>
      </header>

      {/* 페이지 컨텐츠 */}
      <main className="flex-1 min-w-0 flex flex-col">
        {children}
      </main>
      <MobileNavigation />
    </div>
  );
}
