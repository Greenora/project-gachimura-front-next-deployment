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
