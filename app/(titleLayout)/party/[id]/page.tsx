"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
  host: { nickname: string; avatarUrl: string | null };
  isJoined: boolean;
  isHost: boolean;
}

export default function PartyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { texts, lang } = useLanguage();
  const t = texts.partyDetail;
  const [party, setParty] = useState<PartyDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    clientFetch(`/parties/${params.id}`)
      .then((data) => setParty(data))
      .catch((err) => {
        console.error(err);
        toast.error(t.loadingError);
        router.push("/home");
      })
      .finally(() => setLoading(false));
  }, [params.id, router, t.loadingError]);

  const handleJoin = async () => {
    if (!party) return;
    if (party.isJoined) {
      toast(t.goToChat);
      return;
    }
    try {
      await clientFetch(`/parties/${party.id}/join`, { method: "POST" });
      toast.success(t.joinSuccess);
      window.location.reload();
    } catch (err) {
      console.error("Join error:", err);
      toast.error(t.joinFail);
    }
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

  return (
    <div className="min-h-screen bg-white">
      {/* TODO: 검색바 + 위치 버튼 영역 나중에 추가 */}
      <div className="border-b border-gray-100 py-3 px-6">
        <div className="max-w-4xl mx-auto h-10">
          {/* 검색바 + 위치 버튼 자리 */}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* 모임 제목 */}
        <h1 className="text-xl font-bold text-gray-900 mb-4">{party.title}</h1>

        {/* 날짜/장소 */}
        <div className="space-y-1 mb-6">
          <div className="flex items-center gap-2 text-gray-600 text-sm">
            <span>⏰</span>
            <span>{formatDate(party.meetingDate)}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600 text-sm">
            <span>📍</span>
            <span>{party.location.name}</span>
          </div>
        </div>

        {/* 호스트 정보 */}
        <div className="flex items-start gap-3 mb-8">
          <Avatar nickname={party.host.nickname} avatarUrl={party.host.avatarUrl} size={40} />
          <div className="flex-1">
            <p className="font-medium text-sm mb-2 text-gray-600">{party.host.nickname}</p>
            <div className="bg-[#E8F4E8] border border-[#C8E6C9] rounded-2xl rounded-tl-none p-4 text-sm text-gray-700 leading-relaxed">
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
          <div className="mt-3">
            <span className="font-bold text-base text-gray-900">{party.location.name}</span>
            <span className="text-gray-500 text-sm ml-2">{party.location.address}</span>
          </div>
        </div>

        {/* 가입 버튼 */}
        <div className="pt-4 pb-8">
          <button
            onClick={handleJoin}
            disabled={party.isHost || (party.status !== "RECRUITING" && !party.isJoined)}
            className={`w-full py-4 rounded-xl font-bold text-white text-base transition-all
              ${party.isHost || party.isJoined ? "bg-gray-400 cursor-default" : "bg-[#4CAF50] hover:bg-[#43A047] active:scale-[0.99]"}
            `}
          >
            {party.isHost ? t.isHostMessage : party.isJoined ? t.alreadyJoined : t.joinButton}
          </button>
          <p className="text-center mt-3 text-sm text-gray-500">
            {t.participantCount.replace("{count}", String(party.currentCount))}
          </p>
        </div>
      </div>
    </div>
  );
}