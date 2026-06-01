import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-white to-slate-50 px-4">
      {/* 로고 */}
      <Image
        src="/images/gachimura_logo.png"
        alt="GACHIMURA"
        width={80}
        height={80}
        className="mb-6 opacity-80"
      />

      {/* 404 숫자 */}
      <h1 className="text-8xl font-extrabold text-[#33612E] tracking-tight">
        404
      </h1>

      {/* 안내 메시지 */}
      <p className="mt-4 text-xl font-semibold text-slate-700">
        페이지를 찾을 수 없습니다
      </p>
      <p className="mt-2 text-sm text-slate-400 text-center max-w-md">
        요청하신 페이지가 존재하지 않거나, 이동되었을 수 있습니다.
        <br />
        주소를 다시 확인해 주세요.
      </p>

      {/* 홈으로 돌아가기 버튼 */}
      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#33612E] px-6 py-3 text-sm font-medium text-white shadow-lg transition-all hover:bg-emerald-600 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z"
          />
        </svg>
        홈으로 돌아가기
      </Link>
    </div>
  );
}
