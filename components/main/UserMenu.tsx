"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { clientFetch } from "@/app/hooks/useClientFetch";
import { useLanguage } from "@/app/hooks/LanguageContext";
import { Language } from "@/app/common/types";

interface UserMenuProfile {
  id: number;
  nickname: string;
  nickname_jp?: string | null;
  profileImage?: string | null;
}

export default function UserMenu() {
  const [user, setUser] = useState<UserMenuProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { texts, lang } = useLanguage();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await clientFetch("/users/profile");
        setUser(data);
      } catch {
        console.log("Not logged in");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleLogout = async () => {
    try {
      await clientFetch("/auth/logout", { method: "POST" });
      // 모든 인증 관련 쿠키 삭제
      document.cookie = "accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      // localStorage/sessionStorage 초기화 (필요시)
      if (typeof window !== "undefined") {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        sessionStorage.clear();
      }
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout failed:", error);
      // 에러가 나도 쿠키 삭제 후 이동
      document.cookie = "accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      if (typeof window !== "undefined") {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        sessionStorage.clear();
      }
      window.location.href = "/login";
    }
  };

  if (loading) return <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />;

  if (!user) {
    return (
      <div className="flex items-center gap-4">
        <Link href="/login" className="whitespace-nowrap text-[14px] font-bold text-gray-600 transition-colors hover:text-gray-900">
          {texts.common.login} / {texts.common.signup}
        </Link>
        <div className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-100">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </div>
      </div>
    );
  }

  const displayNickname =
    lang === Language.japanese
      ? user.nickname_jp || user.nickname
      : user.nickname;

  return (
    <div className="flex items-center gap-6">
      {/* 유저 정보 (클릭 시 마이페이지로 직접 이동) */}
      <Link
        href={`/user/${user.id}`}
        className="flex items-center gap-3 cursor-pointer group"
      >
        <div className="flex min-w-0 max-w-[130px] flex-col items-end">
          <span className="w-full truncate text-right text-[14px] font-bold leading-tight text-gray-900 transition-colors group-hover:text-green-700">
            {displayNickname}
          </span>
        </div>
        <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden shadow-sm bg-white relative group-hover:border-green-100 transition-all">
          <Image
            src={user.profileImage || "/images/gachimura_logo.png"}
            alt={`${displayNickname} profile`}
            width={40}
            height={40}
            className={!user.profileImage ? "p-1.5 object-contain" : "object-cover"}
          />
        </div>
      </Link>

      {/* 구분선 */}
      <div className="w-[1px] h-4 bg-gray-200" />

      {/* 로그아웃 버튼 */}
      <button
        onClick={handleLogout}
        className="group/logout flex items-center gap-1.5 text-gray-400 transition-all hover:text-red-500 active:scale-95"
      >
        <div className="w-8 h-8 rounded-full flex items-center justify-center transition-colors group-hover/logout:bg-red-50">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
            <line x1="12" y1="2" x2="12" y2="12"></line>
          </svg>
        </div>
        <span className="max-w-[56px] truncate text-[12px] font-bold tracking-tight">{texts.header.logout}</span>
      </button>
    </div>
  );
}
