import Logo from "@/components/common/Logo";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";

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
            <div className="flex items-center gap-2 cursor-pointer group">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <span className="text-[12px] font-bold text-gray-700 tracking-tight group-hover:text-gray-900 transition-colors">
                닉네임 들어갈 곳
              </span>
            </div>

            {/* 구분선 */}
            <div className="w-[1px] h-4 bg-gray-200" />

            {/* 로그아웃 버튼 */}
            <button className="flex items-center gap-1 text-gray-400 hover:text-red-500 transition-all active:scale-95 group">
              <div className="w-8 h-8 rounded-full flex items-center justify-center transition-colors group-hover:bg-red-50">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
                  <line x1="12" y1="2" x2="12" y2="12"></line>
                </svg>
              </div>
              <span className="text-[12px] font-bold tracking-tight">로그아웃</span>
            </button>
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
