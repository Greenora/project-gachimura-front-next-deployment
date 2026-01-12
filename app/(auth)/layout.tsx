export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full h-full">
      {/* 로그인, 회원가입 페이지 내용을 그대로 보여줌 */}
      {children}
    </div>
  );
}