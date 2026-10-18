"use client";

import { Language } from "@/app/common/types";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/app/hooks/LanguageContext";

export default function LanguageSwitcher() {
  const router = useRouter();
  const { lang: currentLang } = useLanguage();

  const changeLanguage = (lang: Language) => {
    // 쿠키 설정 (유효기간 365일)
    document.cookie = `language=${lang}; path=/; max-age=31536000`;
    router.refresh(); // 서버 컴포넌트 재렌더링 유발
  };

  return (
    <div className="flex items-center shrink-0 text-sm font-medium" role="group" aria-label={currentLang === Language.japanese ? "言語" : "언어"}>
      <button
        onClick={() => changeLanguage(Language.korean)}
        aria-label="한국어"
        aria-pressed={currentLang === Language.korean}
        className={`min-w-11 min-h-11 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-green-700 ${currentLang === Language.korean ? "text-slate-900 font-bold" : "text-slate-500"}`}
      >
        KO
      </button>
      <span className="hidden sm:inline text-slate-300" aria-hidden="true">|</span>
      <button
        onClick={() => changeLanguage(Language.japanese)}
        aria-label="日本語"
        aria-pressed={currentLang === Language.japanese}
        className={`min-w-11 min-h-11 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-green-700 ${currentLang === Language.japanese ? "text-slate-900 font-bold" : "text-slate-500"}`}
      >
        JP
      </button>
    </div>
  );
}
