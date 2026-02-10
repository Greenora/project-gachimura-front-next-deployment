"use client";

import Image from "next/image";
import Link from "next/link";
import { useDateFormatter } from "@/app/hooks/useDateFormatter";
import { useLanguage } from "@/app/hooks/LanguageContext";
import { Language } from "@/app/common/types";

interface PartyCardProps {
  party: {
    id: number;
    title: string;
    content: string;
    storeName: string;
    addressKo?: string;
    addressJp?: string;
    meetDate: string;
    status: string;
    host?: {
      nickname: string;
      profileImage?: string;
    };
  };
}

export default function PartyCard({ party }: PartyCardProps) {
  const { formatCardDate } = useDateFormatter();
  const { lang, texts } = useLanguage();

  const displayAddress = lang === Language.korean ? party.addressKo : party.addressJp;

  return (
    <Link
      href={`/parties/${party.id}`}
      className="group flex flex-col gap-3 transition-all duration-300"
    >
      {/* 썸네일 이미지 영역 */}
      <div className="relative aspect-square w-full rounded-md overflow-hidden bg-gray-100 shadow-sm">
        <Image
          src={`https://picsum.photos/seed/${party.id}/600/600`} // 1:1 비율 이미지
          alt={party.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* 호스트 정보 오버레이 (사진 하단) */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden shadow-sm bg-white relative">
              <Image
                src={party.host?.profileImage || "/images/gachimura_logo.png"}
                alt="host"
                width={40}
                height={40}
                className={!party.host?.profileImage ? "p-1.5 object-contain" : "object-cover"}
              />
            </div>
            <span className="text-white text-[15px] font-medium drop-shadow-sm">
              {party.host?.nickname || texts.main.anonymous}
            </span>
          </div>
        </div>

        <div className="absolute top-3 right-3">
          <span className={`px-2.5 py-1 rounded-md text-[10px] font-black tracking-tight uppercase shadow-sm ${party.status === 'RECRUITING'
            ? 'bg-green-600 text-white'
            : 'bg-gray-600 text-white'
            }`}>
            {party.status === 'RECRUITING' ? texts.main.recruiting : texts.main.closed}
          </span>
        </div>
      </div>

      {/* 텍스트 컨텐츠 영역 (사진 아래) */}
      <div className="px-1 flex flex-col gap-1">
        <h3 className="text-[18px] font-bold text-gray-900 line-clamp-1 mb-1 group-hover:text-green-800 transition-colors">
          {party.title}
        </h3>

        <div className="space-y-0.5">
          <p className="text-[14px] text-gray-500 font-medium">
            {texts.main.shoppingDate} <span className="text-[12px] text-gray-900 font-bold">{formatCardDate(party.meetDate)}</span>
          </p>

          <p className="text-[14px] text-gray-500 font-medium">
            {displayAddress || party.storeName}
          </p>
        </div>
      </div>
    </Link>
  );
}
