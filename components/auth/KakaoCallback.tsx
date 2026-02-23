"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { clientFetch } from "@/app/hooks/useClientFetch";
import { useLanguage } from "@/app/hooks/LanguageContext";
import { Language } from "@/app/common/types";
import toast from "react-hot-toast";
import Cookies from "js-cookie";

export default function KakaoCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lang, texts } = useLanguage();
  const processedRef = useRef(false);

  useEffect(() => {
    // URL에서 인가 코드(Code) 추출
    const code = searchParams.get("code");

    if (!code) {
      router.push("/login"); // 코드가 없으면 로그인 창으로
      return;
    }

    // 중복 실행 방지
    if (processedRef.current) return;
    processedRef.current = true;

    let currentLang = lang;
    if (!currentLang) {
       const cookieLang = Cookies.get("language");
       if (cookieLang) {
         currentLang = cookieLang as Language;
       }
    }

    // Enum(Language.japanese) 또는 문자열('jp') 둘 다 체크하여 안전성 확보
    const isJapanese = currentLang === 'jp' || currentLang === Language.japanese;
    const langCode = isJapanese ? 'jp' : 'ko';
    
    console.log("Kakao Callback 최종 전송 언어:", langCode);

    // 카카오 REST API로 액세스 토큰 받기
    const KAKAO_REST_API_KEY = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID;
    const KAKAO_CLIENT_SECRET = process.env.NEXT_PUBLIC_KAKAO_CLIENT_SECRET;
    const redirectUri = "http://localhost:3000/kakao/callback";

    if (!KAKAO_REST_API_KEY) {
      toast.error("카카오 클라이언트 ID가 설정되지 않았습니다");
      router.push("/login");
      return;
    }

    console.log("카카오 토큰 요청 시작...");
    console.log("Client ID:", KAKAO_REST_API_KEY);
    console.log("Redirect URI:", redirectUri);
    console.log("Code:", code);

    // 토큰 요청 파라미터 생성
    const tokenParams: Record<string, string> = {
      grant_type: "authorization_code",
      client_id: KAKAO_REST_API_KEY,
      redirect_uri: redirectUri,
      code: code,
    };

    // Client Secret이 있으면 추가
    if (KAKAO_CLIENT_SECRET) {
      tokenParams.client_secret = KAKAO_CLIENT_SECRET;
      console.log("Client Secret 사용");
    }

    // 1단계: 카카오에서 액세스 토큰 받기
    fetch("https://kauth.kakao.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
      },
      body: new URLSearchParams(tokenParams),
    })
      .then(async (res) => {
        console.log("카카오 응답 상태:", res.status, res.statusText);
        
        const responseText = await res.text();
        console.log("카카오 응답 원본:", responseText);
        
        let tokenData;
        try {
          tokenData = JSON.parse(responseText);
        } catch (e) {
          console.error("JSON 파싱 실패:", e);
          throw new Error("카카오 응답을 파싱할 수 없습니다");
        }
        
        console.log("카카오 토큰 응답 파싱:", tokenData);
        
        if (!res.ok || tokenData.error) {
          console.error("카카오 토큰 에러:", tokenData);
          throw new Error(tokenData.error_description || tokenData.error || "카카오 토큰 발급 실패");
        }

        if (!tokenData.access_token) {
          throw new Error("카카오 액세스 토큰을 받지 못했습니다");
        }

        return tokenData;
      })
      .then((tokenData) => {
        console.log("백엔드로 토큰 전송 중...");
        // 2단계: 백엔드로 액세스 토큰 전송
        return clientFetch("/auth/kakao", {
          method: "POST",
          body: { 
            kakaoAccessToken: tokenData.access_token,
            language: langCode 
          },
        });
      })
      .then((data: any) => {
        // 성공 시 쿠키 저장 및 메인 이동
        Cookies.set("accessToken", data.accessToken, { expires: 1 });
        Cookies.set("refreshToken", data.refreshToken, { expires: 7 });
        
        const displayNickname = langCode === 'jp' && data.user.nickname_jp 
            ? data.user.nickname_jp 
            : data.user.nickname;

        toast.success(`${texts.auth.welcomePrefix} ${displayNickname}${texts.auth.welcomeSuffix}`);
        router.push("/home");
      })
      .catch((err) => {
        console.error(err);
        toast.error("카카오 로그인 실패");
        router.push("/login"); // 실패 시 이동 경로 통일
      });
      
  }, [router, searchParams, lang, texts]);

  return (
    <div className="flex h-screen items-center justify-center bg-white">
      <div className="text-center">
        {/* 카카오 노란색 스피너 */}
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-400 mx-auto mb-4"></div>
        <p className="text-gray-600 font-sans">카카오 로그인 중...</p>
      </div>
    </div>
  );
}
