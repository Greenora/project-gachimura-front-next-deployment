"use client";

import { useRouter } from "next/navigation";
import { clientFetch } from "@/app/hooks/useClientFetch";
import { useLanguage } from "@/app/hooks/LanguageContext";
import toast from "react-hot-toast";

export default function LogoutButton() {
  const router = useRouter();
  const { texts } = useLanguage();
  const t = texts.header;

  const handleLogout = async () => {
    try {
      await clientFetch("/auth/logout", { method: "POST" });
      // 쿠키 삭제
      document.cookie = "accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      toast.success(t.logoutSuccess);
      router.push("/login");
    } catch (err) {
      console.error("Logout error:", err);
      // 에러가 나도 로컬 쿠키는 삭제하고 로그인 페이지로 이동
      document.cookie = "accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      router.push("/login");
    }
  };

  return (
    <button 
      onClick={handleLogout}
      className="flex items-center gap-1 text-gray-400 hover:text-red-500 transition-all active:scale-95 group"
    >
      <div className="w-8 h-8 rounded-full flex items-center justify-center transition-colors group-hover:bg-red-50">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
          <line x1="12" y1="2" x2="12" y2="12"></line>
        </svg>
      </div>
      <span className="text-[12px] font-bold tracking-tight">{t.logout}</span>
    </button>
  );
}
