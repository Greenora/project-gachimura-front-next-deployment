"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { clientFetch } from "@/app/hooks/useClientFetch";
import { useLanguage } from "@/app/hooks/LanguageContext";
import { Language } from "@/app/common/types";
import toast from "react-hot-toast";
import Cookies from "js-cookie";

export default function KakaoCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lang, texts } = useLanguage();
  const processedRef = useRef(false);

  useEffect(() => {
    // URL에서 인가 코드(Code) 추출
    const code = searchParams.get("code");

    if (!code) {
      router.push("/auth/login"); // 코드가 없으면 로그인 창으로
      return;
    }

    // 중복 실행 방지
    if (processedRef.current) return;
    processedRef.current = true;

    // 언어 감지
    let currentLang = lang;
    if (!currentLang) {
       currentLang = Cookies.get("language") as Language;
    }
    const langCode = currentLang === Language.japanese ? 'jp' : 'ko';

    // 카카오 콘솔에 등록한 주소와 100% 일치해야 함
    const redirectUri = "http://localhost:3000/kakao/callback";

    // 백엔드로 코드 전송 (이제 백엔드도 수정해야 함)
    clientFetch("/auth/kakao", {
      method: "POST",
      body: { 
        code,        // 인가 코드
        redirectUri, // 리다이렉트 URI
        language: langCode 
      },
    })
      .then((data: any) => {
        // 성공 시 쿠키 저장 및 메인 이동
        Cookies.set("accessToken", data.accessToken, { expires: 1 });
        Cookies.set("refreshToken", data.refreshToken, { expires: 7 });
        
        const displayNickname = langCode === 'jp' && data.user.nickname_jp 
            ? data.user.nickname_jp 
            : data.user.nickname;

        toast.success(`${texts.auth.welcomePrefix} ${displayNickname}${texts.auth.welcomeSuffix}`);
        router.push("/");
      })
      .catch((err) => {
        console.error(err);
        toast.error("카카오 로그인 실패");
        router.push("/login");
      });
      
  }, [router, searchParams, lang, texts]);

  return (
    <div className="flex h-screen items-center justify-center bg-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-400 mx-auto mb-4"></div>
        <p className="text-gray-600 font-sans">카카오 로그인 중...</p>
      </div>
    </div>
  );
}