"use client";

import { useLanguage } from "@/app/hooks/LanguageContext";
import { useState } from "react";
import toast from "react-hot-toast";
import Image from "next/image";

interface Props {
  buttonText: string;
}

// LINE OAuth 로그인 버튼 (CSRF 방지용 state 검증)
export default function LineLogin({ buttonText }: Props) {
  const { texts } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);

  const LINE_CLIENT_ID = process.env.NEXT_PUBLIC_LINE_CLIENT_ID;
  
  const generateRandomString = () => Math.random().toString(36).substring(2, 15);

  const handleLogin = () => {
    if (isLoading) return;
    setIsLoading(true);

    if (!LINE_CLIENT_ID) {
        toast.error("LINE Client ID not found");
        setIsLoading(false);
        return;
    }

    const state = generateRandomString();
    sessionStorage.setItem("line_auth_state", state); // CSRF 검증용

    const redirectUri = `${window.location.origin}/line/callback`;

    const lineAuthUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${LINE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=profile%20openid%20email`;

    window.location.href = lineAuthUrl;
  };

  return (
    <button
      type="button"
      onClick={handleLogin}
      disabled={isLoading}
      // LINE 공식 디자인: #06C755 배경, hover/press 검정 오버레이
      className={`w-full h-[50px] rounded-lg transition-all duration-200 flex items-center relative overflow-hidden select-none group
          ${isLoading 
            ? "bg-white text-[#1E1E1E]/20 cursor-not-allowed border border-[#E5E5E5]/60" 
            : "bg-[#06C755] text-white cursor-pointer"
          }
      `}
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
    >
      {/* hover: 검정 10%, press: 검정 30% */}
      {!isLoading && (
        <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-200 pointer-events-none z-[1]" />
      )}
      
      {!isLoading && (
        <div className="absolute inset-0 bg-black opacity-0 group-active:opacity-30 transition-opacity duration-100 pointer-events-none z-[2]" />
      )}
      
      {isLoading ? (
        <span className="w-full text-center text-[15px] select-none relative z-10">{texts.auth.loading}</span>
      ) : (
        <>
          <div className={`absolute left-0 top-0 bottom-0 w-[50px] flex items-center justify-center pointer-events-none z-10 select-none
            ${isLoading ? "border-r border-[#E5E5E5]/60" : "border-r border-black/[0.08]"}
          `}>
            <Image 
                src="/images/btn_base.png"
                alt="LINE" 
                width={30}
                height={30} 
                priority
                draggable={false}
                unselectable="on"
                className="pointer-events-none select-none" 
                style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
            />
          </div>
          {/* 버튼 텍스트 (가운데 정렬) */}
          <span className="w-full text-center text-[15px] font-bold z-10 select-none relative">
             {buttonText}
          </span>
        </>
      )}
    </button>
  );
}