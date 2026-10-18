"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { clientFetch } from "@/app/hooks/useClientFetch";
import { useLanguage } from "@/app/hooks/LanguageContext";
import { Language } from "@/app/common/types";
import GoogleMapViewer from "@/components/party/GoogleMapViewer";
import Avatar from "@/components/common/Avatar";
import toast from "react-hot-toast";

interface PartyDetail {
  id: number;
  title: string;
  content: string;
  images: string[];
  status: "RECRUITING" | "CLOSED" | "SEALED";
  meetingDate: string;
  location: { name: string; address: string; lat: number; lng: number };
  capacity: number;
  currentCount: number;
  host: { id?: number; nickname: string; nickname_jp?: string; avatarUrl: string | null };
  isJoined: boolean;
  isHost: boolean;
  isAccepted?: boolean; // 참가 승인 여부 (백엔드에서 내려줘야 함)
  isRejected?: boolean; // 참가 거절 여부 (백엔드에서 내려줘야 함)
}

interface PartyDetailClientProps {
  partyId: string;
}

export default function PartyDetailClient({ partyId }: PartyDetailClientProps) {
  const router = useRouter();
  const { texts, lang } = useLanguage();
  const t = texts.partyDetail;
  const [party, setParty] = useState<PartyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNavigatingChat, setIsNavigatingChat] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const joinLockRef = useRef(false);

  useEffect(() => {
    clientFetch<PartyDetail>(`/parties/${partyId}`)
      .then((data) => setParty(data))
      .catch((err) => {
        console.error(err);
        toast.error(t.loadingError);
        router.push("/home");
      })
      .finally(() => setLoading(false));
  }, [partyId, router, t.loadingError]);

  useEffect(() => {
    if (!party?.id || !party.isAccepted) return;
    router.prefetch(`/chat/${party.id}`);
  }, [party?.id, party?.isAccepted, router]);

  const handleJoin = async () => {
    if (!party || joinLockRef.current) return;
    if (party.isJoined) {
      toast(t.goToChat);
      return;
    }
    joinLockRef.current = true;
    setIsJoining(true);
    try {
      await clientFetch(`/parties/${party.id}/join`, { method: "POST" });
      toast.success(t.joinSuccess);
      setParty((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          isJoined: true,
          isAccepted: false,
          isRejected: false,
          currentCount: prev.currentCount + 1,
        };
      });
    } catch (err) {
      console.error("Join error:", err);
      toast.error(t.joinFail);
    } finally {
      joinLockRef.current = false;
      setIsJoining(false);
    }
  };

  const handleGoToChat = async () => {
    if (!party) return;
    if (isNavigatingChat) return;
    setIsNavigatingChat(true);
    toast.loading(t.movingToChat, { id: "go-chat" });
    await new Promise((resolve) => setTimeout(resolve, 600));
    toast.dismiss("go-chat");
    router.push(`/chat/${party.id}`);
  };

  if (loading)
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-500">{texts.auth.loading}</div>
      </div>
    );
  if (!party) return null;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (lang === Language.japanese) {
      return `${t.meetingDate} ${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
    }
    return `${t.meetingDate} ${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
  };

  // 버튼 상태 및 텍스트/스타일 결정
  const isClosed = party.status !== "RECRUITING";
  let buttonText = t.joinButton;
  let buttonDisabled = isJoining;
  let buttonClass = "flex items-center justify-center gap-2.5 w-full py-4 rounded-full font-bold text-white text-base transition-all bg-[#166534] hover:bg-[#14532d] active:scale-95";
  let buttonOnClick: (() => Promise<void>) | undefined = handleJoin;

  if (party.isHost) {
    buttonText = t.isHostMessage;
    buttonDisabled = true;
    buttonClass = "flex items-center justify-center gap-2.5 w-full py-4 rounded-full font-bold text-white text-base bg-gray-400 cursor-default";
    buttonOnClick = undefined;
  } else if (party.isAccepted) {
    buttonText = isNavigatingChat ? t.movingToChat : t.goToChatButton;
    buttonDisabled = isNavigatingChat;
    buttonClass = `flex items-center justify-center gap-2.5 w-full py-4 rounded-full font-bold text-white text-base transition-all ${isNavigatingChat ? "bg-[#14532d] opacity-90" : "bg-[#166534] hover:bg-[#14532d] active:scale-95"}`;
    buttonOnClick = handleGoToChat;
  } else if (isClosed) {
    // 마감된 파티 — 호스트도 아니고 승인된 멤버도 아닌 경우 비활성화
    buttonText = t.closedParty;
    buttonDisabled = true;
    buttonClass = "flex items-center justify-center gap-2.5 w-full py-4 rounded-full font-bold text-white text-base bg-gray-400 cursor-not-allowed";
    buttonOnClick = undefined;
  } else if (party.isRejected || party.isJoined) {
    buttonText = t.alreadyJoined;
    buttonDisabled = true;
    buttonClass = "flex items-center justify-center gap-2.5 w-full py-4 rounded-full font-bold text-white text-base bg-gray-400 cursor-default";
    buttonOnClick = undefined;
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-4 py-6 sm:px-6 sm:py-8">
        {/* 모임 제목 */}
        <h1 className="break-words text-xl font-bold text-gray-900 mb-4">{party.title}</h1>

        {/* 날짜/장소 */}
        <div className="space-y-1 mb-6">
          <div className="flex items-center gap-2 text-gray-600 text-sm">
            <span>⏰</span>
            <span>{formatDate(party.meetingDate)}</span>
          </div>
          <div className="flex items-start gap-2 text-gray-600 text-sm">
            <span className="shrink-0">📍</span>
            <span className="min-w-0 break-words">{party.location.name}</span>
          </div>
        </div>

        {/* 호스트 정보 */}
        <div className="flex items-start gap-3 mb-8">
          {party.host.id ? (
            <Link
              href={`/user/${party.host.id}`}
              aria-label={`${party.host.nickname} 프로필로 이동`}
              className="shrink-0 rounded-full transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#166534] focus:ring-offset-2"
            >
              <Avatar nickname={party.host.nickname} avatarUrl={party.host.avatarUrl} size={40} />
            </Link>
          ) : (
            <Avatar nickname={party.host.nickname} avatarUrl={party.host.avatarUrl} size={40} />
          )}
          <div className="min-w-0 flex-1">
            {party.host.id ? (
              <Link
                href={`/user/${party.host.id}`}
                className="mb-2 inline-block max-w-full break-words font-medium text-sm text-gray-600 transition-colors hover:text-[#166534] focus:outline-none focus:underline"
              >
                {lang === Language.japanese ? (party.host.nickname_jp || party.host.nickname) : party.host.nickname}
              </Link>
            ) : (
              <p className="break-words font-medium text-sm mb-2 text-gray-600">
                {lang === Language.japanese ? (party.host.nickname_jp || party.host.nickname) : party.host.nickname}
              </p>
            )}
            <div className="break-words whitespace-pre-wrap bg-[#E8F4E8] border border-[#C8E6C9] rounded-2xl rounded-tl-none p-4 text-sm text-gray-700 leading-relaxed">
              {party.content}
            </div>
          </div>
        </div>

        {/* 모임 위치 */}
        <div className="mb-8">
          <h3 className="font-bold text-base text-gray-800 mb-3">{t.location}</h3>
          <div className="rounded-lg overflow-hidden border border-gray-200">
            {party.location.lat !== 0 ? (
              <GoogleMapViewer lat={party.location.lat} lng={party.location.lng} height="300px" />
            ) : (
              <div className="h-[300px] bg-gray-50 flex items-center justify-center text-gray-400">
                {t.noLocation}
              </div>
            )}
          </div>
          <div className="mt-3 space-y-1">
            <p className="break-words font-bold text-base text-gray-900">{party.location.name}</p>
            <p className="break-words text-gray-500 text-sm">{party.location.address}</p>
          </div>
        </div>

        {/* 가입/채팅방 이동/신청완료 버튼 */}
        <div className="pt-4 pb-8">
          <button
            className={buttonClass}
            disabled={buttonDisabled}
            aria-busy={isJoining || isNavigatingChat}
            onClick={buttonOnClick}
          >
            {buttonText}
          </button>
          <p className="text-center mt-3 text-sm text-gray-500">
            {t.participantCount.replace("{count}", String(party.currentCount))}
          </p>
        </div>
      </div>
    </div>
  );
}
