import { API_CONFIG } from "@/config/api";

interface FetchOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  redirectOnUnauthorized?: boolean;
}

let refreshPromise: Promise<boolean> | null = null;
let sessionVersion = 0;
export const USER_CHANGED_EVENT = "gachimura:user-changed";

function notifyUserChanged(user: unknown) {
  if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
    window.dispatchEvent(new CustomEvent(USER_CHANGED_EVENT, { detail: user }));
  }
}

async function refreshSession(baseUrl: string): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${baseUrl}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    })
      .then((response) => response.ok)
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

// API 요청 헬퍼 함수 (HttpOnly 인증 쿠키 및 만료 토큰 자동 갱신)
export async function clientFetch<T = unknown>(url: string, options: FetchOptions = {}): Promise<T> {
  const { method = "GET", body, headers = {}, redirectOnUnauthorized = true } = options;

  const rawBase = process.env.NEXT_PUBLIC_API_URL || API_CONFIG.PUBLIC_BASE_URL;
  const baseUrl = rawBase.endsWith("/") ? rawBase.slice(0, -1) : rawBase;
  const path = url.startsWith("/") ? url : `/${url}`;
  const fullUrl = url.startsWith("http") ? url : `${baseUrl}${path}`;
  const isLogin = method === "POST" && ["/auth/login", "/auth/kakao", "/auth/line"].includes(path);
  const requestSessionVersion = isLogin ? ++sessionVersion : sessionVersion;

  // FormData 여부에 따른 헤더 설정
  const isFormData = body instanceof FormData;
  const finalHeaders: Record<string, string> = {
    ...(isFormData ? {} : {"Content-Type": "application/json" }),
    ...headers,
  };

  const executeRequest = () => fetch(fullUrl, {
    method,
    headers: finalHeaders,
    credentials: "include",
    body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
  });

  let response = await executeRequest();
  const canRefresh =
    response.status === 401 &&
    requestSessionVersion === sessionVersion &&
    (!path.startsWith("/auth/") || path === "/auth/logout");

  if (canRefresh && await refreshSession(baseUrl) && requestSessionVersion === sessionVersion) {
    response = await executeRequest();
  }

  const text = await response.text();
  const isCurrentSession = requestSessionVersion === sessionVersion;
  if (response.status === 401 && !isLogin && isCurrentSession) notifyUserChanged(null);
  let result = null;
  try {
    result = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`Error: ${response.status}`);
  }

  if (!response.ok) {
    // 갱신까지 실패한 인증 요청만 로그인 화면으로 보낸다.
    if (response.status === 401 && isCurrentSession && redirectOnUnauthorized && typeof document !== "undefined") {
      // 이미 로그인 페이지면 리다이렉트하지 않음
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    throw Object.assign(new Error(result?.message || `Error: ${response.status}`), { status: response.status });
  }

  if (isLogin) {
    try {
      // A successful login response alone does not prove its cookies were accepted.
      const profile = await fetch(`${baseUrl}/users/profile`, {
        credentials: "include",
        cache: "no-store",
      });
      if (!profile.ok) throw new Error("Session verification failed");
      const user = await profile.json();
      if (typeof result?.user?.email === "string" && user.email !== result.user.email) {
        throw new Error("Session verification failed");
      }
      if (requestSessionVersion !== sessionVersion) throw new Error("Session changed while signing in");
      sessionVersion++;
      notifyUserChanged(user);
    } catch {
      throw Object.assign(new Error("Login session could not be verified"), {
        status: 503,
        code: "SESSION_NOT_ESTABLISHED",
      });
    }
  }

  if (method === "POST" && path === "/auth/logout") {
    sessionVersion++;
    notifyUserChanged(null);
  }

  return result;
}
