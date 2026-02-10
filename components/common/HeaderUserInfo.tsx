"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/app/hooks/LanguageContext";
import { Language } from "@/app/common/types";
import { clientFetch } from "@/app/hooks/useClientFetch";

interface UserInfo {
  nickname: string;
  nickname_jp?: string;
}

export default function HeaderUserInfo() {
  const { texts, lang } = useLanguage();
  const [user, setUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    clientFetch("/users/profile")
      .then((data) => setUser(data))
      .catch(() => setUser(null));
  }, []);

  const displayNickname = () => {
    if (!user) return texts.auth.loading;
    if (lang === Language.japanese && user.nickname_jp) {
      return user.nickname_jp;
    }
    return user.nickname;
  };

  return (
    <div className="flex items-center gap-2 cursor-pointer group">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
      </svg>
      <span className="text-[12px] font-bold text-gray-700 tracking-tight group-hover:text-gray-900 transition-colors">
        {displayNickname()}
      </span>
    </div>
  );
}
