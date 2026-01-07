"use client";

import { createContext, useContext } from "react";
import { Language } from "@/app/common/types";

// 언어를 전역으로 배달하는 시스템!!

// context에 저장할 데이터 타입 정의
interface LanguageContextType {
  texts: any;
  lang: Language;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({
  children,
  texts,
  lang,
}: {
  children: React.ReactNode;
  texts: any;
  lang: Language;
}) {
  return (
    <LanguageContext.Provider value={{ texts, lang }}>
      {children}
    </LanguageContext.Provider>
  );
}

// 언어 꺼내쓰는 커스텀 훅, 프로바이더 밖에서 함수 쓰면 에러 보내줌
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
