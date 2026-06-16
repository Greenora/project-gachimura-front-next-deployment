"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/app/hooks/LanguageContext";
import { Language } from "@/app/common/types";
import { clientFetch } from "@/app/hooks/useClientFetch";

interface UserInfo {
  id: number;
  nickname: string;
  nickname_jp?: string | null;
  profileImage?: string | null;
}

export default function HeaderUserInfo() {
  const { lang } = useLanguage();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    clientFetch("/users/profile")
      .then((data) => setUser(data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="h-10 w-10 animate-pulse rounded-full bg-gray-100" />;
  }

  if (!user) {
    return null;
  }

  const displayNickname = lang === Language.japanese && user.nickname_jp
    ? user.nickname_jp
    : user.nickname;

  return (
    <Link
      href={`/user/${user.id}`}
      className="group flex cursor-pointer items-center gap-3"
    >
      <div className="flex min-w-0 max-w-[130px] flex-col items-end">
        <span className="w-full truncate text-right text-[14px] font-bold leading-tight text-gray-900 transition-colors group-hover:text-green-700">
          {displayNickname}
        </span>
      </div>
      <div className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-white bg-white shadow-sm transition-all group-hover:border-green-100">
        <Image
          src={user.profileImage || "/images/gachimura_logo.png"}
          alt={`${displayNickname} profile`}
          width={40}
          height={40}
          className={!user.profileImage ? "object-contain p-1.5" : "object-cover"}
        />
      </div>
    </Link>
  );
}
