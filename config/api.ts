// API 관련 설정 상수
export const API_CONFIG = {
  // 클라이언트 사이드 (브라우저)에서 접근할 때 사용하는 주소
  PUBLIC_BASE_URL: "http://localhost:8000",

  // 소켓 서버 주소
  SOCKET_URL: "http://localhost:8000",

  // 서버 사이드 (Next.js 서버)에서 접근할 때 사용하는 주소
  // 도커 브라우저 환경이 아닐 때는 localhost:8000 쓰셈!
  // 도커 내부 네트워크라면 http://backend:3000 사용
  INTERNAL_BASE_URL: "http://localhost:8000",
};
