import { Suspense } from "react";
import KakaoCallback from "@/components/auth/KakaoCallback";

export default function KakaoCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-white">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-400 mx-auto mb-4"></div>
            <p className="text-gray-600 font-sans">카카오 로그인 중...</p>
          </div>
        </div>
      }
    >
      <KakaoCallback />
    </Suspense>
  );
}