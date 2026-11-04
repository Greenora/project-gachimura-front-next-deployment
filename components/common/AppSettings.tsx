"use client";

import { useState } from "react";
import { usePwa } from "@/app/hooks/PwaContext";
import { useLanguage } from "@/app/hooks/LanguageContext";
import { Language } from "@/app/common/types";

export default function AppSettings() {
  const { lang } = useLanguage();
  const { installed, isIOS, status, failed, install, enablePush, disablePush, refresh } = usePwa();
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const japanese = lang === Language.japanese;
  const copy = japanese ? {
    title: "アプリと通知", install: "アプリをインストール", installed: "インストール済み",
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
    title: "앱 설치 및 알림", install: "앱 설치", installed: "설치됨",
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

  return (
    <section aria-labelledby="app-settings-title" className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6">
      <h2 id="app-settings-title" className="text-lg font-bold text-gray-900">{copy.title}</h2>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <button type="button" disabled={installed} onClick={async () => setShowInstallHelp(!await install())}
          className="min-h-11 rounded-xl border border-[#166534] px-5 font-bold text-[#166534] disabled:border-gray-200 disabled:text-gray-500">
          {installed ? copy.installed : copy.install}
        </button>
        <button type="button" disabled={disabled} aria-busy={status === "loading"}
          onClick={() => void (status === "enabled" ? disablePush() : status === "unavailable" ? refresh() : enablePush())}
          className="min-h-11 rounded-xl bg-[#166534] px-5 font-bold text-white disabled:bg-gray-200 disabled:text-gray-500">
          {status === "enabled" ? copy.disable : status === "loading" ? copy.loading : status === "unavailable" ? copy.retry : copy.enable}
        </button>
      </div>
      {showInstallHelp && !installed && <p className="mt-3 text-sm text-gray-700">{isIOS ? copy.iosInstall : copy.manualInstall}</p>}
      <p role="status" className="mt-3 text-sm text-gray-700">{message}</p>
      {failed && <p role="alert" className="mt-2 text-sm text-red-700">{copy.failed}</p>}
      <p className="mt-2 text-xs text-gray-500">{copy.privacy}</p>
    </section>
  );
}
