"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/app/hooks/LanguageContext";
import { clientFetch, USER_CHANGED_EVENT } from "@/app/hooks/useClientFetch";
import { useDateFormatter } from "@/app/hooks/useDateFormatter";
import { useVisiblePolling } from "@/app/hooks/useVisiblePolling";
import { useChat } from "@/app/hooks/useChat";
import SettlementAccountActions, { type SettlementAccount } from "./SettlementAccountActions";
import { getSettlementAmounts, formatSettlementMoney } from "@/app/lib/settlement-amounts";
import { Language } from "@/app/common/types";
import toast from "react-hot-toast";

interface SettlementItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  members?: { userId: number; user?: { nickname: string } }[];
}

interface Settlement {
  id: number;
  partyId: number;
  hostId: number;
  status: string;
  totalAmount: number;
  items: SettlementItem[];
}

interface Payment {
  id: number;
  userId: number;
  amount: number;
  status: string;
  user?: { nickname: string; profileImage?: string };
}

interface PartyInfo {
  id: number;
  title: string;
  meetDate: string;
  storeName: string;
  hostId: number;
}

interface Member {
  id: number;
  nickname: string;
  profileImage?: string;
}

interface SettlementClientProps {
  partyId: number;
  initialSettlement: Settlement | null;
  partyInfo: PartyInfo | null;
  members: Member[];
  currentUser: SettlementAccount;
  initialPayments: Payment[];
}

function selectionIds(settlement: Settlement | null, userId: number) {
  return settlement?.items?.filter(item => item.members?.some(member => member.userId === userId)).map(item => item.id) || [];
}

function sameSelection(first: number[], second: number[]) {
  return first.length === second.length && first.every(id => second.includes(id));
}

export default function SettlementClient({
  partyId,
  initialSettlement,
  partyInfo,
  members,
  currentUser,
  initialPayments,
}: SettlementClientProps) {
  const router = useRouter();
  const { texts, lang } = useLanguage();
  const { formatFullDate } = useDateFormatter();
  const settlementTexts = texts.settlement;
  const isKorean = lang === Language.korean;

  const formatMoney = useCallback((amount: number) => formatSettlementMoney(amount, lang), [lang]);
  const copy = isKorean ? {
    saveFirst: "내 선택을 먼저 저장해주세요.", missing: "선택한 사람이 없는 품목이 {count}개 있습니다.",
    noneSelected: "선택한 사람이 없어요", hostShare: "본인 부담액", myShare: "내 확정 금액",
    amountPending: "금액 정보를 확인 중입니다.", noTransfer: "송금 없음", hostOnly: "본인 부담 · 송금 없음",
    transferGuide: "채팅방에 공유된 정산 안내를 확인해주세요. 실제 송금은 은행 앱에서 진행하고 방장이 입금을 확인합니다.",
    refreshFailed: "저장은 완료됐지만 최신 상태를 불러오지 못했어요. 잠시 후 다시 확인할게요.",
  } : {
    saveFirst: "自分の選択を先に保存してください。", missing: "選択した人がいない品目が{count}件あります。",
    noneSelected: "まだ誰も選択していません", hostShare: "自分の負担額", myShare: "自分の確定金額",
    amountPending: "金額を確認しています。", noTransfer: "送金不要", hostOnly: "自分の負担・送金不要",
    transferGuide: "チャットに共有された支払案内をご確認ください。送金は銀行アプリで行い、ホストが入金を確認します。",
    refreshFailed: "保存は完了しましたが最新の状態を取得できませんでした。しばらくしてから再確認します。",
  };

  const [settlement, setSettlement] = useState<Settlement | null>(initialSettlement);
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [loading, setLoading] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [receiptFeedback, setReceiptFeedback] = useState<string | null>(null);
  const [receiptTotal, setReceiptTotal] = useState<number | null>(null);
  const [partyData, setPartyData] = useState<PartyInfo | null>(partyInfo);
  const [isPageReady, setIsPageReady] = useState(false);
  const [sessionActive, setSessionActive] = useState(true);
  const [refreshRequest, setRefreshRequest] = useState(0);
  const { settlementVersion, sendMessage, connectionStatus } = useChat(sessionActive ? partyId : 0);
  const activeRef = React.useRef(false);
  const requestVersionRef = React.useRef(0);
  const mutationLockRef = React.useRef(false);
  const selectionDirtyRef = React.useRef(false);
  const itemsDirtyRef = React.useRef(false);
  const snapshotRef = React.useRef({ id: initialSettlement?.id, status: initialSettlement?.status });
  const startFlowLockRef = React.useRef(false);
  const startSelectingLockRef = React.useRef(false);
  const revertLockRef = React.useRef(false);
  const resumedFromEditRef = React.useRef(false);
  const receiptUploadLockRef = React.useRef(false);
  const cameraInputRef = React.useRef<HTMLInputElement>(null);
  const albumInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    activeRef.current = true;
    const onSessionChanged = (event: Event) => {
      if ((event as CustomEvent<{ id: number } | null>).detail?.id === currentUser.id) return;
      activeRef.current = false;
      requestVersionRef.current++;
      mutationLockRef.current = true;
      setSessionActive(false);
      setLoading(true);
    };
    window.addEventListener(USER_CHANGED_EVENT, onSessionChanged);
    return () => {
      activeRef.current = false;
      window.removeEventListener(USER_CHANGED_EVENT, onSessionChanged);
    };
  }, [currentUser.id, partyId]);

  const isCurrent = useCallback((version: number) => activeRef.current && requestVersionRef.current === version, []);
  const beginMutation = useCallback(() => {
    if (!activeRef.current || mutationLockRef.current) return null;
    mutationLockRef.current = true;
    const version = ++requestVersionRef.current;
    setLoading(true);
    return version;
  }, []);
  const endMutation = useCallback((version: number) => {
    if (!isCurrent(version)) return;
    mutationLockRef.current = false;
    setLoading(false);
    setRefreshRequest(request => request + 1);
  }, [isCurrent]);

  React.useEffect(() => {
    const rafId = requestAnimationFrame(() => setIsPageReady(true));
    return () => cancelAnimationFrame(rafId);
  }, []);

  // 서버에서 partyInfo를 못 가져왔으면 클라이언트에서 재시도
  React.useEffect(() => {
    let cancelled = false;
    if (!partyData && partyId) {
      clientFetch<{ id: number; title: string; meetingDate: string; location?: { name: string }; storeName?: string; host?: { id: number }; hostId: number }>(`/parties/${partyId}`)
        .then(data => {
          if (cancelled || !activeRef.current) return;
          setPartyData({
            id: data.id,
            title: data.title || "",
            meetDate: data.meetingDate || "",
            storeName: data.location?.name || data.storeName || "",
            hostId: data.host?.id || data.hostId,
          });
        })
        .catch(() => {});
    }
    return () => { cancelled = true; };
  }, [partyData, partyId]);

  // 직접 작성 모드용 상태
  const [editItems, setEditItems] = useState<
    { id?: number; name: string; price: number; quantity: number }[]
  >(
    initialSettlement?.items?.map((i) => ({
      id: i.id,
      name: i.name,
      price: i.price,
      quantity: i.quantity,
    })) || []
  );

  const [selectedItemIds, setSelectedItemIds] = useState<number[]>(() => selectionIds(initialSettlement, currentUser.id));
  const selectionRef = React.useRef(selectedItemIds);
  const savedItemsTotal = editItems.filter(item => item.name.trim() && item.price > 0)
    .reduce((sum, item) => sum + item.price * item.quantity, 0);
  const receiptMismatch = receiptTotal !== null && savedItemsTotal !== receiptTotal;
  const mismatchFeedback = receiptMismatch
    ? settlementTexts.receiptTotalMismatch.replace("{recognizedTotal}", formatMoney(savedItemsTotal)).replace("{receiptTotal}", formatMoney(receiptTotal))
    : null;
  const visibleReceiptFeedback = mismatchFeedback
    ? receiptFeedback && receiptFeedback !== settlementTexts.receiptReview ? `${receiptFeedback} ${mismatchFeedback}` : mismatchFeedback
    : receiptFeedback;

  const applySnapshot = useCallback((next: Settlement | null, nextPayments?: Payment[]) => {
    if (next && !Array.isArray(next.items)) next = { ...next, items: [] };
    const changed = snapshotRef.current.id !== next?.id;
    const phaseChanged = snapshotRef.current.status !== next?.status;
    if (changed || next?.status !== "DRAFT" || phaseChanged) setReceiptTotal(null);
    if (changed || next?.status !== "SELECTING") selectionDirtyRef.current = false;
    const saved = selectionIds(next, currentUser.id);
    const selected = selectionDirtyRef.current
      ? selectionRef.current.filter(id => next?.items.some(item => item.id === id))
      : saved;
    selectionDirtyRef.current = !sameSelection(selected, saved);
    selectionRef.current = selected;
    setSelectedItemIds(selected);
    if (changed || (phaseChanged && next?.status === "DRAFT")) itemsDirtyRef.current = false;
    if (next?.status === "DRAFT" && !itemsDirtyRef.current) {
      setEditItems(next.items.map(item => ({ id: item.id, name: item.name, price: item.price, quantity: item.quantity })));
    }
    snapshotRef.current = { id: next?.id, status: next?.status };
    setSettlement(next);
    if (nextPayments) setPayments(nextPayments);
    else if (changed || !next || !["CONFIRMED", "COMPLETED"].includes(next.status)) setPayments([]);
  }, [currentUser.id]);

  const loadSnapshot = useCallback(async (version: number, signal?: AbortSignal) => {
    const next = await clientFetch<Settlement | null>(`/settlements/party/${partyId}`);
    if (!isCurrent(version) || signal?.aborted) return;
    const nextPayments = next && ["CONFIRMED", "COMPLETED"].includes(next.status)
      ? await clientFetch<Payment[]>(`/settlements/${next.id}/payments`)
      : [];
    if (!isCurrent(version) || signal?.aborted) return;
    applySnapshot(next, nextPayments);
  }, [partyId, isCurrent, applySnapshot]);
  const refreshSnapshot = useCallback(async (signal: AbortSignal) => {
    if (mutationLockRef.current || startFlowLockRef.current) return;
    await loadSnapshot(requestVersionRef.current, signal);
  }, [loadSnapshot]);
  useVisiblePolling(refreshSnapshot, sessionActive && !loading, refreshRequest + settlementVersion);

  const isHost = partyData?.hostId === currentUser.id;

  // 정산 생성
  const handleCreateSettlement = useCallback(async () => {
    const version = beginMutation();
    if (version === null) return;
    try {
      const result = await clientFetch<Settlement>("/settlements", {
        method: "POST",
        body: { partyId },
      });
      if (!isCurrent(version)) return;
      applySnapshot(result);
      toast.success(settlementTexts.settlementCreated);
    } catch (err) {
      if (isCurrent(version)) toast.error(err instanceof Error ? err.message : settlementTexts.settlementCreateFail);
    } finally {
      endMutation(version);
    }
  }, [partyId, settlementTexts, beginMutation, endMutation, isCurrent, applySnapshot]);

  // 품목 추가
  const handleAddItem = useCallback(() => {
    if (mutationLockRef.current) return;
    itemsDirtyRef.current = true;
    setEditItems((prev) => [...prev, { name: "", price: 0, quantity: 1 }]);
  }, []);

  // 품목 삭제
  const handleRemoveItem = useCallback((index: number) => {
    if (mutationLockRef.current) return;
    itemsDirtyRef.current = true;
    setEditItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // 품목 수정
  const handleItemChange = useCallback(
    (index: number, field: "name" | "price" | "quantity", value: string) => {
      if (mutationLockRef.current) return;
      itemsDirtyRef.current = true;
      setEditItems((prev) => {
        const updated = [...prev];
        if (field === "name") {
          updated[index] = { ...updated[index], name: value };
        } else {
          updated[index] = {
            ...updated[index],
            [field]: parseInt(value, 10) || 0,
          };
        }
        return updated;
      });
    },
    []
  );

  // 품목 저장
  const handleSaveItems = useCallback(async (showSuccessToast = true) => {
    if (!settlement) return;
    const validItems = editItems.filter((i) => i.name.trim() && i.price > 0);
    if (validItems.length === 0) {
      toast.error(settlementTexts.minItemRequired);
      return false;
    }
    if (receiptMismatch && receiptTotal !== null && !confirm(settlementTexts.receiptMismatchConfirm
      .replaceAll("{recognizedTotal}", formatMoney(savedItemsTotal))
      .replace("{receiptTotal}", formatMoney(receiptTotal)))) return false;
    const version = beginMutation();
    if (version === null) return false;
    try {
      const result = await clientFetch<Settlement>(
        `/settlements/${settlement.id}/items`,
        {
          method: "PATCH",
          body: { items: validItems },
        }
      );
      if (!isCurrent(version)) return false;
      setReceiptTotal(null);
      itemsDirtyRef.current = false;
      applySnapshot(result);
      if (showSuccessToast) {
        toast.success(settlementTexts.itemsSaved);
      }
      return true;
    } catch (err) {
      if (isCurrent(version)) toast.error(err instanceof Error ? err.message : settlementTexts.itemsSaveFail);
      return false;
    } finally {
      endMutation(version);
    }
  }, [settlement, editItems, settlementTexts, receiptMismatch, receiptTotal, savedItemsTotal, formatMoney, beginMutation, endMutation, isCurrent, applySnapshot]);

  // 정산 시작하기 (DRAFT → SELECTING)
  const handleStartSelecting = useCallback(async () => {
    if (!settlement || startSelectingLockRef.current) return;
    const version = beginMutation();
    if (version === null) return;
    startSelectingLockRef.current = true;
    try {
      const result = await clientFetch<Settlement>(
        `/settlements/${settlement.id}/start`,
        {
          method: "PATCH",
          body: { resumedFromEdit: resumedFromEditRef.current },
        }
      );
      if (!isCurrent(version)) return;
      applySnapshot(result);
      toast.success(settlementTexts.settlementStarted);
      resumedFromEditRef.current = false;
    } catch (err) {
      if (isCurrent(version)) toast.error(err instanceof Error ? err.message : settlementTexts.settlementStartFail);
    } finally {
      endMutation(version);
      startSelectingLockRef.current = false;
    }
  }, [settlement, settlementTexts, beginMutation, endMutation, isCurrent, applySnapshot]);

  // 수정하기 (SELECTING → DRAFT 되돌리기)
  const handleRevertToDraft = useCallback(async () => {
    if (!settlement || revertLockRef.current) return;
    if (selectionDirtyRef.current) {
      toast.error(copy.saveFirst);
      return;
    }
    const version = beginMutation();
    if (version === null) return;
    revertLockRef.current = true;
    try {
      const result = await clientFetch<Settlement>(
        `/settlements/${settlement.id}/revert`,
        { method: "PATCH" }
      );
      if (!isCurrent(version)) return;
      itemsDirtyRef.current = false;
      applySnapshot(result);
      resumedFromEditRef.current = true;
      toast.success(settlementTexts.revertedToDraft);
    } catch (err) {
      if (isCurrent(version)) toast.error(err instanceof Error ? err.message : settlementTexts.revertFail);
    } finally {
      endMutation(version);
      revertLockRef.current = false;
    }
  }, [settlement, settlementTexts, copy.saveFirst, beginMutation, endMutation, isCurrent, applySnapshot]);

  const handleSaveAndStart = useCallback(async () => {
    if (startFlowLockRef.current) return;
    startFlowLockRef.current = true;
    try {
      const saved = await handleSaveItems(false);
      if (!saved) return;
      await handleStartSelecting();
    } finally {
      startFlowLockRef.current = false;
    }
  }, [handleSaveItems, handleStartSelecting]);

  // 방장과 참여자 모두 본인 품목 선택/해제
  const handleToggleItem = useCallback((itemId: number) => {
    if (mutationLockRef.current) return;
    const next = selectedItemIds.includes(itemId)
      ? selectedItemIds.filter(id => id !== itemId)
      : [...selectedItemIds, itemId];
    selectionRef.current = next;
    selectionDirtyRef.current = !sameSelection(next, selectionIds(settlement, currentUser.id));
    setSelectedItemIds(next);
  }, [selectedItemIds, settlement, currentUser.id]);

  // 본인 선택 저장 (빈 배열은 기존 선택 전체 해제)
  const handleSubmitSelection = useCallback(async () => {
    if (!settlement) return;
    const version = beginMutation();
    if (version === null) return;
    try {
      const result = await clientFetch<Settlement>(
        `/settlements/${settlement.id}/select`,
        {
          method: "PATCH",
          body: { itemIds: selectedItemIds },
        }
      );
      if (!isCurrent(version)) return;
      selectionDirtyRef.current = false;
      applySnapshot(result);
      toast.success(settlementTexts.selectionSaved);
    } catch (err) {
      if (isCurrent(version)) toast.error(err instanceof Error ? err.message : settlementTexts.selectionSaveFail);
    } finally {
      endMutation(version);
    }
  }, [settlement, selectedItemIds, settlementTexts, beginMutation, endMutation, isCurrent, applySnapshot]);

  // 호스트: 최종 확정
  const handleConfirm = useCallback(async () => {
    if (!settlement || settlement.status !== "SELECTING" || settlement.items.length === 0) return;
    if (!sameSelection(selectedItemIds, selectionIds(settlement, currentUser.id)) || settlement.items.some(item => !item.members?.length)) return;
    if (!confirm(settlementTexts.confirmPrompt)) return;
    const version = beginMutation();
    if (version === null) return;
    try {
      const result = await clientFetch<Settlement>(
        `/settlements/${settlement.id}/confirm`,
        { method: "PATCH" }
      );
      if (!isCurrent(version)) return;
      applySnapshot(result);
      toast.success(settlementTexts.settlementConfirmed);
      try {
        await loadSnapshot(version);
      } catch {
        if (isCurrent(version)) toast.error(copy.refreshFailed);
      }
    } catch (err) {
      if (isCurrent(version)) toast.error(err instanceof Error ? err.message : settlementTexts.confirmFail);
    } finally {
      endMutation(version);
    }
  }, [settlement, selectedItemIds, currentUser.id, settlementTexts, copy.refreshFailed, beginMutation, endMutation, isCurrent, applySnapshot, loadSnapshot]);

  // 호스트: 입금 확인
  const handlePaymentConfirm = useCallback(
    async (userId: number) => {
      if (!settlement) return;
      const version = beginMutation();
      if (version === null) return;
      try {
        const payment = await clientFetch<Payment>(`/settlements/${settlement.id}/payment`, {
          method: "PATCH",
          body: { userId, status: "PAID" },
        });
        if (!isCurrent(version)) return;
        setPayments((prev) =>
          prev.map((p) => (p.userId === userId ? { ...p, ...payment } : p))
        );
        toast.success(settlementTexts.paymentConfirmed);
        try {
          await loadSnapshot(version);
        } catch {
          if (isCurrent(version)) toast.error(copy.refreshFailed);
        }
      } catch (err) {
        if (isCurrent(version)) toast.error(err instanceof Error ? err.message : settlementTexts.paymentConfirmFail);
      } finally {
        endMutation(version);
      }
    },
    [settlement, settlementTexts, copy.refreshFailed, beginMutation, endMutation, isCurrent, loadSnapshot]
  );

  // 영수증 업로드 핸들러 (OCR 결과 자동 반영)
  const handleReceiptUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file || receiptUploadLockRef.current) return;
      const version = beginMutation();
      if (version === null) return;
      receiptUploadLockRef.current = true;
      setReceiptFeedback(null);

      const formData = new FormData();
      formData.append("receipt", file);

      setScanLoading(true);
      try {
        // 정산이 아직 없으면 먼저 생성
        let currentSettlement = settlement;
        if (!currentSettlement) {
          currentSettlement = await clientFetch<Settlement>("/settlements", {
            method: "POST",
            body: { partyId },
          });
          if (!isCurrent(version)) return;
          applySnapshot(currentSettlement);
        }

        const result = await clientFetch<{
          message: string;
          storeName: string | null;
          items: { name: string; price: number; quantity: number }[];
          totalPrice: number | null;
          currency?: string;
        }>("/settlements/upload-receipt", {
          method: "POST",
          body: formData,
        });

        if (!isCurrent(version)) return;

        if (result.currency && result.currency !== "KRW") {
          setReceiptFeedback(settlementTexts.receiptCurrencyUnsupported);
          toast.error(settlementTexts.receiptCurrencyUnsupported);
          return;
        }

        if (result.items && result.items.length > 0) {
          itemsDirtyRef.current = true;
          setEditItems(result.items);
          const recognizedTotal = result.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
          const nextReceiptTotal = typeof result.totalPrice === "number" && Number.isSafeInteger(result.totalPrice) && result.totalPrice > 0
            ? result.totalPrice : null;
          setReceiptTotal(nextReceiptTotal);
          const mismatch = nextReceiptTotal !== null && recognizedTotal !== nextReceiptTotal;
          const feedback = mismatch
            ? settlementTexts.receiptTotalMismatch.replace("{recognizedTotal}", formatMoney(recognizedTotal)).replace("{receiptTotal}", formatMoney(nextReceiptTotal))
            : settlementTexts.receiptReview;
          setReceiptFeedback(settlementTexts.receiptReview);
          if (mismatch) toast(feedback);
          else toast.success(settlementTexts.receiptRecognized.replace("{count}", String(result.items.length)));
        } else {
          setReceiptFeedback(settlementTexts.receiptNoItems);
          toast.error(settlementTexts.receiptNoItems);
        }
      } catch (err) {
        if (!isCurrent(version)) return;
        const message = err && typeof err === "object" && "code" in err && err.code === "OCR_CURRENCY_UNSUPPORTED"
          ? settlementTexts.receiptCurrencyUnsupported
          : err instanceof Error ? err.message : settlementTexts.uploadFail;
        setReceiptFeedback(message);
        toast.error(message);
      } finally {
        if (isCurrent(version)) setScanLoading(false);
        endMutation(version);
        receiptUploadLockRef.current = false;
      }
    },
    [settlement, partyId, settlementTexts, formatMoney, beginMutation, endMutation, isCurrent, applySnapshot]
  );

  // 총 가격 계산
  const totalPrice = editItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const hasSelectionChanges = !sameSelection(selectedItemIds, selectionIds(settlement, currentUser.id));
  const missingItemCount = settlement?.items.filter(item => !item.members?.length).length || 0;
  const effectiveItems = settlement?.items.map(item => ({
    ...item,
    members: [
      ...(item.members || []).filter(member => member.userId !== currentUser.id),
      ...(selectedItemIds.includes(item.id) ? [{ userId: currentUser.id }] : []),
    ],
  })) || [];
  const estimatedAmount = getSettlementAmounts(effectiveItems)[currentUser.id] || 0;
  const savedAmounts = getSettlementAmounts(settlement?.items || []);
  const allocationDataComplete = Boolean(settlement?.items.length && settlement.items.every(item => item.members?.length)
    && Object.values(savedAmounts).reduce((sum, amount) => sum + amount, 0) === settlement.totalAmount);
  const hostId = partyData?.hostId ?? settlement?.hostId;
  const expectedGuestIds = Object.keys(savedAmounts).map(Number).filter(id => id !== hostId);
  const paymentDataComplete = expectedGuestIds.every(id => payments.some(payment => payment.userId === id))
    && new Set(payments.map(payment => payment.userId)).size === payments.length
    && payments.every(payment => expectedGuestIds.includes(payment.userId) && Number.isSafeInteger(payment.amount) && payment.amount >= 0);
  const guestTotal = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const hostAmount = settlement && allocationDataComplete && paymentDataComplete && Number.isSafeInteger(settlement.totalAmount)
    && Number.isSafeInteger(guestTotal) && guestTotal >= 0 && guestTotal <= settlement.totalAmount
    ? settlement.totalAmount - guestTotal : null;
  const myPayment = payments.find(payment => payment.userId === currentUser.id);
  const myAmount = isHost ? hostAmount
    : myPayment && Number.isSafeInteger(myPayment.amount) && myPayment.amount >= 0 ? myPayment.amount
      : allocationDataComplete && (savedAmounts[currentUser.id] || 0) === 0 ? 0 : null;
  const needsAccountInfo = Boolean(isHost && settlement && !currentUser.accountNumber);
  const paymentName = (payment: Payment) => payment.user?.nickname
    || members.find(member => member.id === payment.userId)?.nickname || texts.chat.unknownNickname;

  return (
    <div
      hidden={!sessionActive}
      className={`max-w-2xl mx-auto px-4 py-6 sm:px-6 sm:py-8 transition-all duration-200 ${
        isPageReady ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
      }`}
    >
      {/* 제목 */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-black text-gray-900">{texts.chat.settle}</h1>
        <button
          onClick={() => router.push(`/chat/${partyId}`)}
          className="min-h-11 px-4 py-2 rounded-full text-sm font-bold text-[#33612E] border border-[#33612E] hover:bg-[#33612E]/5 transition-all"
        >
          {settlementTexts.chatRoom}
        </button>
      </div>

      {/* 모임 정보 */}
      {partyData && (
        <div className="border-b border-gray-100 pb-6 mb-6">
          <h2 className="break-words text-lg font-bold text-gray-900">{partyData.title}</h2>
          <p className="break-words text-sm text-gray-500 mt-1">
            {formatFullDate(partyData.meetDate)} | {partyData.storeName}
          </p>
        </div>
      )}

      {needsAccountInfo && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
          <p className="text-sm font-bold text-amber-900">
            {lang === Language.japanese
              ? "割り勘の代金を受け取る口座をプロフィールに登録してください。"
              : "정산금을 받을 계좌를 프로필에 등록해주세요."}
          </p>
          <button
            type="button"
            onClick={() => router.push(`/user/${currentUser.id}?error=accountNumber`)}
            className="mt-3 min-h-11 rounded-full bg-amber-900 px-4 py-2 text-sm font-black text-white transition-colors hover:bg-amber-800"
          >
            {lang === Language.japanese ? "プロフィールで入力する" : "프로필에서 입력하기"}
          </button>
        </div>
      )}

      {isHost && (!settlement || settlement.status === "DRAFT") && (
        <div className="mb-6 rounded-2xl border border-gray-200 p-4" aria-busy={scanLoading}>
          <h3 className="mb-3 text-sm font-bold text-gray-800">{settlementTexts.uploadReceipt}</h3>
          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleReceiptUpload} />
          <input ref={albumInputRef} type="file" accept="image/*" className="hidden" onChange={handleReceiptUpload} />
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => cameraInputRef.current?.click()} disabled={loading} className="min-h-11 rounded-xl bg-gray-900 px-3 py-2 text-sm font-bold text-white hover:bg-gray-800 disabled:opacity-50">
              {settlementTexts.takePhoto}
            </button>
            <button type="button" onClick={() => albumInputRef.current?.click()} disabled={loading} className="min-h-11 rounded-xl border border-gray-300 px-3 py-2 text-sm font-bold text-gray-800 hover:bg-gray-50 disabled:opacity-50">
              {settlementTexts.choosePhoto}
            </button>
          </div>
          {scanLoading && (
            <div role="status" className="mt-4 flex items-center gap-3 text-sm text-gray-700">
              <div className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-[#33612E] border-t-transparent" />
              <p>{settlementTexts.receiptScanning} {settlementTexts.pleaseWait}</p>
            </div>
          )}
          {visibleReceiptFeedback && <p role="status" className="mt-3 break-words text-sm text-gray-700">{visibleReceiptFeedback}</p>}
        </div>
      )}

      {/* === 정산 미생성 상태 (호스트만 생성 가능) === */}
      {!settlement && isHost && (
        <div className="text-center mb-6">
          <button
            onClick={handleCreateSettlement}
            className="min-h-11 px-4 text-sm text-gray-600 underline hover:text-gray-800 transition-colors disabled:opacity-50"
            disabled={loading}
          >
            {texts.settlement.writeManually}
          </button>
        </div>
      )}

      {/* 정산 미생성 상태 (게스트) */}
      {!settlement && !isHost && (
        <div className="text-center py-16 text-gray-400">
          {texts.settlement.notStarted}
        </div>
      )}

      {/* === DRAFT: 호스트가 품목 편집 === */}
      {settlement && settlement.status === "DRAFT" && isHost && (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <h3 className="text-base font-bold text-gray-900">{texts.settlement.purchaseItems}</h3>
            <button
              onClick={handleAddItem}
              disabled={loading}
              className="min-h-11 px-2 text-sm text-[#33612E] font-bold hover:underline disabled:opacity-50"
            >
              {texts.settlement.addItem}
            </button>
          </div>

          <div className="space-y-3">
            {editItems.map((item, index) => (
              <div
                key={index}
                className="relative grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-xl sm:grid-cols-[minmax(0,1fr)_72px_112px_44px]"
              >
                <label className="col-span-2 min-w-0 pr-12 sm:col-span-1 sm:pr-0">
                  <span className="mb-1 block text-xs font-medium text-gray-600">{texts.settlement.itemName}</span>
                  <input
                    type="text"
                    value={item.name}
                    disabled={loading}
                    onChange={(e) => handleItemChange(index, "name", e.target.value)}
                    placeholder={texts.settlement.itemName}
                    className="min-w-0 w-full min-h-11 bg-white border border-gray-200 rounded-lg px-3 py-2 text-base sm:text-sm outline-none focus:border-[#33612E]"
                  />
                </label>
                <label className="min-w-0">
                  <span className="mb-1 block text-xs font-medium text-gray-600">{texts.settlement.quantity}</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={item.quantity || ""}
                    disabled={loading}
                    onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                    placeholder={texts.settlement.quantity}
                    className="min-w-0 w-full min-h-11 bg-white border border-gray-200 rounded-lg px-3 py-2 text-base sm:text-sm text-center outline-none focus:border-[#33612E]"
                    min={1}
                  />
                </label>
                <label className="min-w-0">
                  <span className="mb-1 block text-xs font-medium text-gray-600">{texts.settlement.price} ({isKorean ? "원" : "ウォン"})</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={item.price || ""}
                    disabled={loading}
                    onChange={(e) => handleItemChange(index, "price", e.target.value)}
                    placeholder={texts.settlement.price}
                    className="min-w-0 w-full min-h-11 bg-white border border-gray-200 rounded-lg px-3 py-2 text-base sm:text-sm text-right outline-none focus:border-[#33612E]"
                    min={0}
                  />
                </label>
                <button
                  onClick={() => handleRemoveItem(index)}
                  disabled={loading}
                  aria-label={`${settlementTexts.removeItem}: ${item.name || index + 1}`}
                  className="absolute right-3 top-8 flex h-11 w-11 items-center justify-center rounded-lg text-gray-500 hover:text-red-500 transition-colors disabled:opacity-50 sm:static sm:self-end"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {editItems.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">
              {settlementTexts.addItemHint}
            </div>
          )}

          {/* 총 가격 */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-100">
            <span className="text-base font-bold text-gray-900">{texts.settlement.totalPrice}</span>
            <span className="text-base font-bold text-gray-900">
              {formatMoney(totalPrice)}
            </span>
          </div>

          {/* 버튼 영역 */}
          <div className="flex flex-col gap-3 mt-8 sm:flex-row">
            <button
              onClick={() => {
                void handleSaveItems();
              }}
              disabled={loading || editItems.length === 0}
              className="flex-1 py-3 rounded-full font-bold text-[#33612E] border-2 border-[#33612E] hover:bg-[#33612E]/5 transition-all disabled:opacity-50"
            >
              {texts.settlement.saveItems}
            </button>
            <button
              onClick={handleSaveAndStart}
              disabled={loading || editItems.length === 0}
              className="flex-1 py-3 rounded-full font-bold text-white bg-[#33612E] hover:bg-[#2a5025] transition-all disabled:opacity-50"
            >
              {texts.settlement.startSettlement}
            </button>
          </div>
        </div>
      )}

      {/* === DRAFT: 게스트 대기 화면 === */}
      {settlement && settlement.status === "DRAFT" && !isHost && (
        <div className="text-center py-16 text-gray-400">
          {texts.settlement.waitingHost}
        </div>
      )}

      {/* === SELECTING: 방장과 참여자의 본인 품목 선택 === */}
      {settlement && settlement.status === "SELECTING" && (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <h3 className="text-base font-bold text-gray-900">{texts.settlement.purchaseItems}</h3>
            <div className="flex flex-wrap items-center gap-3">
              {isHost && <button onClick={handleRevertToDraft} disabled={loading} className="min-h-11 px-2 text-sm text-[#33612E] font-bold hover:underline">{settlementTexts.editSettlement}</button>}
              <span className="text-xs text-gray-400">{texts.settlement.selectHint}</span>
            </div>
          </div>

          <div className="space-y-2">
            {settlement.items.map((item) => {
              const isSelected = selectedItemIds.includes(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => handleToggleItem(item.id)}
                  aria-pressed={isSelected}
                  disabled={loading}
                  className={`w-full flex items-center justify-between gap-3 p-4 rounded-xl border-2 transition-all ${
                    isSelected
                      ? "border-[#33612E] bg-[#33612E]/5"
                      : "border-gray-100 hover:border-gray-200"
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-3 text-left">
                    <div
                      className={`w-5 h-5 shrink-0 rounded-md border-2 flex items-center justify-center transition-all ${
                        isSelected
                          ? "bg-[#33612E] border-[#33612E]"
                          : "border-gray-300"
                      }`}
                    >
                      {isSelected && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="break-words text-sm font-medium text-gray-800">
                        {item.name} {item.quantity > 1 ? `${item.quantity}${settlementTexts.quantitySuffix}` : ""}
                      </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {item.members?.length ? item.members.map(member => <span key={member.userId} className="max-w-full break-words text-xs font-semibold bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">{member.user?.nickname || members.find(entry => entry.id === member.userId)?.nickname || texts.chat.unknownNickname}</span>) : <span className="text-xs text-amber-700">{copy.noneSelected}</span>}
                      </div>
                    </div>
                  </div>
                  <span className="shrink-0 text-sm font-bold text-gray-700">
                    {formatMoney(item.price * item.quantity)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* 예상 금액 */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-100">
            <span className="text-base font-bold text-gray-900">{texts.settlement.myEstimate}</span>
            <span className="text-base font-bold text-[#33612E]">
              {formatMoney(estimatedAmount)}
            </span>
          </div>

          <button
            onClick={handleSubmitSelection}
            disabled={loading || !hasSelectionChanges}
            className="w-full mt-6 py-3 rounded-full font-bold text-white bg-[#33612E] hover:bg-[#2a5025] transition-all disabled:opacity-50"
          >
            {texts.settlement.submitSelection}
          </button>
          {isHost && <>
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-100">
              <span className="text-base font-bold text-gray-900">{texts.settlement.totalPrice}</span>
              <span className="text-base font-bold text-gray-900">{formatMoney(settlement.totalAmount)}</span>
            </div>
            {hasSelectionChanges && <p role="status" className="mt-3 text-sm text-amber-800">{copy.saveFirst}</p>}
            {missingItemCount > 0 && <p role="status" className="mt-3 text-sm text-amber-800">{copy.missing.replace("{count}", String(missingItemCount))}</p>}
            <button onClick={handleConfirm} disabled={loading || hasSelectionChanges || missingItemCount > 0 || settlement.items.length === 0} className="w-full mt-6 py-3 rounded-full font-bold text-white bg-[#33612E] hover:bg-[#2a5025] transition-all disabled:opacity-50">{texts.settlement.confirmSettlement}</button>
          </>}
        </div>
      )}

      {/* === CONFIRMED / COMPLETED: 정산 결과 === */}
      {settlement &&
        (settlement.status === "CONFIRMED" || settlement.status === "COMPLETED") && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900">{texts.settlement.purchaseItems}</h3>
            </div>

            <div className="space-y-2">
              {settlement.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 py-3 border-b border-gray-50"
                >
                  <span className="min-w-0 break-words text-sm text-gray-700">
                    {item.name} {item.quantity > 1 ? `${item.quantity}${settlementTexts.quantitySuffix}` : ""}
                  </span>
                  <span className="shrink-0 text-sm font-bold text-gray-900">
                    {formatMoney(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* 총 가격과 개인별 확정 금액 */}
            <div className="flex flex-col gap-2 mt-8 pt-6 border-t border-gray-100 sm:flex-row sm:justify-between sm:items-center">
              <span className="text-base font-bold text-gray-900">{texts.settlement.totalPrice}</span>
              <span className="text-base font-bold text-gray-900">
                {formatMoney(settlement.totalAmount)}
              </span>
            </div>

            <div className="flex flex-wrap justify-between gap-2 mt-3 text-sm">
              <span className="text-gray-600">{isHost ? copy.hostShare : copy.myShare}</span>
              <strong className="text-[#33612E]">{myAmount === null ? copy.amountPending : formatMoney(myAmount)}{myAmount === 0 && <span className="ml-2 text-xs font-medium text-gray-500">{copy.noTransfer}</span>}</strong>
            </div>

            {isHost && settlement.status === "CONFIRMED" && hostAmount !== null && payments.length > 0 && <SettlementAccountActions
              account={currentUser}
              payments={payments.map(payment => ({ userId: payment.userId, amount: payment.amount, status: payment.status, nickname: paymentName(payment) }))}
              language={lang}
              connected={connectionStatus === "connected"}
              sendMessage={sendMessage}
            />}

            {/* 입금 현황 */}
            {(payments.length > 0 || isHost) && (
              <div className="mt-8">
                <h3 className="text-base font-bold text-gray-900 mb-4">{texts.settlement.paymentStatus}</h3>
                <div className="space-y-2">
                  {isHost && <div className="flex flex-col gap-3 p-3 bg-gray-50 rounded-xl sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3"><span className="min-w-0 break-words text-sm font-medium text-gray-800">{currentUser.nickname}</span><span className="text-xs text-gray-500">{copy.hostOnly}</span></div>
                    <strong className="text-sm text-gray-700">{hostAmount === null ? copy.amountPending : formatMoney(hostAmount)}</strong>
                  </div>}
                  {payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex flex-col gap-3 p-3 bg-gray-50 rounded-xl sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <img
                          src={
                            payment.user?.profileImage ||
                            "/images/gachimura_logo.png"
                          }
                          className="w-8 h-8 shrink-0 rounded-full object-contain bg-white p-0.5"
                          alt=""
                        />
                        <span className="min-w-0 break-words text-sm font-medium text-gray-800">
                          {paymentName(payment)}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
                        <span className="text-sm font-bold text-gray-700">
                          {formatMoney(payment.amount)}
                        </span>
                        {payment.status === "PAID" ? (
                          <span className="px-3 py-1 text-xs font-bold text-green-600 bg-green-50 rounded-full">
                            {payment.amount === 0 ? copy.noTransfer : texts.settlement.paid}
                          </span>
                        ) : isHost ? (
                          <button
                            onClick={() =>
                              handlePaymentConfirm(payment.userId)
                            }
                            disabled={loading}
                            aria-label={`${paymentName(payment)} ${texts.settlement.confirmPayment}`}
                            className="min-h-11 px-3 py-2 text-sm font-bold text-white bg-[#33612E] rounded-full hover:bg-[#2a5025] transition-all disabled:opacity-50"
                          >
                            {texts.settlement.confirmPayment}
                          </button>
                        ) : (
                          <span className="px-3 py-1 text-xs font-bold text-orange-600 bg-orange-50 rounded-full">
                            {texts.settlement.unpaid}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 정산 완료 메시지 */}
            {settlement.status === "COMPLETED" && (
              <div className="mt-8 text-center">
                <div className="inline-block px-6 py-3 bg-[#33612E] text-white rounded-full font-bold text-sm">
                  {texts.settlement.sentMessage}
                </div>
              </div>
            )}

            {!isHost && myAmount !== null && myAmount > 0 && <p className="mt-6 text-sm leading-relaxed text-gray-500">{copy.transferGuide}</p>}

            {/* 하단 버튼 */}
            <div className="flex flex-col gap-3 mt-8 sm:flex-row">
              <button
                onClick={() => router.push(`/chat/${partyId}`)}
                className="flex-1 py-3 rounded-full font-bold text-[#33612E] border-2 border-[#33612E] hover:bg-[#33612E]/5 transition-all"
              >
                {settlement.status === "COMPLETED" && isHost
                  ? (isKorean ? "채팅방에서 모임 종료·평가" : "チャットで集まり終了・評価")
                  : settlementTexts.chatRoom}
              </button>
            </div>
          </div>
        )}
    </div>
  );
}
