"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/app/hooks/LanguageContext";
import { clientFetch } from "@/app/hooks/useClientFetch";
import { useDateFormatter } from "@/app/hooks/useDateFormatter";
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
  currentUser: { id: number; nickname: string };
  initialPayments: Payment[];
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
  const { texts } = useLanguage();
  const { formatFullDate } = useDateFormatter();

  const [settlement, setSettlement] = useState<Settlement | null>(initialSettlement);
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [loading, setLoading] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [partyData, setPartyData] = useState<PartyInfo | null>(partyInfo);

  // 서버에서 partyInfo를 못 가져왔으면 클라이언트에서 재시도
  React.useEffect(() => {
    if (!partyData && partyId) {
      clientFetch(`/parties/${partyId}`)
        .then((data: any) => {
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
  }, [partyData, partyId]);

  // 직접 작성 모드용 상태
  const [editItems, setEditItems] = useState<
    { name: string; price: number; quantity: number }[]
  >(
    initialSettlement?.items?.map((i) => ({
      name: i.name,
      price: i.price,
      quantity: i.quantity,
    })) || []
  );

  // 게스트 선택 모드용 상태
  const [selectedItemIds, setSelectedItemIds] = useState<number[]>(() => {
    if (!initialSettlement?.items) return [];
    return initialSettlement.items
      .filter((item) =>
        item.members?.some((m) => m.userId === currentUser.id)
      )
      .map((item) => item.id);
  });

  const isHost = partyData?.hostId === currentUser.id;
  const memberCount = members.length;

  // 정산 생성
  const handleCreateSettlement = useCallback(async () => {
    setLoading(true);
    try {
      const result = await clientFetch<Settlement>("/settlements", {
        method: "POST",
        body: { partyId },
      });
      setSettlement(result);
      toast.success("정산이 생성되었습니다.");
    } catch (err: any) {
      toast.error(err.message || "정산 생성 실패");
    } finally {
      setLoading(false);
    }
  }, [partyId]);

  // 품목 추가
  const handleAddItem = useCallback(() => {
    setEditItems((prev) => [...prev, { name: "", price: 0, quantity: 1 }]);
  }, []);

  // 품목 삭제
  const handleRemoveItem = useCallback((index: number) => {
    setEditItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // 품목 수정
  const handleItemChange = useCallback(
    (index: number, field: "name" | "price" | "quantity", value: string) => {
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
  const handleSaveItems = useCallback(async () => {
    if (!settlement) return;
    const validItems = editItems.filter((i) => i.name.trim() && i.price > 0);
    if (validItems.length === 0) {
      toast.error("최소 1개 이상의 품목을 입력해주세요.");
      return;
    }
    setLoading(true);
    try {
      const result = await clientFetch<Settlement>(
        `/settlements/${settlement.id}/items`,
        {
          method: "PATCH",
          body: { items: validItems },
        }
      );
      setSettlement(result);
      toast.success("품목이 저장되었습니다.");
    } catch (err: any) {
      toast.error(err.message || "품목 저장 실패");
    } finally {
      setLoading(false);
    }
  }, [settlement, editItems]);

  // 정산 시작하기 (DRAFT → SELECTING)
  const handleStartSelecting = useCallback(async () => {
    if (!settlement) return;
    setLoading(true);
    try {
      const result = await clientFetch<Settlement>(
        `/settlements/${settlement.id}/start`,
        { method: "PATCH" }
      );
      setSettlement(result);
      toast.success("정산이 시작되었습니다! 멤버들에게 알림이 전송되었습니다.");
    } catch (err: any) {
      toast.error(err.message || "정산 시작 실패");
    } finally {
      setLoading(false);
    }
  }, [settlement]);

  // 수정하기 (SELECTING → DRAFT 되돌리기)
  const handleRevertToDraft = useCallback(async () => {
    if (!settlement) return;
    setLoading(true);
    try {
      const result = await clientFetch<Settlement>(
        `/settlements/${settlement.id}/revert`,
        { method: "PATCH" }
      );
      setSettlement(result);
      // editItems를 현재 items로 다시 설정
      setEditItems(
        result.items?.map((i) => ({
          name: i.name,
          price: i.price,
          quantity: i.quantity,
        })) || []
      );
      toast.success("수정 모드로 전환되었습니다.");
    } catch (err: any) {
      toast.error(err.message || "수정 전환 실패");
    } finally {
      setLoading(false);
    }
  }, [settlement]);

  // 게스트: 품목 선택/해제
  const handleToggleItem = useCallback((itemId: number) => {
    setSelectedItemIds((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  }, []);

  // 게스트: 선택 완료
  const handleSubmitSelection = useCallback(async () => {
    if (!settlement) return;
    setLoading(true);
    try {
      const result = await clientFetch<Settlement>(
        `/settlements/${settlement.id}/select`,
        {
          method: "PATCH",
          body: { itemIds: selectedItemIds },
        }
      );
      setSettlement(result);
      toast.success("품목 선택이 완료되었습니다!");
    } catch (err: any) {
      toast.error(err.message || "선택 저장 실패");
    } finally {
      setLoading(false);
    }
  }, [settlement, selectedItemIds]);

  // 호스트: 최종 확정
  const handleConfirm = useCallback(async () => {
    if (!settlement) return;
    if (!confirm("정산을 확정하시겠습니까? 확정 후에는 변경할 수 없습니다.")) return;
    setLoading(true);
    try {
      const result = await clientFetch<Settlement>(
        `/settlements/${settlement.id}/confirm`,
        { method: "PATCH" }
      );
      setSettlement(result);
      // 결제 현황 갱신
      const paymentData = await clientFetch<Payment[]>(
        `/settlements/${settlement.id}/payments`
      );
      setPayments(paymentData);
      toast.success("정산이 확정되었습니다!");
    } catch (err: any) {
      toast.error(err.message || "확정 실패");
    } finally {
      setLoading(false);
    }
  }, [settlement]);

  // 호스트: 입금 확인
  const handlePaymentConfirm = useCallback(
    async (userId: number) => {
      if (!settlement) return;
      setLoading(true);
      try {
        await clientFetch(`/settlements/${settlement.id}/payment`, {
          method: "PATCH",
          body: { userId, status: "PAID" },
        });
        setPayments((prev) =>
          prev.map((p) => (p.userId === userId ? { ...p, status: "PAID" } : p))
        );
        toast.success("입금이 확인되었습니다.");
      } catch (err: any) {
        toast.error(err.message || "입금 확인 실패");
      } finally {
        setLoading(false);
      }
    },
    [settlement]
  );

  // 영수증 업로드 핸들러 (OCR 결과 자동 반영)
  const handleReceiptUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const formData = new FormData();
      formData.append("receipt", file);

      setScanLoading(true);
      setLoading(true);
      try {
        // 정산이 아직 없으면 먼저 생성
        let currentSettlement = settlement;
        if (!currentSettlement) {
          currentSettlement = await clientFetch<Settlement>("/settlements", {
            method: "POST",
            body: { partyId },
          });
          setSettlement(currentSettlement);
        }

        const result = await clientFetch<{
          message: string;
          storeName: string | null;
          items: { name: string; price: number; quantity: number }[];
          totalPrice: number | null;
        }>("/settlements/upload-receipt", {
          method: "POST",
          body: formData,
        });

        if (result.items && result.items.length > 0) {
          setEditItems(result.items);
          toast.success(
            `영수증 인식 완료! ${result.items.length}개 품목이 자동 입력되었습니다.`
          );
        } else {
          toast.success("영수증이 업로드되었습니다. 품목을 직접 입력해주세요.");
        }
      } catch (err: any) {
        toast.error(err.message || "업로드 실패");
      } finally {
        setScanLoading(false);
        setLoading(false);
      }
    },
    [settlement, partyId]
  );

  // 카카오톡 정산 메시지 공유
  const handleKakaoShare = useCallback(() => {
    const Kakao = (window as any).Kakao;
    if (!Kakao) {
      toast.error("카카오 SDK를 불러올 수 없습니다.");
      return;
    }

    // SDK 초기화 (이미 되어있으면 스킵)
    if (!Kakao.isInitialized()) {
      const jsKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
      if (!jsKey) {
        toast.error(
          "카카오 JavaScript 키가 설정되지 않았습니다. .env.local에 NEXT_PUBLIC_KAKAO_JS_KEY를 설정해주세요."
        );
        return;
      }
      Kakao.init(jsKey);
    }

    // 정산 내역 텍스트 구성
    const perPerson = memberCount > 0 ? Math.ceil((settlement?.totalAmount || 0) / memberCount) : 0;
    const pendingPayments = payments.filter((p) => p.status === "PENDING");
    const paymentLines = pendingPayments
      .map((p) => `${p.user?.nickname}: ${p.amount.toLocaleString()}원`)
      .join("\n");

    const description = paymentLines
      ? `1인당 ${perPerson.toLocaleString()}원\n\n${paymentLines}`
      : `1인당 ${perPerson.toLocaleString()}원`;

    try {
      Kakao.Share.sendDefault({
        objectType: "feed",
        content: {
          title: `[가치무라 정산] ${partyData?.title || "모임"}`,
          description: `총 ${(settlement?.totalAmount || 0).toLocaleString()}원 / ${memberCount}명\n${description}`,
          imageUrl: `${window.location.origin}/images/gachimura_logo.png`,
          link: {
            mobileWebUrl: `${window.location.origin}/settlement/${partyId}`,
            webUrl: `${window.location.origin}/settlement/${partyId}`,
          },
        },
        buttons: [
          {
            title: "정산 확인하기",
            link: {
              mobileWebUrl: `${window.location.origin}/settlement/${partyId}`,
              webUrl: `${window.location.origin}/settlement/${partyId}`,
            },
          },
        ],
      });
    } catch {
      toast.error("카카오톡 공유에 실패했습니다.");
    }
  }, [settlement, payments, partyData, partyId, memberCount]);

  // 총 가격 계산
  const totalPrice = editItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // 게스트 선택 시 예상 금액 계산
  const estimatedAmount = settlement?.items
    ?.filter((item) => selectedItemIds.includes(item.id))
    .reduce((sum, item) => {
      const memberCount = item.members?.length || 1;
      return sum + Math.ceil((item.price * item.quantity) / Math.max(memberCount, 1));
    }, 0) || 0;

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      {/* 제목 */}
      <h1 className="text-2xl font-black text-gray-900 text-center mb-6">
        {texts.chat.settle}
      </h1>

      {/* 모임 정보 */}
      {partyData && (
        <div className="border-b border-gray-100 pb-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900">{partyData.title}</h2>
          <p className="text-sm text-gray-500 mt-1">
            {formatFullDate(partyData.meetDate)} | {partyData.storeName}
          </p>
        </div>
      )}

      {/* === 정산 미생성 상태 (호스트만 생성 가능) === */}
      {!settlement && isHost && (
        <div className="text-center py-16">
          {scanLoading ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-4 border-[#33612E] border-t-transparent rounded-full animate-spin" />
              <p className="text-base font-bold text-gray-700">영수증 스캔중...</p>
              <p className="text-sm text-gray-400">잠시만 기다려주세요</p>
            </div>
          ) : (
            <>
              <label className="inline-flex items-center gap-2 px-8 py-3 bg-gray-900 text-white rounded-full font-bold cursor-pointer hover:bg-gray-800 transition-all">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                영수증 업로드하기
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleReceiptUpload}
                />
              </label>
              <button
                onClick={handleCreateSettlement}
                className="block mx-auto mt-4 text-sm text-gray-500 underline hover:text-gray-700 transition-colors"
                disabled={loading}
              >
                직접 작성하기
              </button>
            </>
          )}
        </div>
      )}

      {/* 정산 미생성 상태 (게스트) */}
      {!settlement && !isHost && (
        <div className="text-center py-16 text-gray-400">
          아직 정산이 시작되지 않았습니다.
        </div>
      )}

      {/* === DRAFT: 호스트가 품목 편집 === */}
      {settlement && settlement.status === "DRAFT" && isHost && (
        <div>
          {scanLoading && (
            <div className="flex flex-col items-center gap-3 py-8 mb-4">
              <div className="w-10 h-10 border-4 border-[#33612E] border-t-transparent rounded-full animate-spin" />
              <p className="text-base font-bold text-gray-700">영수증 스캔중...</p>
            </div>
          )}

          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-gray-900">구매품목</h3>
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-400 cursor-pointer hover:text-gray-600">
                📷 영수증 스캔
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleReceiptUpload}
                />
              </label>
              <button
                onClick={handleAddItem}
                className="text-sm text-[#33612E] font-bold hover:underline"
              >
                + 품목 추가
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {editItems.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
              >
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) =>
                    handleItemChange(index, "name", e.target.value)
                  }
                  placeholder="품목명"
                  className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#33612E]"
                />
                <input
                  type="number"
                  value={item.quantity || ""}
                  onChange={(e) =>
                    handleItemChange(index, "quantity", e.target.value)
                  }
                  placeholder="수량"
                  className="w-16 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-center outline-none focus:border-[#33612E]"
                  min={1}
                />
                <input
                  type="number"
                  value={item.price || ""}
                  onChange={(e) =>
                    handleItemChange(index, "price", e.target.value)
                  }
                  placeholder="가격"
                  className="w-24 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-right outline-none focus:border-[#33612E]"
                  min={0}
                />
                <span className="text-sm text-gray-500">원</span>
                <button
                  onClick={() => handleRemoveItem(index)}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
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
              품목을 추가해주세요.
            </div>
          )}

          {/* 총 가격 */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-100">
            <span className="text-base font-bold text-gray-900">총 가격</span>
            <span className="text-base font-bold text-gray-900">
              {totalPrice.toLocaleString()}원
            </span>
          </div>

          {/* 버튼 영역 */}
          <div className="flex gap-3 mt-8">
            <button
              onClick={handleSaveItems}
              disabled={loading || editItems.length === 0}
              className="flex-1 py-3 rounded-full font-bold text-[#33612E] border-2 border-[#33612E] hover:bg-[#33612E]/5 transition-all disabled:opacity-50"
            >
              품목 저장
            </button>
            <button
              onClick={async () => {
                await handleSaveItems();
                await handleStartSelecting();
              }}
              disabled={loading || editItems.length === 0}
              className="flex-1 py-3 rounded-full font-bold text-white bg-[#33612E] hover:bg-[#2a5025] transition-all disabled:opacity-50"
            >
              정산 시작하기
            </button>
          </div>
        </div>
      )}

      {/* === DRAFT: 게스트 대기 화면 === */}
      {settlement && settlement.status === "DRAFT" && !isHost && (
        <div className="text-center py-16 text-gray-400">
          호스트가 품목을 등록하고 있습니다...
        </div>
      )}

      {/* === SELECTING: 게스트가 품목 선택 === */}
      {settlement && settlement.status === "SELECTING" && !isHost && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-gray-900">구매품목</h3>
            <span className="text-xs text-gray-400">본인이 가져갈 품목을 선택하세요</span>
          </div>

          <div className="space-y-2">
            {settlement.items.map((item) => {
              const isSelected = selectedItemIds.includes(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => handleToggleItem(item.id)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                    isSelected
                      ? "border-[#33612E] bg-[#33612E]/5"
                      : "border-gray-100 hover:border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
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
                    <span className="text-sm font-medium text-gray-800">
                      {item.name} {item.quantity > 1 ? `${item.quantity}개` : ""}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-gray-700">
                    {(item.price * item.quantity).toLocaleString()}원
                  </span>
                </button>
              );
            })}
          </div>

          {/* 예상 금액 */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-100">
            <span className="text-base font-bold text-gray-900">
              나의 예상 금액
            </span>
            <span className="text-base font-bold text-[#33612E]">
              {estimatedAmount.toLocaleString()}원
            </span>
          </div>

          <button
            onClick={handleSubmitSelection}
            disabled={loading || selectedItemIds.length === 0}
            className="w-full mt-6 py-3 rounded-full font-bold text-white bg-[#33612E] hover:bg-[#2a5025] transition-all disabled:opacity-50"
          >
            선택 완료
          </button>
        </div>
      )}

      {/* === SELECTING: 호스트 뷰 (멤버 선택 현황 + 수정/확정 버튼) === */}
      {settlement && settlement.status === "SELECTING" && isHost && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-gray-900">구매품목</h3>
            <div className="flex items-center gap-3">
              <button
                onClick={handleRevertToDraft}
                disabled={loading}
                className="text-xs text-[#33612E] font-bold hover:underline"
              >
                수정하기
              </button>
              <span className="text-xs text-gray-400">멤버들이 선택 중...</span>
            </div>
          </div>

          <div className="space-y-2">
            {settlement.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 rounded-xl border border-gray-100"
              >
                <div>
                  <span className="text-sm font-medium text-gray-800">
                    {item.name} {item.quantity > 1 ? `${item.quantity}개` : ""}
                  </span>
                  <div className="flex gap-1 mt-1">
                    {item.members?.map((m) => (
                      <span
                        key={m.userId}
                        className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full"
                      >
                        {m.user?.nickname}
                      </span>
                    ))}
                  </div>
                </div>
                <span className="text-sm font-bold text-gray-700">
                  {(item.price * item.quantity).toLocaleString()}원
                </span>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-100">
            <span className="text-base font-bold text-gray-900">총 가격</span>
            <span className="text-base font-bold text-gray-900">
              {settlement.totalAmount.toLocaleString()}원 / {memberCount}명
            </span>
          </div>

          <button
            onClick={handleConfirm}
            disabled={loading}
            className="w-full mt-6 py-3 rounded-full font-bold text-white bg-[#33612E] hover:bg-[#2a5025] transition-all disabled:opacity-50"
          >
            정산 확정하기
          </button>
        </div>
      )}

      {/* === CONFIRMED / COMPLETED: 정산 결과 === */}
      {settlement &&
        (settlement.status === "CONFIRMED" || settlement.status === "COMPLETED") && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900">구매품목</h3>
            </div>

            <div className="space-y-2">
              {settlement.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-3 border-b border-gray-50"
                >
                  <span className="text-sm text-gray-700">
                    {item.name} {item.quantity > 1 ? `${item.quantity}개` : ""}
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    {(item.price * item.quantity).toLocaleString()}원
                  </span>
                </div>
              ))}
            </div>

            {/* 총 가격 & 1인당 금액 */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-100">
              <span className="text-base font-bold text-gray-900">총 가격</span>
              <span className="text-base font-bold text-gray-900">
                {settlement.totalAmount.toLocaleString()}원 / {memberCount}명 = 1인 당{" "}
                {memberCount > 0
                  ? Math.ceil(settlement.totalAmount / memberCount).toLocaleString()
                  : 0}
                원
              </span>
            </div>

            {/* 입금 현황 */}
            {payments.length > 0 && (
              <div className="mt-8">
                <h3 className="text-base font-bold text-gray-900 mb-4">
                  입금 현황
                </h3>
                <div className="space-y-2">
                  {payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            payment.user?.profileImage ||
                            "/images/gachimura_logo.png"
                          }
                          className="w-8 h-8 rounded-full object-contain bg-white p-0.5"
                          alt=""
                        />
                        <span className="text-sm font-medium text-gray-800">
                          {payment.user?.nickname}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-gray-700">
                          {payment.amount.toLocaleString()}원
                        </span>
                        {payment.status === "PAID" ? (
                          <span className="px-3 py-1 text-xs font-bold text-green-600 bg-green-50 rounded-full">
                            완료
                          </span>
                        ) : isHost ? (
                          <button
                            onClick={() =>
                              handlePaymentConfirm(payment.userId)
                            }
                            disabled={loading}
                            className="px-3 py-1 text-xs font-bold text-white bg-[#33612E] rounded-full hover:bg-[#2a5025] transition-all disabled:opacity-50"
                          >
                            입금 확인
                          </button>
                        ) : (
                          <span className="px-3 py-1 text-xs font-bold text-orange-600 bg-orange-50 rounded-full">
                            미입금
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
                  정산 메세지를 전송했어요!
                </div>
              </div>
            )}

            {/* 하단 버튼 */}
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => router.push(`/chat/${partyId}`)}
                className="flex-1 py-3 rounded-full font-bold text-[#33612E] border-2 border-[#33612E] hover:bg-[#33612E]/5 transition-all"
              >
                채팅방으로
              </button>
              <button
                className="flex-1 py-3 rounded-full font-bold text-white bg-[#F7C948] hover:bg-[#F0B429] transition-all"
                onClick={handleKakaoShare}
              >
                카카오톡 정산하기
              </button>
            </div>
          </div>
        )}
    </div>
  );
}
