"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/app/hooks/LanguageContext";
import { Language } from "@/app/common/types";
import { useUser } from "@/app/hooks/UserContext";

export default function MobileNavigation() {
  const pathname = usePathname();
  const { lang } = useLanguage();
  const { user, loading } = useUser();
  const userId = user?.id;
  const hideNavigation = pathname.startsWith("/chat/") || pathname.startsWith("/settlement/");

  if (hideNavigation) return null;

  const isJapanese = lang === Language.japanese;
  const links = [
    { href: "/home", label: isJapanese ? "ホーム" : "홈", active: pathname === "/home" || pathname.startsWith("/party/") || pathname === "/create-party", icon: "m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z" },
    { href: "/community", label: isJapanese ? "コミュニティ" : "커뮤니티", active: pathname.startsWith("/community"), icon: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M17 4a4 4 0 0 1 0 8 M22 21v-2a4 4 0 0 0-3-3.87 M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0" },
    { href: "/chats", label: isJapanese ? "チャット" : "채팅", active: pathname === "/chats", icon: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" },
    { href: userId ? `/user/${userId}` : "/login", pending: loading, label: isJapanese ? "マイページ" : "내 정보", active: pathname === `/user/${userId}`, icon: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0" },
  ];

  return (
    <>
      <div className="h-[calc(4rem+env(safe-area-inset-bottom))] shrink-0 sm:hidden" aria-hidden="true" />
      <nav
        aria-label={isJapanese ? "メインナビゲーション" : "주 메뉴"}
        className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-4 border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] sm:hidden"
      >
        {links.map(link => {
          const className = `flex h-16 min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-1 text-[11px] font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-green-700 ${link.active ? "text-green-700 bg-green-50" : "text-gray-600"}`;
          const content = <>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d={link.icon} />
            </svg>
            <span className="truncate max-w-full">{link.label}</span>
          </>;
          return link.pending ? (
            <button key={link.href} type="button" disabled aria-busy="true" className={className}>{content}</button>
          ) : (
            <Link key={link.href} href={link.href} aria-current={link.active ? "page" : undefined} className={className}>{content}</Link>
          );
        })}
      </nav>
    </>
  );
}
