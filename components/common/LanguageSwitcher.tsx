"use client";

import { Language } from "@/app/common/types";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LanguageSwitcher() {
  const router = useRouter();
  const [currentLang, setCurrentLang] = useState<Language>(Language.korean);

  useEffect(() => {
    // 초기 로드시 쿠키에서 언어 읽기
    const match = document.cookie.match(new RegExp("(^| )language=([^;]+)"));
    if (match) {
      setCurrentLang(match[2] as Language);
    }
  }, []);

  const changeLanguage = (lang: Language) => {
    // 쿠키 설정 (유효기간 365일)
    document.cookie = `language=${lang}; path=/; max-age=31536000`;
    setCurrentLang(lang);
    router.refresh(); // 서버 컴포넌트 재렌더링 유발
  };

  return (
    <div className="flex gap-2 text-sm font-medium">
      <button
        onClick={() => changeLanguage(Language.korean)}
        className={`${currentLang === Language.korean ? "text-slate-900 font-bold" : "text-slate-400"}`}
      >
        KO
      </button>
      <span className="text-slate-300">|</span>
      <button
        onClick={() => changeLanguage(Language.japanese)}
        className={`${currentLang === Language.japanese ? "text-slate-900 font-bold" : "text-slate-400"}`}
      >
        JP
      </button>
    </div>
  );
}
