import LanguageSwitcher from "@/components/common/LanguageSwitcher";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full h-full relative">
      {/* 인증 페이지 전용 언어 선택기 */}
      <div className="absolute top-4 right-4 z-50 sm:top-8 sm:right-8">
        <LanguageSwitcher />
      </div>
      {children}
    </div>
  );
}
