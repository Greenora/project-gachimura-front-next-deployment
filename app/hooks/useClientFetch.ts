import { useState, useEffect, useCallback } from "react";
import { API_CONFIG } from "@/config/api";

interface FetchOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: any;
  headers?: Record<string, string>;
}

// API 요청 헬퍼 함수 (BASE_URL, JSON 변환, Authorization 헤더 자동 추가)
export async function clientFetch<T = any>(url: string, options: FetchOptions = {}): Promise<T> {
  const { method = "GET", body, headers = {} } = options;

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || API_CONFIG.PUBLIC_BASE_URL;
  const fullUrl = url.startsWith("http")
    ? url
    : `${baseUrl}${url.startsWith("/") ? "" : "/"}${url}`;

  // 쿠키에서 accessToken 가져오는 함수
  const getCookieValue = (name: string) => {
    if (typeof document === "undefined") return null;
    const match = document.cookie.match(new RegExp(`(^|;)\\s*${name}\\s*=\\s*([^;]+)`));
    return match ? decodeURIComponent(match[2]) : null;
  };

  const authToken = getCookieValue("accessToken");
  const finalHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...headers,
  };

  if (authToken && !finalHeaders.Authorization) {
    finalHeaders.Authorization = `Bearer ${authToken}`;
  }

  const response = await fetch(fullUrl, {
    method,
    headers: finalHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || `Error: ${response.status}`);
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
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [url, options.method, JSON.stringify(options.body)]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
