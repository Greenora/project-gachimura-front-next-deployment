"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { clientFetch } from "@/app/hooks/useClientFetch";
import { useLanguage } from "@/app/hooks/LanguageContext";
import { Language } from "@/app/common/types";
import toast from "react-hot-toast";
import Cookies from "js-cookie";

type KakaoLoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: {
    nickname: string;
    nickname_jp?: string;
  };
};

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

    let currentLang: Language | string | undefined = lang;
    if (!currentLang) {
      const cookieLang = Cookies.get("language");
      if (cookieLang) {
        currentLang = cookieLang as Language;
      }
    }

    // Enum(Language.japanese) 또는 문자열('jp') 둘 다 체크하여 안전성 확보
    const isJapanese =
      currentLang === "jp" ||
      currentLang === Language.japanese ||
      currentLang === "japanese";
    const langCode = isJapanese ? "jp" : "ko";

    const redirectUri = `${window.location.origin}/kakao/callback`;

    // 백엔드가 카카오 인가 코드를 액세스 토큰으로 안전하게 교환한다.
    clientFetch<KakaoLoginResponse>("/auth/kakao", {
      method: "POST",
      body: {
        code,
        redirectUri,
        language: langCode,
      },
    })
      .then((data) => {
        // 성공 시 쿠키 저장 및 메인 이동
        Cookies.set("accessToken", data.accessToken, { expires: 1 });
        Cookies.set("refreshToken", data.refreshToken, { expires: 7 });
        const displayNickname =
          langCode === "jp" && data.user.nickname_jp
            ? data.user.nickname_jp
            : data.user.nickname;

        toast.success(
          `${texts.auth.welcomePrefix} ${displayNickname}${texts.auth.welcomeSuffix}`,
        );
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
