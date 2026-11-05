"use client";

import { useState, useSyncExternalStore } from "react";
import { usePwa } from "@/app/hooks/PwaContext";
import { useLanguage } from "@/app/hooks/LanguageContext";
import { Language } from "@/app/common/types";

const subscribeDevice = () => () => {};
const serverDevice = () => false;
const mobileDevice = () => /Android|iPhone|iPad|iPod/.test(navigator.userAgent)
  || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

export default function AppSettings() {
  const { lang } = useLanguage();
  const { installed, isIOS, status, failed, install, enablePush, disablePush, refresh } = usePwa();
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const isMobile = useSyncExternalStore(subscribeDevice, mobileDevice, serverDevice);
  const japanese = lang === Language.japanese;
  const copy = japanese ? {
    title: "通知と端末の設定", chat: "新着チャットの通知", home: "ホーム画面に追加", install: "アプリをインストール", installed: "インストール済み",
    enable: "通知をオンにする", disable: "通知をオフにする", loading: "確認中…", retry: "もう一度確認",
    disabled: "新着チャットの通知をこの端末で受け取れます。", enabled: "新着チャットの通知がオンです。",
    unavailable: "通知サービスを準備中です。", unsupported: "このブラウザーではチャット通知を利用できません。",
    denied: "通知がブロックされています。ブラウザーのサイト設定から許可してください。",
    ios: "ホーム画面に追加したアプリを開いて、通知をオンにしてください。",
    iosInstall: "Safariの共有メニューから「ホーム画面に追加」を選んでください。",
    manualInstall: "ブラウザーのメニューから「アプリをインストール」または「ホーム画面に追加」を選んでください。",
    failed: "通知設定を更新できませんでした。もう一度お試しください。",
    privacy: "通知にメッセージ本文や口座情報は表示しません。",
  } : {
    title: "알림 및 기기 설정", chat: "새 채팅 알림", home: "홈 화면에 추가", install: "앱 설치", installed: "설치됨",
    enable: "채팅 알림 켜기", disable: "채팅 알림 끄기", loading: "확인 중…", retry: "다시 확인",
    disabled: "새 채팅이 오면 이 기기로 알림을 받습니다.", enabled: "새 채팅 알림이 켜져 있습니다.",
    unavailable: "알림 서비스를 준비 중입니다.", unsupported: "이 브라우저에서는 채팅 알림을 지원하지 않습니다.",
    denied: "알림이 차단되어 있습니다. 브라우저의 사이트 설정에서 허용해주세요.",
    ios: "홈 화면에 추가한 앱을 열어 채팅 알림을 켜주세요.",
    iosInstall: "Safari의 공유 메뉴에서 ‘홈 화면에 추가’를 선택해주세요.",
    manualInstall: "브라우저 메뉴에서 ‘앱 설치’ 또는 ‘홈 화면에 추가’를 선택해주세요.",
    failed: "알림 설정을 변경하지 못했습니다. 다시 시도해주세요.",
    privacy: "알림에는 메시지 본문이나 계좌 정보를 표시하지 않습니다.",
  };
  const message = status === "install" ? copy.ios : copy[status];
  const disabled = ["loading", "unsupported", "denied", "install"].includes(status);
  const pushLabel = status === "enabled" ? copy.disable : status === "loading" ? copy.loading : status === "unavailable" ? copy.retry : copy.enable;

  return (
    <details aria-labelledby="app-settings-title" className="group overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <summary className="flex min-h-16 cursor-pointer list-none items-center gap-3 px-5 py-4 text-sm font-semibold text-gray-800 [&::-webkit-details-marker]:hidden sm:px-6">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5 shrink-0 text-gray-500"><path strokeLinecap="round" strokeLinejoin="round" d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg>
        <span id="app-settings-title">{copy.title}</span>
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="ml-auto h-4 w-4 shrink-0 text-gray-400 transition-transform group-open:rotate-90"><path strokeLinecap="round" strokeLinejoin="round" d="m9 5 7 7-7 7" /></svg>
      </summary>
      <div className="px-5 pb-4 sm:px-6">
        <div className="flex items-center justify-between gap-4 border-t border-gray-100 py-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800">{copy.chat}</p>
            <p role="status" className="mt-1 text-xs leading-relaxed text-gray-500">{message}</p>
          </div>
          <button type="button" disabled={disabled} aria-busy={status === "loading"} aria-label={pushLabel} aria-pressed={status === "enabled"}
            onClick={() => void (status === "enabled" ? disablePush() : status === "unavailable" ? refresh() : enablePush())}
            className={status === "unavailable"
              ? "min-h-11 shrink-0 rounded-lg border border-green-800 px-3 text-xs font-semibold text-green-800"
              : "flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg disabled:opacity-45"}>
            {status === "unavailable" ? copy.retry : (
              <span aria-hidden="true" className={`flex h-6 w-11 items-center rounded-full p-0.5 transition-colors ${status === "enabled" ? "bg-[#166534]" : "bg-gray-300"}`}>
                <span className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${status === "enabled" ? "translate-x-5" : "translate-x-0"}`} />
              </span>
            )}
          </button>
        </div>
        {isMobile && (
          <div className="flex items-center justify-between gap-4 border-t border-gray-100 py-4">
            <p className="text-sm font-semibold text-gray-800">{copy.home}</p>
            <button type="button" disabled={installed} onClick={async () => setShowInstallHelp(!await install())}
              className="min-h-11 shrink-0 rounded-lg border border-gray-200 px-3 text-xs font-semibold text-[#166534] disabled:text-gray-500">
              {installed ? copy.installed : copy.install}
            </button>
          </div>
        )}
        {showInstallHelp && !installed && isMobile && <p className="mb-3 text-xs leading-relaxed text-gray-600">{isIOS ? copy.iosInstall : copy.manualInstall}</p>}
        {failed && <p role="alert" className="mb-3 text-xs text-red-700">{copy.failed}</p>}
        <p className="text-xs leading-relaxed text-gray-500">{copy.privacy}</p>
      </div>
    </details>
  );
}
