import { useState, useEffect, useCallback } from "react";
import { API_CONFIG } from "@/config/api";

interface FetchOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: any;
  headers?: Record<string, string>;
}

/**
 * 헬퍼 함수: 모든 fetch 요청에서 공통으로 처리할 로직 (BASE_URL, JSON 처리 등)
 */
export async function clientFetch<T = any>(url: string, options: FetchOptions = {}): Promise<T> {
  const { method = "GET", body, headers = {} } = options;

  const fullUrl = url.startsWith("http")
    ? url
    : `${API_CONFIG.PUBLIC_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
  
  const isFormData = body instanceof FormData;

  const response = await fetch(fullUrl, {
    method,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...headers,
    },
    body: body === undefined
      ? undefined
      : isFormData
      ? body
      : JSON.stringify(body)
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || `Error: ${response.status}`);
  }

  return result;
}

/**
 * 커스텀 훅: 선언적으로 데이터를 가져올 때 사용 (컴포넌트 로드 시)
 */
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
