"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import type { UserProfile } from "@/app/hooks/UserContext";
import { formatSettlementMoney } from "@/app/lib/settlement-amounts";
import toast from "react-hot-toast";

export type SettlementAccount = Pick<UserProfile, "id" | "nickname" | "accountCountry" | "bankName" | "bankBranchName" | "bankBranchCode" | "accountType" | "accountNumber" | "accountHolder">;

export default function SettlementAccountActions({ account, payments, language, connected, sendMessage }: {
  account: SettlementAccount;
  payments: { userId: number; amount: number; status: string; nickname: string }[];
  language: "korean" | "japanese";
  connected: boolean;
  sendMessage: (message: string) => Promise<boolean>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [sending, setSending] = useState(false);
  const sendingRef = useRef(false);
  const japanese = language === "japanese";
  const copy = japanese ? {
    title: "振込先の案内", show: "見る", hide: "閉じる", number: "口座番号をコピー", share: "支払案内を共有", sending: "共有中…",
    hint: "登録口座と参加者ごとの確定金額を、この集まりのチャットに送ります。", confirm: "口座情報と参加者ごとの金額を、この集まりのチャットに共有しますか？",
    missing: "ウォン建ての割り勘に使う韓国口座を登録してください。", profile: "口座を登録・変更", copied: "口座番号をコピーしました。", copyFailed: "コピーできませんでした。口座番号を選択してコピーしてください。",
    sent: "チャットに共有しました。", failed: "共有を確認できませんでした。チャットを確認してから再試行してください。", reconnect: "チャットに接続すると共有できます。", titleMessage: "振込先・割り勘の案内（KRW）", amounts: "参加者ごとの確定金額", transfer: "送金は銀行アプリで行ってください。ホストが入金を確認します。", tooLong: "案内が長いため送信できません。参加者ごとにチャットで案内してください。",
  } : {
    title: "입금 계좌 안내", show: "보기", hide: "접기", number: "계좌번호 복사", share: "정산 안내 공유", sending: "공유 중…",
    hint: "등록 계좌와 참여자별 확정 금액을 이 모임 채팅방에 보냅니다.", confirm: "계좌정보와 참여자별 금액을 이 모임 채팅방에 공유할까요?",
    missing: "원화 정산에 사용할 한국 계좌를 등록해주세요.", profile: "계좌 등록·변경", copied: "계좌번호를 복사했습니다.", copyFailed: "복사하지 못했습니다. 계좌번호를 선택해 복사해주세요.",
    sent: "채팅방에 공유했습니다.", failed: "공유 결과를 확인하지 못했습니다. 채팅방을 확인한 뒤 다시 시도해주세요.", reconnect: "채팅 연결 후 공유할 수 있습니다.", titleMessage: "입금 계좌·정산 안내 (원화)", amounts: "참여자별 확정 금액", transfer: "실제 송금은 은행 앱에서 진행해주세요. 방장이 입금을 확인합니다.", tooLong: "안내가 길어 전송할 수 없습니다. 참여자별로 채팅에서 안내해주세요.",
  };
  const isKoreanAccount = account.accountCountry === "KR" || (!account.accountCountry && !account.bankBranchName && !account.bankBranchCode && !account.accountType);
  const available = isKoreanAccount && Boolean(account.bankName?.trim() && account.accountNumber?.trim() && account.accountHolder?.trim());

  async function copyNumber() {
    try {
      await navigator.clipboard.writeText(account.accountNumber!.trim());
      toast.success(copy.copied);
    } catch {
      toast.error(copy.copyFailed);
    }
  }

  async function share() {
    if (!available || !connected || sendingRef.current || !window.confirm(copy.confirm)) return;
    if (payments.some(payment => !Number.isSafeInteger(payment.amount) || payment.amount < 0)) return;
    const message = [
      copy.titleMessage,
      `${account.bankName!.trim()} ${account.accountNumber!.trim()}`,
      account.accountHolder!.trim(),
      "",
      copy.amounts,
      ...payments.map(payment => {
        const status = payment.amount === 0 ? (japanese ? "送金不要" : "송금 없음")
          : payment.status === "PAID" ? (japanese ? "入金確認済み" : "입금 확인 완료")
            : (japanese ? "入金待ち" : "입금 대기");
        return `${payment.nickname.replace(/[\r\n]/g, " ")}: ${formatSettlementMoney(payment.amount, language)} (${status})`;
      }),
      "",
      copy.transfer,
    ].join("\n");
    if (message.length > 2000) { toast.error(copy.tooLong); return; }
    sendingRef.current = true;
    setSending(true);
    try {
      const sent = await sendMessage(message);
      if (sent) toast.success(copy.sent);
      else toast.error(copy.failed);
    } catch {
      toast.error(copy.failed);
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  }

  return (
    <section aria-label={copy.title} className="mt-6 rounded-xl border border-gray-200 p-3 sm:p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-gray-900 sm:text-base">{copy.title}</h3>
        <button type="button" aria-expanded={expanded} onClick={() => setExpanded(value => !value)} className="min-h-11 px-2 text-sm font-semibold text-[#33612E] sm:hidden">{expanded ? copy.hide : copy.show}</button>
      </div>
      <div className={`${expanded ? "block" : "hidden"} sm:block`}>
        {available ? <>
          <p className="mt-3 break-words text-sm text-gray-700"><span>{account.bankName}</span> · <span className="select-all">{account.accountNumber}</span> · <span>{account.accountHolder}</span></p>
          <p className="mt-2 text-xs leading-relaxed text-gray-500">{copy.hint}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={copyNumber} className="min-h-11 rounded-full border border-[#33612E] px-4 py-2 text-sm font-bold text-[#33612E]">{copy.number}</button>
            <button type="button" onClick={share} disabled={sending || !connected} className="min-h-11 rounded-full bg-[#33612E] px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{sending ? copy.sending : copy.share}</button>
          </div>
          {!connected && <p className="mt-2 text-xs text-gray-500">{copy.reconnect}</p>}
        </> : <>
          <p className="mt-3 text-sm text-gray-600">{copy.missing}</p>
          <Link href={`/user/${account.id}?error=accountNumber`} className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-[#33612E] underline">{copy.profile}</Link>
        </>}
      </div>
    </section>
  );
}
