"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/app/hooks/LanguageContext";

export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { texts } = useLanguage();

  const initialQuery = searchParams.get("search") || "";
  const [query, setQuery] = useState(initialQuery);

  // URL 파라미터가 변경되면 입력창도 업데이트
  useEffect(() => {
    setQuery(searchParams.get("search") || "");
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (query.trim()) {
      params.set("search", query.trim());
    } else {
      params.delete("search");
    }
    router.push(`/home?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSearch} className="flex-1 max-w-2xl px-8">
      <div className="relative group">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={texts.main.searchPlaceholder}
          className="w-full h-[52px] pl-6 pr-14 bg-white border-2 border-gray-100 rounded-full text-[15px] font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:border-green-600 focus:ring-4 focus:ring-green-50 transition-all shadow-sm group-hover:border-gray-200"
        />
        <button
          type="submit"
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-gray-400 hover:text-green-700 transition-colors"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </button>
      </div>
    </form>
  );
}
