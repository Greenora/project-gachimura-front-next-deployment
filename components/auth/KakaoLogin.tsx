"use client";

import { useLanguage } from "@/app/hooks/LanguageContext";
import { useState } from "react";
import toast from "react-hot-toast";

interface Props {
  buttonText?: string;
}

// 카카오 OAuth 로그인 버튼 (REST API 방식)
export default function KakaoLogin({ buttonText }: Props) {
  const { texts } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);

  const displayText = buttonText || texts.auth.kakaoLogin || "카카오로 로그인";

  const KAKAO_REST_API_KEY = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID;
  const REDIRECT_URI = "http://localhost:3000/kakao/callback"; // 카카오 콘솔 등록 URL과 일치해야 함

  const handleLogin = () => {
    if (isLoading) return;
    setIsLoading(true);

    if (!KAKAO_REST_API_KEY) {
      toast.error("Kakao Client ID not found");
      setIsLoading(false);
      return;
    }

    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_REST_API_KEY}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code`;
    
    window.location.href = kakaoAuthUrl;
  };

  return (
    <button
      type="button"
      onClick={handleLogin}
      disabled={isLoading}
      // 카카오 공식 디자인: #FEE500 배경, 12px radius, hover/press 검정 오버레이
      className={`w-full h-[50px] font-bold rounded-[12px] transition-all duration-200 flex items-center justify-center relative select-none group overflow-hidden
          ${
            isLoading
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-[#FEE500] text-[#000000] cursor-pointer"
          }
      `}
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
    >
      {/* hover: 검정 8%, press: 검정 16% */}
      {!isLoading && (
        <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-[0.08] transition-opacity duration-200 pointer-events-none z-[1]" />
      )}
      
      {!isLoading && (
        <div className="absolute inset-0 bg-black opacity-0 group-active:opacity-[0.16] transition-opacity duration-100 pointer-events-none z-[2]" />
      )}

      {isLoading ? (
        <span className="text-[15px] select-none relative z-10">{texts.auth.loading}</span>
      ) : (
        <>
          <div className="absolute left-4 flex items-center pointer-events-none select-none z-10">
            <svg 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="currentColor" 
              xmlns="http://www.w3.org/2000/svg"
              className="pointer-events-none select-none"
              style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
            >
              {/* 카카오 로고 경로 (말풍선 모양) */}
              <path fillRule="evenodd" clipRule="evenodd" d="M12 3C6.477 3 2 6.477 2 10.76C2 13.52 3.77 15.95 6.46 17.37L5.46 21L9.18 18.52C10.08 18.76 11.02 18.89 12 18.89C17.52 18.89 22 15.41 22 11.13C22 6.84 17.52 3 12 3Z" />
            </svg>
          </div>
          {/* 버튼 텍스트 (가운데 정렬) */}
          <span className="text-[15px] font-sans select-none relative z-10">{displayText}</span>
        </>
      )}
    </button>
  );
}