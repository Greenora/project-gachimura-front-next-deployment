"use client";

import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/app/hooks/LanguageContext";
import { clientFetch } from "@/app/hooks/useClientFetch";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Language } from "@/app/common/types";

export default function ChatListButton() {
  const { lang, texts } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadChats();
    }
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadChats = async () => {
    setLoading(true);
    try {
      const data = await clientFetch("/parties/joined-parties");
      setChats(data || []);
    } catch (error) {
      console.error("Failed to load chats:", error);
    } finally {
      setLoading(false);
    }
  };

  const getNickname = (chat: any) => {
    const host = chat.host;
    if (!host) return texts.main.anonymous;
    return lang === Language.japanese && host.nickname_jp ? host.nickname_jp : host.nickname;
  };

  return (
    <div className="fixed bottom-10 left-10 z-[100]" ref={dropdownRef}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-16 left-0 w-[300px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col"
          >
            <div className="p-4 border-b border-gray-100 bg-white">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#166534]">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                {texts.main.myChats}
              </h3>
            </div>

            <div className="max-h-[360px] overflow-y-auto p-2" aria-live="polite">
              {loading ? (
                <div className="py-10 text-center text-gray-400 text-sm">
                  <div className="animate-spin inline-block w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full mb-2"></div>
                  <p>{texts.auth.loading}</p>
                </div>
              ) : chats.length === 0 ? (
                <div className="py-10 px-4 text-center text-gray-400 text-sm italic">
                  {lang === Language.japanese ? "参加中のチャットがありません。" : "참여 중인 채팅이 없습니다."}
                </div>
              ) : (
                <div className="flex flex-col gap-1" role="list">
                  {chats.map((chat) => (
                    <Link
                      key={chat.id}
                      href={`/chat/${chat.id}`}
                      onClick={() => setIsOpen(false)}
                      role="listitem"
                      aria-label={`${chat.title} 채팅방`}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all group active:scale-[0.98] focus:outline-none focus:bg-gray-50"
                    >
                      <div className="w-12 h-12 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden relative shadow-sm">
                        <Image
                          src={`https://picsum.photos/seed/${chat.id}/200/200`}
                          alt={`${chat.title} 썸네일`}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-900 truncate text-[14px]">
                          {chat.title}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[11px] font-bold text-[#166534] bg-green-50 px-1.5 py-0.5 rounded uppercase font-black tracking-tighter" aria-label="개설자">
                            Host
                          </span>
                          <p className="text-[12px] text-gray-500 truncate">
                            {getNickname(chat)}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={texts.main.myChats}
        aria-haspopup="true"
        aria-expanded={isOpen}
        className={`flex items-center gap-2.5 px-6 py-3 shadow-2xl text-white rounded-full transition-all hover:scale-105 active:scale-95 group focus:outline-none focus:ring-4 focus:ring-gray-200 ${isOpen ? "bg-gray-900 shadow-xl" : "bg-[#166534] hover:bg-[#14532d] shadow-green-900/10"
          }`}
      >
        <div className="relative">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={isOpen ? "rotate-12" : ""} aria-hidden="true">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </div>
      </button>
    </div>
  );
}
