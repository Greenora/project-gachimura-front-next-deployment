// API 관련 설정 상수
export const API_CONFIG = {
  // 클라이언트 사이드 (브라우저)에서 접근할 때 사용하는 주소
  PUBLIC_BASE_URL: "http://localhost:8000",

  // 소켓 서버 주소
  SOCKET_URL: "http://localhost:8000",

  // 서버 사이드 (Next.js 서버)에서 도커 내부 네트워크로 접근할 때 사용하는 주소
  INTERNAL_BASE_URL: "http://backend:3000",
};
