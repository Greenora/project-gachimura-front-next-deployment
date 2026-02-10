import Logo from "@/components/common/Logo";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import LogoutButton from "@/components/common/LogoutButton";
import HeaderUserInfo from "@/components/common/HeaderUserInfo";

export default function TitleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* 글로벌 상단바 */}
      <header className="h-[72px] border-gray-100/80 bg-white/70 backdrop-blur-md sticky top-0 z-[100] px-8">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
          {/* 왼쪽: 로고 */}
          <Logo />

          {/* 오른쪽: 유저 정보 & 로그아웃 */}
          <div className="flex items-center gap-6">
            {/* 언어 전환 */}
            <LanguageSwitcher />

            {/* 구분선 */}
            <div className="w-[1px] h-4 bg-gray-200" />

            {/* 유저 프로필 */}
            <HeaderUserInfo />

            {/* 구분선 */}
            <div className="w-[1px] h-4 bg-gray-200" />

            {/* 로그아웃 버튼 */}
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* 페이지 컨텐츠 */}
      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  );
}
