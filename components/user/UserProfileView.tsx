"use client";

import Image from "next/image";
import PartyCard from "@/components/main/PartyCard";
import { Language } from "@/app/common/types";

interface UserProfileViewProps {
  user: any;
  parties: any[];
  lang: Language;
}

export default function UserProfileView({ user, parties, lang }: UserProfileViewProps) {
  const nickname = lang === Language.japanese && user.nickname_jp ? user.nickname_jp : user.nickname;
  const treeScore = parseFloat(user.treeScore || "50.0");
  const scorePercentage = Math.min(Math.max(treeScore, 0), 100);

  return (
    <div className="flex flex-col gap-12 py-8 max-w-4xl mx-auto">
      {/* 유저 프로필 섹션 */}
      <section className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-10 bg-white p-8 border-2 border-gray-50 rounded-lg">
        <div className="w-32 h-32 rounded-full border-2 border-gray-50 shadow-inner overflow-hidden relative bg-white flex-shrink-0">
          <Image
            src={user.profileImage || "/images/gachimura_logo.png"}
            alt="profile"
            fill
            className={!user.profileImage ? "p-4 object-contain" : "object-cover"}
          />
        </div>

        <div className="flex-1 flex flex-col gap-4 w-full text-center md:text-left pt-2">
          <div className="flex flex-col gap-0.5">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">{nickname}</h1>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-1">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-full text-[12px] font-bold">
                <span className="text-base">🌳</span>
                <span>나무유저</span>
              </div>
              <div className="text-[12px] font-bold text-gray-400">
                받은 후기 <span className="text-gray-900">0</span>개
              </div>
            </div>

            {/* 신뢰 바 */}
            <div className="flex flex-col gap-1.5 w-full max-w-xs mx-auto md:mx-0">
              <div className="flex justify-between items-end mb-0.5">
                <span className="text-[12px] font-bold text-gray-400">가치 실천도</span>
                <span className="text-[16px] font-black text-green-600">{treeScore}</span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-md overflow-hidden relative shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-green-300 via-green-500 to-green-700 rounded-md transition-all duration-1000 ease-out"
                  style={{ width: `${scorePercentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 활동 내역 - 소분 모임 */}
      <section className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
            {nickname}님의 소분 모임
          </h2>
        </div>
        {parties && parties.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-12">
            {parties.map((party: any) => (
              <PartyCard key={party.id} party={party} />
            ))}
          </div>
        ) : (
          <div className="py-24 text-center bg-white rounded-lg border-2 border-gray-50 text-gray-400 font-bold text-lg">
            아직 생성한 모임이 없습니다.
          </div>
        )}
      </section>

      {/* 활동 내역 - 작성한 글 */}
      <section className="flex flex-col gap-8 mb-20">
        <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
          {nickname}님의 글
        </h2>
        <div className="py-24 text-center bg-white rounded-lg border-2 border-gray-50 text-gray-400 font-bold text-lg">
          작성한 게시글이 없습니다.
        </div>
      </section>
    </div>
  );
}
