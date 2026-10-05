import { useState, useEffect, useCallback } from "react";
import { API_CONFIG } from "@/config/api";

interface FetchOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  redirectOnUnauthorized?: boolean;
}

let refreshPromise: Promise<boolean> | null = null;

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
    (!path.startsWith("/auth/") || path === "/auth/logout");

  if (canRefresh && await refreshSession(baseUrl)) {
    response = await executeRequest();
  }

  const text = await response.text();
  let result = null;
  try {
    result = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`Error: ${response.status}`);
  }

  if (!response.ok) {
    // 갱신까지 실패한 인증 요청만 로그인 화면으로 보낸다.
    if (response.status === 401 && redirectOnUnauthorized && typeof document !== "undefined") {
      // 이미 로그인 페이지면 리다이렉트하지 않음
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    throw Object.assign(new Error(result?.message || `Error: ${response.status}`), { status: response.status });
  }

  return result;
}

// 커스텀 훅: 컴포넌트 로드 시 자동으로 데이터 가져옴 (로딩, 에러 상태 관리)
export function useClientFetch<T>(url: string, options: FetchOptions = {}) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!url) return;
    setLoading(true);
    setError(null);
    try {
      const result = await clientFetch<T>(url, options);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [url, options.method, JSON.stringify(options.body)]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
