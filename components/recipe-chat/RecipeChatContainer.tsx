"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Language } from "@/app/common/types";
import RecipeCard from "./RecipeCard";

interface Recipe {
  title: string;
  time: string;
  difficulty: string;
  matchRate: string;
  ingredients: string[];
  instructions: string[];
}

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  image?: string;
  recipes?: Recipe[];
  timestamp: Date;
}

interface RecipeChatContainerProps {
  lang: Language;
  messages: Message[];
  onSendMessage: (text: string) => void;
  isChatLoading: boolean;
  ingredients: string[];
}

export default function RecipeChatContainer({
  lang,
  messages,
  onSendMessage,
  isChatLoading,
  ingredients,
}: RecipeChatContainerProps) {
  const [input, setInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isChatLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanText = input.trim();
    if (!cleanText || isChatLoading) return;
    onSendMessage(cleanText);
    setInput("");
  };

  const handleQuickClick = (text: string) => {
    if (isChatLoading) return;
    onSendMessage(text);
  };

  return (
    <main className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden max-h-[calc(100vh-140px)]">
      {/* 챗봇 헤더 */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-700 flex items-center justify-center text-white relative">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
            </svg>
            <div className="absolute right-0 bottom-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm font-black text-gray-900">Gachimura AI Cook</h1>
            <span className="text-[10px] text-gray-400 font-bold">
              {lang === Language.japanese ? "リアルタイムレシピ分析中" : "실시간 요리 도우미"}
            </span>
          </div>
        </div>
        
        <Link
          href="/home"
          className="text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors"
        >
          {lang === Language.japanese ? "戻る" : "나가기"}
        </Link>
      </div>

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 bg-gray-50/20">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 max-w-[85%] ${
              msg.sender === "user" ? "self-end flex-row-reverse" : "self-start"
            }`}
          >
            {msg.sender === "ai" && (
              <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-700 shrink-0 border border-green-100 font-bold text-sm">
                AI
              </div>
            )}
            
            <div className="flex flex-col gap-2">
              <div
                className={`p-4 rounded-2xl text-xs leading-relaxed shadow-sm font-medium ${
                  msg.sender === "user"
                    ? "bg-green-700 text-white rounded-tr-none"
                    : "bg-white text-gray-800 border border-gray-100 rounded-tl-none whitespace-pre-wrap"
                }`}
              >
                {msg.image && (
                  <div className="relative w-48 h-32 rounded-lg overflow-hidden mb-3 border border-white/20">
                    <Image src={msg.image} alt="User Uploaded" fill className="object-cover" />
                  </div>
                )}
                {msg.text}
              </div>

              {/* AI 추천 레시피 카드 */}
              {msg.recipes && msg.recipes.length > 0 && (
                <div className="grid grid-cols-1 gap-4 mt-2 w-full max-w-[600px]">
                  {msg.recipes.map((recipe, idx) => (
                    <RecipeCard key={idx} recipe={recipe} lang={lang} />
                  ))}
                </div>
              )}

              <span className="text-[9px] text-gray-400 font-bold self-start mt-1">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}

        {/* AI 타이핑 지시기 */}
        {isChatLoading && (
          <div className="flex gap-3 max-w-[85%] self-start">
            <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-700 shrink-0 border border-green-100 font-bold text-sm">
              AI
            </div>
            <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-tl-none flex items-center gap-1.5 shadow-sm">
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* 챗봇 하단 입력 폼 */}
      <div className="p-4 border-t border-gray-100 bg-white">
        {/* 간편 추천 가이드 버블 */}
        {messages.length === 1 && (
          <div className="flex flex-wrap gap-2 mb-3">
            <button
              onClick={() => handleQuickClick(lang === Language.japanese ? "冷蔵庫のトマトと卵でできる料理을 가르쳐줘" : "냉장고에 토마토랑 달걀이 있는데 뭐 할 수 있어?")}
              className="text-[11px] text-gray-500 font-bold bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-full border border-gray-100 transition-colors"
            >
              🍅 {lang === Language.japanese ? "トマトと卵料理" : "토마토와 달걀로 뭐 만들지?"}
            </button>
            <button
              onClick={() => handleQuickClick(lang === Language.japanese ? "豚バラ肉を使ったおつまみレシピを教えて" : "삼겹살로 만들 수 있는 술안주 추천해줘")}
              className="text-[11px] text-gray-500 font-bold bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-full border border-gray-100 transition-colors"
            >
              🥩 {lang === Language.japanese ? "豚バラ肉のおつまみ" : "삼겹살 요리 추천"}
            </button>
            <button
              onClick={() => handleQuickClick(lang === Language.japanese ? "10分以内でできる超簡単な料理を教えて" : "10분 내로 완성하는 초간단 자취요리")}
              className="text-[11px] text-gray-500 font-bold bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-full border border-gray-100 transition-colors"
            >
              ⏱️ {lang === Language.japanese ? "10分時短料理" : "10분 완성 요리"}
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              ingredients.length > 0 
                ? (lang === Language.japanese ? "分析された食材で料理を推薦してもらいましょう" : "스캔된 재료들로 레시피를 물어보세요!")
                : (lang === Language.japanese ? "メッセージを入力するか食材を追加してください" : "메시지를 입력하거나 사진을 스캔해 보세요.")
            }
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-green-600 text-xs text-black"
          />
          
          <button
            type="submit"
            disabled={isChatLoading || !input.trim()}
            className="px-5 rounded-xl bg-green-700 hover:bg-green-800 disabled:bg-gray-200 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
            <span>{lang === Language.japanese ? "送信" : "전송"}</span>
          </button>
        </form>
      </div>
    </main>
  );
}
