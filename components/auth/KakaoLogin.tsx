"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

interface Props {
  buttonText?: string;
}

export default function KakaoLogin({ buttonText = "카카오 간편 로그인" }: Props) {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  
  //  환경변수에서 키 가져오기 (없으면 빈 문자열)
  const KAKAO_JS_KEY = process.env.NEXT_PUBLIC_KAKAO_JS_KEY || "";
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    if (!KAKAO_JS_KEY) {
      console.error("⚠️ 카카오 키가 설정되지 않았습니다. .env.local 확인 필요");
      return;
    }

    if (typeof window !== "undefined") {
      const checkKakao = setInterval(() => {
        const kakao = (window as any).Kakao;
        if (kakao) {
          if (!kakao.isInitialized()) {
            kakao.init(KAKAO_JS_KEY);
          }
          setIsReady(true);
          clearInterval(checkKakao);
        }
      }, 100);
      setTimeout(() => clearInterval(checkKakao), 5000);
    }
  }, [KAKAO_JS_KEY]);

  const handleLogin = () => {
    const kakao = (window as any).Kakao;
    if (!kakao || !isReady) return alert("로딩 중...");

    kakao.Auth.login({
      success: async (authObj: any) => {
        try {
          //  API 주소도 환경변수 사용
          const res = await fetch(`${API_URL}/auth/kakao`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ kakaoAccessToken: authObj.access_token }),
          });

          if (res.ok) {
            const data = await res.json();
            Cookies.set("accessToken", data.accessToken, { expires: 1 });
            window.location.href = "/";
          } else {
            alert("로그인 실패");
          }
        } catch (error) {
          alert("서버 연결 실패");
        }
      },
      fail: (err: any) => alert("카카오 로그인 실패"),
    });
  };

  return (
    <button
      type="button"
      onClick={handleLogin}
      className="w-full bg-[#FEE500] text-[#191919] font-medium py-4 rounded-lg transition hover:bg-[#FDD835] flex items-center justify-center gap-2"
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M12 3C5.373 3 0 7.373 0 12.766c0 3.357 2.112 6.326 5.375 8.16l-.88 3.256c-.056.208.193.376.368.256l3.87-2.585c1.06.305 2.18.47 3.267.47 6.627 0 12-4.372 12-9.766C24 7.373 18.627 3 12 3z" />
      </svg>
      {buttonText}
    </button>
  );
}