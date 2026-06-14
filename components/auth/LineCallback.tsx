"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { clientFetch } from "@/app/hooks/useClientFetch";
import { useLanguage } from "@/app/hooks/LanguageContext";
import { Language } from "@/app/common/types"; 
import toast from "react-hot-toast";
import Cookies from "js-cookie";

type LineLoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: {
    nickname: string;
    nickname_jp?: string;
  };
};

// LINE OAuth 콜백 컴포넌트 (인가 코드 받아서 백엔드로 전송)
export default function LineCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lang, texts } = useLanguage();
  const processedRef = useRef(false);

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const storedState = sessionStorage.getItem("line_auth_state");

    if (!code) {
      sessionStorage.removeItem("line_auth_state");
      router.push("/login");
      return;
    }

    if (processedRef.current) return;
    processedRef.current = true;

    // CSRF 검증
    if (state !== storedState) {
        sessionStorage.removeItem("line_auth_state");
        toast.error("보안 검증 실패 (State mismatch)");
        router.push("/login");
        return;
    }
    
    let currentLang = lang;
    if (!currentLang) {
       currentLang = Cookies.get("language") as Language;
    }
    const langCode = currentLang === Language.japanese ? 'jp' : 'ko';
    
    const redirectUri = `${window.location.origin}/line/callback`;

    // 백엔드로 인가 코드 전송 (백엔드가 LINE 서버와 토큰 교환)
    clientFetch("/auth/line", {
      method: "POST",
      body: { 
        code, 
        redirectUri,
        language: langCode // 회원가입일 경우 닉네임 생성용
      },
    })
      .then((data: LineLoginResponse) => {
        Cookies.set("accessToken", data.accessToken, { expires: 1 });
        Cookies.set("refreshToken", data.refreshToken, { expires: 7 });
        
        const displayNickname = langCode === 'jp' && data.user.nickname_jp 
            ? data.user.nickname_jp 
            : data.user.nickname;

        toast.success(`${texts.auth.welcomePrefix} ${displayNickname}${texts.auth.welcomeSuffix}`);
        router.push("/home"); // 메인으로 이동
      })
      .catch((err) => {
        console.error(err);
        toast.error("LINE 로그인 실패");
        router.push("/login");
      });
      
      // state 검증 끝났으니 sessionStorage에서 삭제
      sessionStorage.removeItem("line_auth_state");
      
  }, [router, searchParams, lang, texts]);

  return (
    <div className="flex h-screen items-center justify-center bg-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-500 mx-auto mb-4"></div>
        <p className="text-gray-600 font-sans">LINE 로그인 중...</p>
      </div>
    </div>
  );
}
