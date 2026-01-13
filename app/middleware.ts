
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 로그인이 꼭 필요한 페이지들 목록
const protectedRoutes = ["/chat", "/home"];

export function middleware(request: NextRequest) {
  const token = request.cookies.get("accessToken")?.value;
  const { pathname } = request.nextUrl;

  // 보호된 페이지에 접근하는데 토큰이 없다?
  if (protectedRoutes.some((route) => pathname.startsWith(route)) && !token) {
    // 로그인 페이지로 강제 이동
    const loginUrl = new URL("/login", request.url);
    // 로그인 끝나고 다시 돌아올 수 있게 원래 주소를 기억해둠 (선택사항)
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 이미 로그인했는데 로그인 페이지(/login)에 또 가려고 한다?
  if (pathname === "/login" && token) {
    // 메인으로 튕겨내기
    return NextResponse.redirect(new URL("/home", request.url));
  }

  return NextResponse.next();
}

// 어떤 주소에서 미들웨어가 동작할지 설정
export const config = {
  matcher: [
    /*
     * 아래 경로를 제외한 모든 경로에서 실행
     * - api (API 라우트)
     * - _next/static (정적 파일)
     * - _next/image (이미지 최적화 파일)
     * - favicon.ico (파비콘)
     * - images (로컬 이미지 폴더)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|images).*)",
  ],
};