import { Suspense } from "react";
import LineCallback from "@/components/auth/LineCallback";

// LINE OAuth 콜백 페이지 (서버 컴포넌트)
export default function LineCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-white">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-gray-600 font-sans">LINE 로그인 중...</p>
          </div>
        </div>
      }
    >
      <LineCallback />
    </Suspense>
  );
}