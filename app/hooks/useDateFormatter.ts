"use client";

import { useCallback, useMemo } from "react";
import { useLanguage } from "./LanguageContext";
import { Language } from "@/app/common/types";

// 포맷터 캐시용
const formatterCache = new Map<string, Intl.DateTimeFormat>();

function getFormatter(locale: string, options: Intl.DateTimeFormatOptions) {
  const key = JSON.stringify({ locale, ...options });
  if (!formatterCache.has(key)) {
    formatterCache.set(key, new Intl.DateTimeFormat(locale, options));
  }
  return formatterCache.get(key)!;
}

export function useDateFormatter() {
  const { lang } = useLanguage();
  const locale = useMemo(() => lang === Language.korean ? "ko-KR" : "ja-JP", [lang]);

  // 날짜 전체 포맷팅 (헤더용)
  const formatFullDate = useCallback((dateInput: string | Date | undefined) => {
    if (!dateInput) return lang === Language.korean ? "날짜 정보 없음" : "日付情報なし";
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return lang === Language.korean ? "유효하지 않은 날짜" : "無効な日付";

    return getFormatter(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      hourCycle: "h12",
      timeZone: "Asia/Seoul",
    }).format(date);
  }, [lang, locale]);

  // 채팅방 날짜 구분선용
  const formatDividerDate = useCallback((dateInput: string | Date | undefined) => {
    if (!dateInput) return "";
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return "";

    return getFormatter(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
      timeZone: "Asia/Seoul",
    }).format(date);
  }, [locale]);

  // 메시지 옆 시간 포맷
  const formatMessageTime = useCallback((dateInput: string | Date | undefined) => {
    if (!dateInput) return "";
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return "";

    return getFormatter(locale, {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      hourCycle: "h12",
      timeZone: "Asia/Seoul",
    }).format(date);
  }, [locale]);

  // 카드용 24시간 형식 포맷팅 (오전/오후 제외)
  const formatCardDate = useCallback((dateInput: string | Date | undefined) => {
    if (!dateInput) return lang === Language.korean ? "날짜 정보 없음" : "日付情報なし";
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return lang === Language.korean ? "유효하지 않은 날짜" : "無効한 日付";

    return getFormatter(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      hourCycle: "h23",
      timeZone: "Asia/Seoul",
    }).format(date);
  }, [lang, locale]);

  return { formatFullDate, formatDividerDate, formatMessageTime, formatCardDate };
}
