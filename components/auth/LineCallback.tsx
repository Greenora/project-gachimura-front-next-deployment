"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { clientFetch } from "@/app/hooks/useClientFetch";
import { useLanguage } from "@/app/hooks/LanguageContext";
import { Language } from "@/app/common/types"; 
import toast from "react-hot-toast";
import { consumeOAuthState } from "@/app/lib/oauth-state";

type LineLoginResponse = {
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
    if (processedRef.current) return;
    processedRef.current = true;
    const code = searchParams.get("code");
    const validState = consumeOAuthState("line", searchParams.get("state"));
    const japanese = lang === Language.japanese;
    const langCode = japanese ? 'jp' : 'ko';
    window.history.replaceState(null, "", window.location.pathname);
    if (!code || !validState) {
      toast.error(japanese ? "ログインを確認できませんでした。もう一度ログインしてください。" : "로그인 요청을 확인하지 못했습니다. 다시 로그인해주세요.");
      router.replace("/login");
      return;
    }
    
    const redirectUri = `${window.location.origin}/line/callback`;

    // 백엔드로 인가 코드 전송 (백엔드가 LINE 서버와 토큰 교환)
    clientFetch<LineLoginResponse>("/auth/line", {
      method: "POST",
      body: { 
        code, 
        redirectUri,
        language: langCode // 회원가입일 경우 닉네임 생성용
      },
    })
      .then((data: LineLoginResponse) => {
        const displayNickname = langCode === 'jp' && data.user.nickname_jp 
            ? data.user.nickname_jp 
            : data.user.nickname;

        toast.success(`${texts.auth.welcomePrefix} ${displayNickname}${texts.auth.welcomeSuffix}`);
        router.push("/home"); // 메인으로 이동
      })
      .catch(() => {
        toast.error(japanese ? "LINEログインに失敗しました。もう一度お試しください。" : "LINE 로그인에 실패했습니다. 다시 시도해주세요.");
        router.replace("/login");
      });
  }, [router, searchParams, lang, texts]);

  return (
    <div className="flex h-screen items-center justify-center bg-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-500 mx-auto mb-4"></div>
        <p className="text-gray-600 font-sans">{lang === Language.japanese ? "LINEでログインしています…" : "LINE 로그인 중..."}</p>
      </div>
    </div>
  );
}
