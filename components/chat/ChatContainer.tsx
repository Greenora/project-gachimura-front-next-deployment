"use client";

import React, { useState, useRef, useEffect, useMemo, memo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useChat, ChatPayload } from "@/app/hooks/useChat";
import { useDateFormatter } from "@/app/hooks/useDateFormatter";
import { useLanguage } from "@/app/hooks/LanguageContext";
import { clientFetch } from "@/app/hooks/useClientFetch";

interface ChatContainerProps {
  partyId: number;
  initialMessages?: ChatPayload[];
  initialMembers?: { id: number; nickname: string; profileImage: string; status?: string }[];
  hostId?: number | null;
  partyInfo?: {
    title: string;
    meetDate: string;
    storeName: string;
  } | null;
}

// 1. 개별 메시지 최적화 - 프롭스 안바뀌면 다시 안그림
const MessageItem = memo(({ msg, isMe, nickname, formatMessageTime, texts }: any) => {
  return (
    <React.Fragment>
      {msg.showDivider && (
        <div className="flex justify-center my-12">
          <div className="relative w-full flex items-center justify-center">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
            <span className="relative px-6 py-1.5 text-[11px] text-gray-400 font-semibold bg-gray-100/50 rounded-full border border-gray-100/30">
              {msg.dividerDate}
            </span>
          </div>
        </div>
      )}

      {msg.messageType === 'SYSTEM' ? (
        <div className="flex justify-center my-10">
          <span className="text-[13px] text-gray-400 font-semibold tracking-tight bg-gray-100/50 px-6 py-1.5 rounded-full border border-gray-100/30">{msg.message}</span>
        </div>
      ) : (
        <div className={`flex gap-5 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
          {!isMe && (
            <div className="shrink-0 mt-1">
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${nickname}`} className="w-12 h-12 rounded-full border-2 border-white bg-white shadow-md transition-transform hover:rotate-6" alt="" />
            </div>
          )}
          <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[70%]`}>
            {!isMe && <span className="text-[13px] font-black text-gray-800 mb-2 ml-1 opacity-80">{nickname}</span>}
            <div className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
              <div className={`px-5 py-2 text-[15px] leading-relaxed shadow-xs transition-all hover:shadow-sm ${isMe ? "bg-[#33612E] text-white rounded-md rounded-tr-none font-medium" : "bg-[#EDEDF0] text-gray-800 rounded-md rounded-tl-none font-medium"}`}>
                {msg.message}
              </div>
              <span className="text-[10px] text-gray-400 font-bold mb-1 shrink-0">{formatMessageTime(msg.createdAt)}</span>
            </div>
          </div>
          {isMe && <span className="self-end text-[11px] text-gray-400 font-black mb-1.5 text-right w-10">{texts.me}</span>}
        </div>
      )}
    </React.Fragment>
  );
});
MessageItem.displayName = "MessageItem";

// 2. 메시지 리스트
const MessageList = memo(({ messages, myId, formatMessageTime, texts }: any) => {
  return (
    <div className="max-w-4xl mx-auto p-10 space-y-10">
      {messages.map((msg: any, index: number) => (
        <MessageItem key={`${msg.createdAt}-${index}`} msg={msg} isMe={msg.userId === myId} nickname={msg.nickname} formatMessageTime={formatMessageTime} texts={texts} />
      ))}
    </div>
  );
});
MessageList.displayName = "MessageList";

// 사이드바 (Lazy Rendering 적용)
const Sidebar = memo(({ isOpen, onClose, members, myId, hostId, texts, onKick, onApprove, onReject, routerPush }: any) => {
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
    <div className={`fixed inset-0 z-[100] transition-opacity duration-200 ${isOpen ? "visible opacity-100" : "invisible opacity-0"}`} style={{ pointerEvents: isOpen ? "auto" : "none" }}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] will-change-opacity" onClick={onClose} />
      <div className={`absolute left-0 top-0 h-full w-80 bg-white shadow-2xl p-8 flex flex-col transition-transform duration-200 ease-out will-change-transform ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex justify-between items-center mb-10 shrink-0">
          <h2 className="text-2xl font-black text-gray-900">{texts.chat.members}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-all active:scale-90 opacity-80"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
        </div>

        {/* Lazy Content - 열려있거나 애니메이션 중일 때만 멤버 목록을 그림 */}
        {shouldRenderContent && (
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-10">
            <div className="space-y-4">
              {approvedMembers.map((member: any) => (
                <div key={member.id} className={`flex items-center justify-between p-2 rounded-xl transition-all group hover:bg-gray-50 ${member.id === myId ? "bg-green-50 ring-1 ring-green-100" : ""}`}>
                  <div className="flex items-center gap-4 cursor-pointer flex-1" onClick={() => routerPush(`/profile/${member.id}`)}>
                    <img src={member.profileImage} className="w-12 h-12 rounded-full border-2 border-gray-50 shadow-sm" alt="" />
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5"><span className="font-bold text-gray-800 text-base">{member.nickname}</span>{member.id === hostId && <span className="w-3.5 h-3.5 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center"><svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><path d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5M19 19C19 19.6 18.6 20 18 20H6C5.4 20 5 19.6 5 19V18H19V19Z" /></svg></span>}</div>
                      {member.id === myId && <span className="text-[10px] text-green-600 font-black">YOU</span>}
                    </div>
                  </div>
                  {myId === hostId && member.id !== myId && (
                    <button onClick={(e) => { e.stopPropagation(); onKick(member.id, member.nickname); }} className="px-2 py-1 text-[10px] font-bold text-gray-400 border border-gray-50 rounded-md hover:bg-red-50 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100">{texts.chat.kick}</button>
                  )}
                </div>
              ))}
            </div>

            {myId === hostId && pendingMembers.length > 0 && (
              <div className="pt-8 border-t border-gray-100 space-y-4">
                <h3 className="text-[11px] font-black text-orange-400 tracking-widest uppercase">{texts.chat.pending} ({pendingMembers.length})</h3>
                <div className="space-y-4">
                  {pendingMembers.map((member: any) => (
                    <div key={member.id} className="flex items-center justify-between p-2 rounded-xl bg-gray-50/50">
                      <div className="flex items-center gap-3"><img src={member.profileImage} className="w-10 h-10 rounded-full opacity-60" alt="" /><span className="font-bold text-gray-400 text-[14px]">{member.nickname}</span></div>
                      <div className="flex gap-1.5">
                        <button onClick={(e) => { e.stopPropagation(); onApprove(member.id, member.nickname); }} className="px-2 py-1 text-[11px] font-black bg-[#33612E] text-white rounded-md">{texts.chat.accept}</button>
                        <button onClick={(e) => { e.stopPropagation(); onReject(member.id, member.nickname); }} className="px-2 py-1 text-[11px] font-black border border-gray-200 text-gray-400 rounded-md">{texts.chat.reject}</button>
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
});
Sidebar.displayName = "Sidebar";

// 4. 헤더
const ChatHeader = memo(({ isHost, partyInfo, texts, formatFullDate, onOpenSidebar }: any) => {
  return (
    <header className="px-8 py-5 border-b border-gray-50 bg-white shrink-0 z-20">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button onClick={onOpenSidebar} className="p-2.5 hover:bg-gray-100 rounded-xl transition-all"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg></button>
          <div className="flex flex-col"><h1 className="text-xl font-black text-gray-900 leading-none mb-1.5">{partyInfo?.title || texts.chat.loading}</h1><div className="text-[12px] text-gray-400 font-bold">{partyInfo?.storeName || texts.chat.noInfo} <span className="mx-1 opacity-20">|</span> {texts.chat.date}: {formatFullDate(partyInfo?.meetDate)}</div></div>
        </div>

        {isHost && (
          <div className="flex gap-2">
            <button className="px-5 py-2 text-[13px] font-black border border-gray-100 rounded-xl hover:bg-gray-50 transition-all font-sans">{texts.chat.settle}</button>
            <button className="px-5 py-2 text-[13px] font-black border border-gray-100 rounded-xl hover:bg-gray-50 transition-all font-sans">{texts.chat.end}</button>
          </div>
        )}
      </div>
    </header>
  );
});
ChatHeader.displayName = "ChatHeader";

// 5. 입력창 (상태 격리 - 타이핑 시 부모 전체 리렌더링 방지용)
const ChatInputArea = memo(({ onSendMessage, placeholder }: { onSendMessage: (msg: string) => void, placeholder: string }) => {
  const [input, setInput] = useState("");
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSendMessage(input);
    setInput("");
  };

  return (
    <div className="px-8 py-8 bg-white border-t border-gray-50 shrink-0">
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="bg-gray-50 w-full h-[56px] pl-8 pr-16 border border-gray-100 rounded-full text-[16px] outline-none focus:border-[#33612E] focus:bg-white transition-all shadow-none"
            placeholder={placeholder}
          />
          <button type="submit" className={`absolute right-2 w-12 h-12 rounded-full flex items-center justify-center transition-all ${input.trim() ? "bg-[#33612E] text-white" : "bg-gray-200 text-gray-400 opacity-50"}`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>
          </button>
        </form>
      </div>
    </div>
  );
});
ChatInputArea.displayName = "ChatInputArea";

// 메인 컨테이너
export default function ChatContainer({
  partyId,
  initialMessages = [],
  initialMembers = [],
  hostId = null,
  partyInfo = null
}: ChatContainerProps) {
  const [myId, setMyId] = useState<number>(1);
  const [myNickname, setMyNickname] = useState<string>("");
  const [members, setMembers] = useState(initialMembers);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const router = useRouter();
  const { texts } = useLanguage();
  const { messages: realTimeMessages, sendMessage } = useChat(myId, myNickname, partyId);
  const { formatFullDate, formatDividerDate, formatMessageTime } = useDateFormatter();
  const scrollRef = useRef<HTMLDivElement>(null);

  // 초기 유저 로드
  useEffect(() => {
    const savedId = localStorage.getItem("gachimura_user_id");
    if (savedId) {
      const id = Number(savedId);
      const user = initialMembers.find(m => m.id === id);
      if (user) {
        setMyId(id);
        setMyNickname(user.nickname);
      }
    } else {
      const defaultUser = initialMembers[0] || { id: 1, nickname: "홍길동" };
      setMyId(defaultUser.id);
      setMyNickname(defaultUser.nickname);
    }
    setMembers(initialMembers);
    setIsLoaded(true);
  }, [initialMembers]);

  // 자동 스크롤 하단 고정 로직
  useEffect(() => {
    if (isLoaded && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [isLoaded]);

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
    let lastDate = "";
    return merged.map(msg => {
      const currentDate = msg.createdAt ? new Date(msg.createdAt).toLocaleDateString("ko-KR") : "";
      const showDivider = currentDate !== lastDate;
      lastDate = currentDate;
      return {
        ...msg,
        showDivider,
        dividerDate: showDivider ? formatDividerDate(msg.createdAt) : ""
      };
    });
  }, [initialMessages, realTimeMessages, formatDividerDate]);

  // 핸들러들 useCallback으로 고정
  const handleSendMessage = useCallback((msg: string) => sendMessage(msg), [sendMessage]);
  const handleOpenDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const handleCloseDrawer = useCallback(() => setIsDrawerOpen(false), []);

  const handleKick = useCallback(async (targetId: number, nickname: string) => {
    if (!confirm(`${nickname}${texts.chat.kickConfirm}`)) return;
    try {
      const result = await clientFetch(`/party-members/${partyId}/${targetId}`, { method: 'DELETE' });
      if (result.success) setMembers(prev => prev.filter(m => m.id !== targetId));
    } catch (error: any) { alert(error.message || '오류남'); }
  }, [partyId, texts.chat.kickConfirm]);

  const handleApprove = useCallback(async (targetId: number, nickname: string) => {
    try {
      await clientFetch(`/party-members/${partyId}/${targetId}/status`, { method: 'PATCH', body: { status: 'APPROVED' } });
      alert(`${nickname}${texts.chat.approveSuccess}`);
      setMembers(prev => prev.map(m => m.id === targetId ? { ...m, status: 'APPROVED' } : m));
    } catch (error: any) { alert(error.message || '실패'); }
  }, [partyId, texts.chat.approveSuccess]);

  const handleReject = useCallback(async (targetId: number, nickname: string) => {
    if (!confirm(`${nickname}${texts.chat.rejectConfirm}`)) return;
    try {
      await clientFetch(`/party-members/${partyId}/${targetId}/status`, { method: 'PATCH', body: { status: 'REJECTED' } });
      alert(texts.chat.rejectSuccess);
      setMembers(prev => prev.filter(m => m.id !== targetId));
    } catch (error: any) { alert(error.message || '실패'); }
  }, [partyId, texts.chat.rejectConfirm, texts.chat.rejectSuccess]);

  if (!isLoaded) return <div className="flex-1 bg-white h-screen" />;

  return (
    <div className="relative flex flex-col h-[calc(100vh-64px)] w-full bg-white overflow-hidden font-sans">

      {/* 1. 사이드바 */}
      <Sidebar
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        members={members}
        myId={myId}
        hostId={hostId}
        texts={texts}
        onKick={handleKick}
        onApprove={handleApprove}
        onReject={handleReject}
        routerPush={router.push}
      />

      {/* 2. 헤더 */}
      <ChatHeader
        isHost={myId === hostId}
        partyInfo={partyInfo}
        texts={texts}
        formatFullDate={formatFullDate}
        onOpenSidebar={handleOpenDrawer}
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
          myId={myId}
          formatMessageTime={formatMessageTime}
          texts={texts.chat}
        />

        {/* 최신 메세지로 스크롤 버튼 */}
        {showScrollButton && (
          <div className="sticky bottom-4 left-0 right-0 flex justify-center z-30 pointer-events-none">
            <button
              onClick={scrollToBottom}
              className="pointer-events-auto bg-white/90 text-gray-500 px-6 py-2 rounded-full shadow-lg text-xs font-black animate-bounce backdrop-blur-sm border border-gray-100 font-sans"
            >
              {texts.chat.newMessage}
            </button>
          </div>
        )}
      </div>

      {/* 4. 입력창 (상태 격리 완료) */}
      <ChatInputArea
        onSendMessage={handleSendMessage}
        placeholder={texts.chat.placeholder}
      />
    </div>
  );
}
