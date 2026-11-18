"use client";

import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/app/hooks/LanguageContext";
import { Language } from "@/app/common/types";

export interface JoinedParty {
  id: number;
  title: string;
  host?: { nickname: string; nickname_jp?: string };
}

export default function ChatList({ chats, loading, error, onRetry, onSelect }: {
  chats: JoinedParty[];
  loading: boolean;
  error?: string;
  onRetry: () => void;
  onSelect?: () => void;
}) {
  const { lang, texts } = useLanguage();

  return (
    <div aria-live="polite" aria-busy={loading}>
      {loading ? (
        <div className="py-10 text-center text-gray-500 text-sm">
          <div className="animate-spin inline-block w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full mb-2" />
          <p>{texts.auth.loading}</p>
        </div>
      ) : error ? (
        <div className="space-y-3 px-4 py-10 text-center text-sm">
          <p role="alert" className="text-red-700">{error}</p>
          <button type="button" onClick={onRetry} className="min-h-[44px] rounded-lg bg-[#166534] px-5 text-white">
            {lang === Language.japanese ? "再試行" : "다시 시도"}
          </button>
        </div>
      ) : chats.length === 0 ? (
        <p className="py-10 px-4 text-center text-gray-500 text-sm">{texts.main.noJoinedChats}</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {chats.map((chat) => (
            <li key={chat.id}>
              <Link
                href={`/chat/${chat.id}`}
                onClick={onSelect}
                aria-label={`${chat.title} ${texts.main.chatRoomAriaSuffix}`}
                className="flex min-h-[72px] items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all group active:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#166534]"
              >
                <div className="w-12 h-12 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden relative shadow-sm">
                  <Image
                    src={`https://picsum.photos/seed/${chat.id}/200/200`}
                    alt={`${chat.title} ${texts.main.thumbnailAltSuffix}`}
                    fill
                    sizes="48px"
                    className="object-cover group-hover:scale-110 transition-transform"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-bold text-gray-900 truncate text-[14px]">{chat.title}</h2>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="shrink-0 text-[11px] text-[#166534] bg-green-50 px-1.5 py-0.5 rounded uppercase font-black tracking-tighter" aria-label={texts.main.hostAriaLabel}>
                      {texts.main.hostLabel}
                    </span>
                    <p className="text-[12px] text-gray-500 truncate">
                      {chat.host
                        ? (lang === Language.japanese ? chat.host.nickname_jp || chat.host.nickname : chat.host.nickname)
                        : texts.main.anonymous}
                    </p>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
