"use client";

import { useLanguage } from "@/app/hooks/LanguageContext";
import { Language } from "@/app/common/types";
import { useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

// Kakao SDK 타입 정의
interface KakaoAuthResponse {
  access_token: string;
  token_type: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
}

interface KakaoSDK {
  init: (key: string) => void;
  isInitialized: () => boolean;
  Auth: {
    login: (options: {
      success: (authObj: KakaoAuthResponse) => void;
      fail: (err: Error) => void;
    }) => void;
  };
}

declare global {
  interface Window {
    Kakao: KakaoSDK;
  }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface Props {
  buttonText?: string;
}

export default function KakaoLogin({ buttonText }: Props) {
  const { texts, lang } = useLanguage();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // 기본 버튼 텍스트 설정
  const displayText = buttonText || texts.auth.kakaoLogin || "카카오로 로그인";

  const handleLogin = () => {
    if (isLoading) return;

    if (!window.Kakao) {
      toast.error("Kakao SDK not loaded");
      return;
    }

    if (!window.Kakao.isInitialized()) {
      window.Kakao.init(process.env.NEXT_PUBLIC_KAKAO_JS_KEY || "");
    }

    // 언어 감지 로직 강화 (LoginForm과 동일)
    let currentLang = lang;
    
    if (!currentLang) {
       currentLang = Cookies.get("language") as Language;
    }

    console.log("KakaoLogin 감지 언어:", currentLang);

    const isJapanese = currentLang === Language.japanese;
                       
    const langCode = isJapanese ? 'jp' : 'ko';

    console.log("KakaoLogin 전송 언어코드:", langCode);

    window.Kakao.Auth.login({
      success: async (authObj: KakaoAuthResponse) => {
        setIsLoading(true);

        try {
          const res = await fetch(`${API_URL}/auth/kakao`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                kakaoAccessToken: authObj.access_token,
                language: langCode
            }),
          });

          if (!res.ok) {
            throw new Error("Kakao Login Failed");
          }

          const data: { 
            accessToken: string; 
            user: { nickname: string; nickname_jp?: string }; 
          } = await res.json();
          
          Cookies.set("accessToken", data.accessToken || "", { expires: 1 });
          
          // 현재 언어에 따라 닉네임 선택
          const displayNickname = isJapanese && data.user.nickname_jp 
            ? data.user.nickname_jp 
            : data.user.nickname;
          
          toast.success(`${texts.auth.welcomePrefix} ${displayNickname}${texts.auth.welcomeSuffix}`);
          router.push("/");

        } catch (error) {
          console.error(error);
          toast.error(texts.auth.alertLoginFail);
        } finally {
           setIsLoading(false);
        }
      },
      fail: (err: Error) => {
        console.error(err);
        toast.error("Kakao Login canceled");
      },
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={handleLogin}
        disabled={isLoading}
        className={`w-full font-medium py-4 rounded-lg transition flex items-center justify-center gap-2
            ${isLoading ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-[#FEE500] text-[#000000] hover:bg-[#E6CF00]"}
        `}
      >
        {isLoading ? texts.auth.loading : (
            <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3C6.477 3 2 6.358 2 10.5c0 2.646 1.832 5.01 4.708 6.364L5.67 20.3a.5.5 0 0 0 .762.56l3.665-2.444c.62.094 1.256.142 1.903.142 5.523 0 10-3.358 10-7.5C22 6.358 17.523 3 12 3z"/>
                </svg>
                {displayText}
            </>
        )}
      </button>
    </>
  );
}