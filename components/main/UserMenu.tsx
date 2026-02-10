"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { clientFetch } from "@/app/hooks/useClientFetch";

export default function UserMenu() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await clientFetch("/users/profile");
        setUser(data);
      } catch (error) {
        console.log("Not logged in");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await clientFetch("/auth/logout", { method: "POST" });
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (loading) return <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />;

  if (!user) {
    return (
      <div className="flex items-center gap-4">
        <Link href="/login" className="text-[14px] font-bold text-gray-600 hover:text-gray-900 transition-colors">
          로그인
        </Link>
        <div className="w-[1px] h-3 bg-gray-200" />
        <Link href="/login" className="text-[14px] font-bold text-gray-600 hover:text-gray-900 transition-colors">
          회원가입
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

  return (
    <div className="flex items-center gap-6" ref={dropdownRef}>
      {/* 유저 정보 (클릭 시 드롭다운 토글) */}
      <div className="relative">
        <div
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="flex flex-col items-end">
            <span className="text-[14px] font-bold text-gray-900 leading-tight group-hover:text-green-700 transition-colors">
              {user.nickname}
            </span>
          </div>
          <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden shadow-sm bg-white relative group-hover:border-green-100 transition-all">
            <Image
              src={user.profileImage || "/images/gachimura_logo.png"}
              alt="profile"
              width={40}
              height={40}
              className={!user.profileImage ? "p-1.5 object-contain" : "object-cover"}
            />
          </div>
        </div>

        {/* 드롭다운 메뉴 */}
        {isDropdownOpen && (
          <div className="absolute right-0 mt-3 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-[110] animate-in fade-in zoom-in duration-200 origin-top-right">
            <Link
              href={`/user/${user.id}`}
              className="flex items-center gap-3 px-4 py-3 text-[14px] font-medium text-gray-700 hover:bg-gray-50 hover:text-green-700 transition-colors"
              onClick={() => setIsDropdownOpen(false)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              내 페이지 가기
            </Link>
            <Link
              href="/user/edit"
              className="flex items-center gap-3 px-4 py-3 text-[14px] font-medium text-gray-700 hover:bg-gray-50 hover:text-green-700 transition-colors"
              onClick={() => setIsDropdownOpen(false)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              내 정보 수정하기
            </Link>
          </div>
        )}
      </div>

      {/* 구분선 */}
      <div className="w-[1px] h-4 bg-gray-200" />

      {/* 로그아웃 버튼 */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-1.5 text-gray-400 hover:text-red-500 transition-all active:scale-95 group/logout"
      >
        <div className="w-8 h-8 rounded-full flex items-center justify-center transition-colors group-hover/logout:bg-red-50">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
            <line x1="12" y1="2" x2="12" y2="12"></line>
          </svg>
        </div>
        <span className="text-[12px] font-bold tracking-tight">로그아웃</span>
      </button>
    </div>
  );
}
