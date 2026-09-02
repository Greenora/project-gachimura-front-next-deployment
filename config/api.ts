// API 관련 설정 상수
// 도커 환경인지 확인 (환경변수로 판단)
const isDocker = process.env.NEXT_PUBLIC_DOCKER === 'true';

export const API_CONFIG = {
  // 클라이언트 사이드 (브라우저)에서 접근할 때 사용하는 주소
  PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",

  // 소켓 서버 주소
  SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",

  // 서버 사이드 (Next.js 서버)에서 접근할 때 사용하는 주소
  // 도커 컨테이너 안에서는 http://backend:8000, 로컬에서는 http://localhost:8000
  INTERNAL_BASE_URL: process.env.INTERNAL_API_URL || (isDocker ? "http://backend:8000" : "http://localhost:8000"),
};
