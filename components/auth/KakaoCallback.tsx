"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { clientFetch } from "@/app/hooks/useClientFetch";
import { useLanguage } from "@/app/hooks/LanguageContext";
import { Language } from "@/app/common/types";
import toast from "react-hot-toast";
import { consumeOAuthState } from "@/app/lib/oauth-state";

type KakaoLoginResponse = {
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
    // 중복 실행 방지
    if (processedRef.current) return;
    processedRef.current = true;

    const code = searchParams.get("code");
    const validState = consumeOAuthState("kakao", searchParams.get("state"));
    const isJapanese = lang === Language.japanese;
    const langCode = isJapanese ? "jp" : "ko";
    window.history.replaceState(null, "", window.location.pathname);
    if (!code || !validState) {
      toast.error(isJapanese ? "ログインを確認できませんでした。もう一度ログインしてください。" : "로그인 요청을 확인하지 못했습니다. 다시 로그인해주세요.");
      router.replace("/login");
      return;
    }

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
        // 인증 쿠키는 백엔드가 HttpOnly로 안전하게 설정한다.
        const displayNickname =
          langCode === "jp" && data.user.nickname_jp
            ? data.user.nickname_jp
            : data.user.nickname;

        toast.success(
          `${texts.auth.welcomePrefix} ${displayNickname}${texts.auth.welcomeSuffix}`,
        );
        router.push("/home");
      })
      .catch((error: unknown) => {
        const conflict = error !== null && typeof error === "object" && "status" in error && error.status === 409;
        toast.error(conflict
          ? (isJapanese ? "このメールアドレスはすでに登録されています。以前と同じ方法でログインしてください。" : "같은 이메일의 계정이 있습니다. 기존 로그인 방식으로 로그인해주세요.")
          : (isJapanese ? "カカオログインに失敗しました。もう一度お試しください。" : "카카오 로그인에 실패했습니다. 다시 시도해주세요."));
        router.replace("/login");
      });
  }, [router, searchParams, lang, texts]);

  return (
    <div className="flex h-screen items-center justify-center bg-white">
      <div className="text-center">
        {/* 카카오 노란색 스피너 */}
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-400 mx-auto mb-4"></div>
        <p className="text-gray-600 font-sans">{lang === Language.japanese ? "カカオでログインしています…" : "카카오 로그인 중..."}</p>
      </div>
    </div>
  );
}
