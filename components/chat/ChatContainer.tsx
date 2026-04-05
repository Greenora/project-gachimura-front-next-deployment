"use client";

import React, { useState, useRef, useEffect, useMemo, memo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useChat, ChatPayload } from "@/app/hooks/useChat";
import { useDateFormatter } from "@/app/hooks/useDateFormatter";
import { useLanguage } from "@/app/hooks/LanguageContext";
import { Language } from "@/app/common/types";
import { clientFetch } from "@/app/hooks/useClientFetch";

interface ChatContainerProps {
  partyId: number;
  initialMessages?: ChatPayload[];
  initialMembers?: { id: number; nickname: string; nickname_jp?: string; profileImage: string; status?: string }[];
  hostId?: number | null;
  partyInfo?: {
    title: string;
    meetDate: string;
    storeName: string;
    status: string;
  } | null;
  currentUser: {
    id: number;
    nickname: string;
    nickname_jp?: string;
    profileImage?: string;
  };
}

interface SettlementInfo {
  id: number;
  status: string;
}

// 1. 개별 메시지 최적화 - 프롭스 안바뀌면 다시 안그림
const MessageItem = memo(({ msg, isMe, nickname, formatMessageTime, texts, onReviewClick, onReportClick, reviewStatus, renderSystemMessage }: any) => {
  // 기본값 설정
  const canReview = reviewStatus?.canReview === true;
  const hasReviewed = reviewStatus?.hasReviewed === true;
  
  // 평가 완료 상태: canReview가 true이고 hasReviewed가 true일 때만
  const isReviewCompleted = canReview && hasReviewed;
  const isReviewDisabled = !canReview || isReviewCompleted;

  const handleReviewClick = async () => {
    if (isReviewDisabled) {
      if (!canReview) {
        alert("모임이 종료된 후 평가할 수 있습니다.");
      } else if (isReviewCompleted) {
        alert("이미 이 모임에 대한 평가를 완료했습니다.");
      }
      return;
    }
    onReviewClick();
  };

  return (
    <React.Fragment>
      {msg.showDivider && (
        <div className="flex justify-center my-12">
          <div className="relative w-full flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100"></div>
            </div>
            <span className="relative px-6 py-1.5 text-[11px] text-gray-400 font-semibold bg-gray-100/50 rounded-full border border-gray-100/30">
              {msg.dividerDate}
            </span>
          </div>
        </div>
      )}

      {msg.messageType === 'SYSTEM' ? (
        <div className="flex justify-center my-10">
          <span className="text-[13px] text-gray-400 font-semibold tracking-tight bg-gray-100/50 px-6 py-1.5 rounded-full border border-gray-100/30">
            {renderSystemMessage(msg.message)}
          </span>
        </div>
      ) : msg.messageType === 'SYSTEM_REVIEW' ? (
        <div className="flex justify-center my-16">
          <div className="flex flex-col items-center gap-5 p-10 bg-green-50/40 rounded-[32px] border border-green-100/30 shadow-sm max-w-md w-full">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-2">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <span className="text-[15px] font-black text-green-900 text-center leading-relaxed">
              {isReviewCompleted ? "이미 평가를 완료했습니다" : msg.message}
            </span>
            {reviewStatus?.totalMembers > 0 && (
              <>
                <button
                  onClick={handleReviewClick}
                  disabled={isReviewDisabled}
                  className={`mt-2 px-8 py-3.5 rounded-full text-[14px] font-black transition-all shadow-lg ${isReviewDisabled 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-[#33612E] text-white hover:scale-105 active:scale-95 shadow-green-950/20'}`}
                >
                  {isReviewCompleted ? "평가 완료" : texts.goReview}
                </button>
                <button
                  onClick={onReportClick}
                  className="mt-1 text-[13px] font-bold text-gray-400 hover:text-red-500 underline underline-offset-4 transition-colors"
                >
                  {texts.reportProblem}
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className={`flex gap-5 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
          {!isMe && (
            <div className="shrink-0 mt-1">
              <img
                src={msg.profileImage || "/images/gachimura_logo.png"}
                className="w-12 h-12 rounded-full border-2 border-white bg-white shadow-md transition-transform hover:rotate-6 object-contain p-1"
                alt=""
              />
            </div>
          )}
          <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[70%]`}>
            {!isMe && (
              <span className="text-[13px] font-black text-gray-800 mb-2 ml-1 opacity-80">
                {nickname}
              </span>
            )}
            <div className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
              <div
                className={`px-5 py-2 text-[15px] leading-relaxed shadow-xs transition-all hover:shadow-sm ${isMe
                  ? "bg-[#33612E] text-white rounded-md rounded-tr-none font-medium"
                  : "bg-[#EDEDF0] text-gray-800 rounded-md rounded-tl-none font-medium"
                  }`}
              >
                {msg.message}
              </div>
              <span className="text-[10px] text-gray-400 font-bold mb-1 shrink-0">
                {formatMessageTime(msg.createdAt)}
              </span>
            </div>
          </div>
          {isMe && (
            <span className="self-end text-[11px] text-gray-400 font-black mb-1.5 text-right w-10">
              {texts.me}
            </span>
          )}
        </div>
      )}
    </React.Fragment>
  );
});
MessageItem.displayName = "MessageItem";

// 2. 메시지 리스트
const MessageList = memo(({ messages, myId, formatMessageTime, texts, onReviewClick, onReportClick, reviewStatus, renderSystemMessage, resolveNickname }: any) => {
  return (
    <div className="max-w-4xl mx-auto p-10 space-y-10">
      {messages.map((msg: any, index: number) => (
        <MessageItem
          key={`${msg.createdAt}-${index}`}
          msg={msg}
          isMe={msg.userId === myId}
          nickname={resolveNickname(msg)}
          formatMessageTime={formatMessageTime}
          texts={texts}
          onReviewClick={onReviewClick}
          onReportClick={onReportClick}
          reviewStatus={reviewStatus}
          renderSystemMessage={renderSystemMessage}
        />
      ))}
    </div>
  );
});
MessageList.displayName = "MessageList";

// 사이드바 (Lazy Rendering 적용)
const Sidebar = memo(
  ({ isOpen, onClose, members, myId, hostId, texts, onKick, onApprove, onReject, routerPush, lang }: any) => {
    // 실제 렌더링 여부를 결정하는 내부 상태 (닫을 때 애니메이션을 위해 조금 늦게 비움)
    const [shouldRenderContent, setShouldRenderContent] = useState(isOpen);

    useEffect(() => {
      if (isOpen) {
        setShouldRenderContent(true);
      } else {
        // 닫을 때는 애니메이션 끝난 뒤에 내용 비우기
        const timer = setTimeout(() => setShouldRenderContent(false), 300);
        return () => clearTimeout(timer);
      }
    }, [isOpen]);

    const approvedMembers = useMemo(() => members.filter((m: any) => m.status === 'APPROVED'), [members]);
    const pendingMembers = useMemo(() => members.filter((m: any) => m.status === 'PENDING'), [members]);

    return (
      <div
        className={`fixed inset-0 z-[100] transition-opacity duration-200 ${isOpen ? "visible opacity-100" : "invisible opacity-0"
          }`}
        style={{ pointerEvents: isOpen ? "auto" : "none" }}
      >
        <div
          className="absolute inset-0 bg-black/50 will-change-opacity"
          onClick={onClose}
        />
        <div
          className={`absolute left-0 top-0 h-full w-80 bg-white shadow-2xl p-8 flex flex-col transition-transform duration-200 ease-out will-change-transform ${isOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          style={{ contain: "content" }}
        >
          <div className="flex justify-between items-center mb-10 shrink-0">
            <h2 className="text-2xl font-black text-gray-900">{texts.chat.members}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-all active:scale-90 opacity-80"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          {/* Lazy Content - 열려있거나 애니메이션 중일 때만 멤버 목록을 그림 */}
          {shouldRenderContent && (
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-10">
              <div className="space-y-4">
                {approvedMembers.map((member: any) => (
                  <div
                    key={member.id}
                    className={`flex items-center justify-between p-2 rounded-xl transition-all group hover:bg-gray-50 ${member.id === myId ? "bg-green-50 ring-1 ring-green-100" : ""
                      }`}
                  >
                    <div
                      className="flex items-center gap-4 cursor-pointer flex-1"
                      onClick={() => routerPush(`/user/${member.id}`)}
                    >
                      <img
                        src={member.profileImage || "/images/gachimura_logo.png"}
                        className={`w-12 h-12 rounded-full border-2 border-gray-50 shadow-sm ${!member.profileImage ? "object-contain p-2 bg-gray-50/50" : "object-cover"}`}
                        alt=""
                      />
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-gray-800 text-base">{lang === Language.japanese ? (member.nickname_jp || member.nickname) : member.nickname}</span>
                          {member.id === hostId && (
                            <span className="w-3.5 h-3.5 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center">
                              <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5M19 19C19 19.6 18.6 20 18 20H6C5.4 20 5 19.6 5 19V18H19V19Z" />
                              </svg>
                            </span>
                          )}
                        </div>
                        {member.id === myId && <span className="text-[10px] text-green-600 font-black">YOU</span>}
                      </div>
                    </div>
                    {myId === hostId && member.id !== myId && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onKick(member.id, lang === Language.japanese ? (member.nickname_jp || member.nickname) : member.nickname);
                        }}
                        className="px-2 py-1 text-[10px] font-bold text-gray-400 border border-gray-50 rounded-md hover:bg-red-50 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"
                      >
                        {texts.chat.kick}
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {myId === hostId && pendingMembers.length > 0 && (
                <div className="pt-8 border-t border-gray-100 space-y-4">
                  <h3 className="text-[11px] font-black text-orange-400 tracking-widest uppercase">
                    {texts.chat.pending} ({pendingMembers.length})
                  </h3>
                  <div className="space-y-4">
                    {pendingMembers.map((member: any) => (
                      <div key={member.id} className="flex items-center justify-between p-2 rounded-xl bg-gray-50/50">
                        <div className="flex items-center gap-3">
                          <img
                            src={member.profileImage || "/images/gachimura_logo.png"}
                            className={`w-10 h-10 rounded-full opacity-60 ${!member.profileImage ? "object-contain p-1.5 bg-gray-50/30" : "object-cover"}`}
                            alt=""
                          />
                          <span className="font-bold text-gray-400 text-[14px]">{lang === Language.japanese ? (member.nickname_jp || member.nickname) : member.nickname}</span>
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onApprove(member.id, lang === Language.japanese ? (member.nickname_jp || member.nickname) : member.nickname);
                            }}
                            className="px-2 py-1 text-[11px] font-black bg-[#33612E] text-white rounded-md"
                          >
                            {texts.chat.accept}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onReject(member.id, lang === Language.japanese ? (member.nickname_jp || member.nickname) : member.nickname);
                            }}
                            className="px-2 py-1 text-[11px] font-black border border-gray-200 text-gray-400 rounded-md"
                          >
                            {texts.chat.reject}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
);
Sidebar.displayName = "Sidebar";

// 4. 헤더
interface ChatHeaderProps {
  isHost: boolean;
  canOpenSettlement: boolean;
  isNavigatingSettlement: boolean;
  partyInfo: any;
  texts: any;
  formatFullDate: (date: any) => string;
  onOpenSidebar: () => void;
  onSettle: () => void;
  onUpdateStatus: (status: string) => void;
}

const ChatHeader = memo(({ isHost, canOpenSettlement, isNavigatingSettlement, partyInfo, texts, formatFullDate, onOpenSidebar, onSettle, onUpdateStatus }: ChatHeaderProps) => {
  return (
    <header className="px-8 py-5 border-b border-gray-50 bg-white shadow-sm shrink-0 z-20">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button onClick={onOpenSidebar} className="p-2.5 hover:bg-gray-100 rounded-xl transition-all">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-black text-gray-900 leading-none mb-1.5">
                {partyInfo?.title || texts.chat.loading}
              </h1>
              {partyInfo?.status && (
                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${partyInfo.status === 'RECRUITING'
                  ? 'bg-green-100 text-green-600'
                  : partyInfo.status === 'SETTLING'
                    ? 'bg-orange-100 text-orange-600'
                    : 'bg-gray-100 text-gray-600'
                  }`}>
                  {partyInfo.status === 'RECRUITING'
                    ? texts.main.recruiting
                    : partyInfo.status === 'SETTLING'
                      ? texts.main.settling
                      : texts.main.closed}
                </span>
              )}
            </div>
            <div className="text-[12px] text-gray-400 font-bold">
              {partyInfo?.storeName || texts.chat.noInfo} <span className="mx-1 opacity-20">|</span> {texts.chat.date}
              : {formatFullDate(partyInfo?.meetDate)}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {!isHost && (
            <button
              onClick={onSettle}
              disabled={!canOpenSettlement || isNavigatingSettlement}
              className={`min-w-[124px] px-5 py-2 text-[13px] font-black rounded-xl transition-all font-sans ${canOpenSettlement && !isNavigatingSettlement
                ? "bg-[#33612E] text-white hover:bg-[#2a5025] shadow-sm"
                : "border border-gray-100 bg-white text-gray-300 cursor-not-allowed"
                }`}
              title={canOpenSettlement
                ? "정산 페이지로 이동합니다"
                : "호스트가 정산을 시작하면 활성화됩니다"}
            >
              {isNavigatingSettlement
                ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    {texts.auth.loading || "이동 중..."}
                  </span>
                )
                : canOpenSettlement
                ? (texts.chat.joinSettlement || "정산 참여하기")
                : (texts.chat.settlementWaiting || "정산 대기중")}
            </button>
          )}

          {isHost && (
            <>
            <button
              onClick={onSettle}
              disabled={isNavigatingSettlement}
              className={`px-5 py-2 text-[13px] font-black border rounded-xl transition-all font-sans ${partyInfo?.status === 'SETTLING'
                ? 'bg-orange-50 border-orange-200 text-orange-600'
                : 'border-gray-100 hover:bg-gray-50 text-gray-700'
                }`}
            >
              {isNavigatingSettlement ? (
                <span className="inline-flex items-center gap-2">
                  <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  {texts.auth.loading || "이동 중..."}
                </span>
              ) : texts.chat.settle}
            </button>
            <button
              onClick={() => onUpdateStatus('CLOSED')}
              disabled={partyInfo?.status === 'CLOSED'}
              className={`px-5 py-2 text-[13px] font-black border rounded-xl transition-all font-sans ${partyInfo?.status === 'CLOSED'
                ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                : 'border-gray-100 hover:bg-gray-50 text-gray-700'
                }`}
            >
              {texts.chat.end}
            </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
});
ChatHeader.displayName = "ChatHeader";

// 5. 입력창 (상태 격리 - 타이핑 시 부모 전체 리렌더링 방지용)
const ChatInputArea = memo(
  ({ onSendMessage, placeholder, isDisabled }: { onSendMessage: (msg: string) => void; placeholder: string; isDisabled?: boolean }) => {
    const [input, setInput] = useState("");
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || isDisabled) return;
      onSendMessage(input);
      setInput("");
    };

    return (
      <div className={`px-8 py-8 bg-white border-t border-gray-50 shrink-0 ${isDisabled ? "opacity-60" : ""}`}>
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="relative flex items-center">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isDisabled}
              className={`bg-gray-50 w-full h-[56px] pl-8 pr-16 border border-gray-100 rounded-full text-[16px] outline-none transition-all shadow-none ${isDisabled
                ? "cursor-not-allowed text-gray-400"
                : "focus:border-[#33612E] focus:bg-white"
                }`}
              placeholder={isDisabled ? "종료된 모임입니다." : placeholder}
            />
            <button
              type="submit"
              disabled={isDisabled || !input.trim()}
              className={`absolute right-2 w-12 h-12 rounded-full flex items-center justify-center transition-all ${input.trim() && !isDisabled ? "bg-[#33612E] text-white" : "bg-gray-200 text-gray-400 opacity-50"
                }`}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <line x1="12" y1="19" x2="12" y2="5"></line>
                <polyline points="5 12 12 5 19 12"></polyline>
              </svg>
            </button>
          </form>
        </div>
      </div>
    );
  }
);
ChatInputArea.displayName = "ChatInputArea";

// 메인 컨테이너
export default function ChatContainer({
  partyId,
  initialMessages = [],
  initialMembers = [],
  hostId = null,
  partyInfo = null,
  currentUser,
}: ChatContainerProps) {
  const [members, setMembers] = useState(initialMembers);
  const [currentParty, setCurrentParty] = useState(partyInfo);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isNavigatingSettlement, setIsNavigatingSettlement] = useState(false);
  const [settlementInfo, setSettlementInfo] = useState<SettlementInfo | null>(null);
  const [reviewStatus, setReviewStatus] = useState<any>({ hasReviewed: false, canReview: false });

  const router = useRouter();
  const { texts, lang } = useLanguage();

  const getLocalizedNickname = useCallback(
    (nicknameKo?: string, nicknameJp?: string) =>
      lang === Language.japanese
        ? (nicknameJp || nicknameKo || "알 수 없음")
        : (nicknameKo || nicknameJp || "알 수 없음"),
    [lang]
  );

  const resolveNickname = useCallback(
    (msg: any) => {
      if (msg.userId === currentUser.id) {
        return getLocalizedNickname(currentUser.nickname, currentUser.nickname_jp);
      }

      const member = members.find((m: any) => m.id === msg.userId);
      if (member) {
        return getLocalizedNickname(member.nickname, member.nickname_jp);
      }

      return getLocalizedNickname(msg.nickname, msg.nickname_jp);
    },
    [members, currentUser.id, currentUser.nickname, currentUser.nickname_jp, getLocalizedNickname]
  );

  const renderSystemMessage = useCallback(
    (rawMessage: string) => {
      const joinedLegacyMatch = rawMessage.match(/^(.*)님이 모임에 합류했습니다!?$/);
      if (joinedLegacyMatch) {
        const nickname = joinedLegacyMatch[1];
        return texts.chat.systemJoinTemplate.replace("{nickname}", nickname);
      }

      const leftLegacyMatch = rawMessage.match(/^(.*)님이 모임[를을] 떠났습니다\.$/);
      if (leftLegacyMatch) {
        const nickname = leftLegacyMatch[1];
        return texts.chat.systemLeaveTemplate.replace("{nickname}", nickname);
      }

      if (!rawMessage || !rawMessage.startsWith("__SYS__|")) {
        return rawMessage;
      }

      const [, event, ...rest] = rawMessage.split("|");

      const decodeSafe = (value?: string) => {
        if (!value) return "";
        try {
          return decodeURIComponent(value);
        } catch {
          return value;
        }
      };

      const nicknameKo = decodeSafe(rest[0]);
      const nicknameJp = decodeSafe(rest[1]);
      const nickname = getLocalizedNickname(nicknameKo, nicknameJp);

      if (event === "JOIN") {
        return texts.chat.systemJoinTemplate.replace("{nickname}", nickname);
      }
      if (event === "LEAVE") {
        return texts.chat.systemLeaveTemplate.replace("{nickname}", nickname);
      }

      return rawMessage;
    },
    [texts, getLocalizedNickname]
  );

  // 평가 여부 확인
  useEffect(() => {
    async function checkReviewStatus() {
      try {
        const status = await clientFetch(`/reviews/check/${partyId}`);
        console.log(`파티 ${partyId} 평가 상태:`, status);
        // canReview 필드가 없으면 기본값 설정
        const safeStatus = {
          hasReviewed: status?.hasReviewed === true,
          canReview: status?.canReview === true,
          reviewCount: status?.reviewCount ?? 0,
          totalMembers: status?.totalMembers ?? 0,
        };
        console.log(`파티 ${partyId} 안전한 상태:`, safeStatus);
        setReviewStatus(safeStatus);
      } catch (error) {
        // 에러 발생 시 기본값으로 설정 (평가하지 않은 상태, 평가 불가능)
        console.error(`파티 ${partyId} 평가 상태 확인 실패:`, error);
        setReviewStatus({ hasReviewed: false, canReview: false, reviewCount: 0, totalMembers: 0 });
      }
    }
    if (partyId) checkReviewStatus();
  }, [partyId]);

  // props로 받은 currentUser 정보를 바로 사용
  const { messages: realTimeMessages, sendMessage } = useChat(
    currentUser.id,
    getLocalizedNickname(currentUser.nickname, currentUser.nickname_jp),
    partyId,
    currentUser.profileImage
  );

  const { formatFullDate, formatDividerDate, formatMessageTime } = useDateFormatter();
  const scrollRef = useRef<HTMLDivElement>(null);

  // 멤버 목록 및 파티 정보 업데이트 (초기값 설정)
  useEffect(() => {
    setMembers(initialMembers);
    setCurrentParty(partyInfo);
  }, [initialMembers, partyInfo]);

  useEffect(() => {
    let cancelled = false;

    const fetchSettlementInfo = async () => {
      try {
        const data = await clientFetch<SettlementInfo | null>(`/settlements/party/${partyId}`);
        if (!cancelled) {
          setSettlementInfo(data);
        }
      } catch {
        if (!cancelled) {
          setSettlementInfo(null);
        }
      }
    };

    fetchSettlementInfo();
    const interval = setInterval(fetchSettlementInfo, 10000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [partyId]);

  // 자동 스크롤 하단 고정 로직
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
      setShowScrollButton(false);
    }
  }, []);

  useEffect(() => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    if (scrollHeight - scrollTop - clientHeight < 150) {
      setTimeout(scrollToBottom, 50);
    } else {
      setShowScrollButton(true);
    }
  }, [realTimeMessages, scrollToBottom]);

  // 메시지 날짜 연산 최적화 (렌더링 중 계산 방지)
  const processedMessages = useMemo(() => {
    const merged = [...initialMessages, ...realTimeMessages];
    const seen = new Set<string>();
    const deduped = merged.filter((msg) => {
      const normalizedType = msg.messageType ?? "TALK";
      const normalizedTimestamp = msg.createdAt ? String(new Date(msg.createdAt).getTime()) : "";
      const normalizedUserId = msg.userId ?? 0;
      const key = `${normalizedTimestamp}|${normalizedUserId}|${normalizedType}|${msg.message}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    let lastDate = "";
    const list = deduped.map((msg) => {
      const currentDate = msg.createdAt ? new Date(msg.createdAt).toLocaleDateString("ko-KR") : "";
      const showDivider = currentDate !== lastDate;
      lastDate = currentDate;
      return {
        ...msg,
        showDivider,
        dividerDate: showDivider ? formatDividerDate(msg.createdAt) : "",
      };
    });

    if (currentParty?.status === 'CLOSED') {
      list.push({
        userId: -1,
        partyId,
        nickname: 'SYSTEM',
        message: texts.review.closedMessage,
        messageType: 'SYSTEM_REVIEW',
        showDivider: false,
        dividerDate: '',
        createdAt: new Date().toISOString()
      });
    }

    return list;
  }, [initialMessages, realTimeMessages, formatDividerDate, currentParty?.status, texts, partyId]);

  // 핸들러들 useCallback으로 고정
  const handleSendMessage = useCallback((msg: string) => sendMessage(msg), [sendMessage]);
  const handleOpenDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const handleCloseDrawer = useCallback(() => setIsDrawerOpen(false), []);
  const isHost = currentUser.id === hostId;
  const handleSettle = useCallback(() => {
    if (isNavigatingSettlement) return;

    // 호스트가 정산을 처음 시작할 때만 1회 확인
    if (isHost && currentParty?.status !== 'SETTLING' && currentParty?.status !== 'CLOSED') {
      const confirmKey = `settlement-start-confirmed:${partyId}`;
      if (!sessionStorage.getItem(confirmKey)) {
        const ok = confirm('정산을 시작할까요?');
        if (!ok) return;
        sessionStorage.setItem(confirmKey, '1');
      }
    }

    setIsNavigatingSettlement(true);

    // UX 우선: 먼저 정산 페이지로 이동하고, 상태 변경은 백그라운드로 시도
    router.push(`/settlement/${partyId}`);

    if (!isHost || currentParty?.status === 'SETTLING' || currentParty?.status === 'CLOSED') {
      return;
    }

    void clientFetch(`/parties/${partyId}/status`, {
      method: 'PATCH',
      body: { status: 'SETTLING' },
    }).catch((error) => {
      console.error('정산 상태 변경 실패:', error);
    });
  }, [isNavigatingSettlement, isHost, currentParty?.status, partyId, router]);
  const canOpenSettlement = Boolean(currentUser.id === hostId || (settlementInfo && settlementInfo.status !== "DRAFT"));

  const handleUpdateStatus = useCallback(
    async (newStatus: string) => {
      if (newStatus === 'CLOSED' && !confirm('모임이 종료되었나요?')) return;

      try {
        const result = await clientFetch(`/parties/${partyId}/status`, {
          method: 'PATCH',
          body: { status: newStatus },
        });
        if (result) {
          setCurrentParty((prev: any) => (prev ? { ...prev, status: newStatus } : null));
        }
      } catch (error: any) {
        alert(error.message || '상태 변경 처리 중 오류가 발생했습니다.');
      }
    },
    [partyId]
  );

  const handleKick = useCallback(
    async (targetId: number, nickname: string) => {
      if (!confirm(`${nickname}${texts.chat.kickConfirm}`)) return;
      try {
        const result = await clientFetch(`/party-members/${partyId}/${targetId}`, { method: 'DELETE' });
        if (result.success) setMembers((prev) => prev.filter((m) => m.id !== targetId));
      } catch (error: any) {
        alert(error.message || '오류 발생');
      }
    },
    [partyId, texts?.chat?.kickConfirm]
  );

  const handleApprove = useCallback(
    async (targetId: number, nickname: string) => {
      try {
        await clientFetch(`/party-members/${partyId}/${targetId}/status`, { method: 'PATCH', body: { status: 'APPROVED' } });
        alert(`${nickname}${texts.chat.approveSuccess}`);
        setMembers((prev) => prev.map((m) => (m.id === targetId ? { ...m, status: 'APPROVED' } : m)));
      } catch (error: any) {
        alert(error.message || '실패');
      }
    },
    [partyId, texts?.chat?.approveSuccess]
  );

  const handleReject = useCallback(
    async (targetId: number, nickname: string) => {
      if (!confirm(`${nickname}${texts.chat.rejectConfirm}`)) return;
      try {
        await clientFetch(`/party-members/${partyId}/${targetId}/status`, { method: 'PATCH', body: { status: 'REJECTED' } });
        alert(texts.chat.rejectSuccess);
        setMembers((prev) => prev.filter((m) => m.id !== targetId));
      } catch (error: any) {
        alert(error.message || '실패');
      }
    },
    [partyId, texts?.chat?.rejectConfirm, texts?.chat?.rejectSuccess]
  );

  return (
    <div className="relative flex flex-col h-[calc(100vh-64px)] w-full bg-white overflow-hidden font-sans">
      {/* 1. 사이드바 */}
      <Sidebar
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        members={members}
        myId={currentUser.id}
        hostId={hostId}
        texts={texts}
        lang={lang}
        onKick={handleKick}
        onApprove={handleApprove}
        onReject={handleReject}
        routerPush={router.push}
      />

      {/* 2. 헤더 */}
      <ChatHeader
        isHost={isHost}
        canOpenSettlement={canOpenSettlement}
        isNavigatingSettlement={isNavigatingSettlement}
        partyInfo={currentParty}
        texts={texts}
        formatFullDate={formatFullDate}
        onOpenSidebar={handleOpenDrawer}
        onSettle={handleSettle}
        onUpdateStatus={handleUpdateStatus}
      />

      {/* 3. 채팅 영역 */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto bg-[#FBFBFC] relative"
        onScroll={() => {
          if (!scrollRef.current) return;
          const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
          setShowScrollButton(scrollHeight - scrollTop - clientHeight > 100);
        }}
      >
        <MessageList
          messages={processedMessages}
          myId={currentUser.id}
          formatMessageTime={formatMessageTime}
          texts={{ ...texts.chat, ...texts.review }}
          resolveNickname={resolveNickname}
          onReviewClick={() => router.push(`/party/${partyId}/review`)}
          onReportClick={() => alert("신고 페이지는 현재 준비 중입니다.")}
          reviewStatus={reviewStatus}
          renderSystemMessage={renderSystemMessage}
        />

        {/* 최신 메세지로 스크롤 버튼 */}
        {showScrollButton && (
          <div className="sticky bottom-4 left-0 right-0 flex justify-center z-30 pointer-events-none">
            <button
              onClick={scrollToBottom}
              className="pointer-events-auto bg-white/90 text-gray-500 px-6 py-2 rounded-full shadow-lg text-xs font-black animate-pulse-fast backdrop-blur-sm border border-gray-100 font-sans"
            >
              {texts.chat.newMessage}
            </button>
          </div>
        )}
      </div>

      {/* 4. 입력창 */}
      <ChatInputArea
        onSendMessage={handleSendMessage}
        placeholder={texts.chat.placeholder}
        isDisabled={currentParty?.status === 'CLOSED'}
      />
    </div>
  );
}