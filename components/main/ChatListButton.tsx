"use client";

import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/app/hooks/LanguageContext";
import { clientFetch } from "@/app/hooks/useClientFetch";
import { motion, AnimatePresence } from "framer-motion";
import ChatList, { JoinedParty } from "@/components/chat/ChatList";
import { useUser } from "@/app/hooks/UserContext";

export default function ChatListButton() {
  const { texts } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [chats, setChats] = useState<JoinedParty[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { user } = useUser();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  const loadChats = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await clientFetch<JoinedParty[]>("/parties/joined-parties");
      setChats(data || []);
    } catch (error) {
      setError(error instanceof Error ? error.message : texts.chat.genericError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hidden sm:block fixed bottom-10 left-10 z-[100]" ref={dropdownRef}>
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

            <div className="max-h-[360px] overflow-y-auto p-2">
              <ChatList chats={chats} loading={loading} error={error} onRetry={() => void loadChats()} onSelect={() => setIsOpen(false)} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => {
          if (!isOpen) void loadChats();
          setIsOpen(!isOpen);
        }}
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
