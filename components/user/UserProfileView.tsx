"use client";

import Image from "next/image";
import Link from "next/link";
import PartyCard from "@/components/main/PartyCard";
import { Language } from "@/app/common/types";
import { useLanguage } from "@/app/hooks/LanguageContext";
import { useSearchParams } from "next/navigation";
import { useState, type KeyboardEvent } from "react";
import { useUser, type UserProfile } from "@/app/hooks/UserContext";
import AppSettings from "@/components/common/AppSettings";
import ProfileEditor, { type ProfileSection } from "@/components/user/ProfileEditor";

interface PartySummary {
  id: number;
  title: string;
  content: string;
  storeName: string;
  addressKo?: string;
  addressJp?: string;
  meetDate: string;
  status: string;
  thumbnailImage?: string | null;
  host?: { nickname: string; nickname_jp?: string | null; profileImage?: string };
}

interface UserProfileViewProps {
  user: UserProfile;
  parties: PartySummary[];
  lang: Language;
}

export default function UserProfileView({ user, parties, lang }: UserProfileViewProps) {
  const { texts } = useLanguage();
  const { user: currentUser } = useUser();
  const searchParams = useSearchParams();
  const [editor, setEditor] = useState<ProfileSection | null>(null);
  const [activity, setActivity] = useState<"parties" | "posts">("parties");
  const owner = currentUser?.id === user.id;
  const profile = owner ? currentUser : user;
  const needsAccountNumber = owner && searchParams.get("error") === "accountNumber";
  const selectedSection = editor || (needsAccountNumber ? "bank" : null);
  const japanese = lang === Language.japanese;
  const nickname = japanese && profile.nickname_jp ? profile.nickname_jp : profile.nickname;
  const rawScore = Number(profile.treeScore ?? 50);
  const treeScore = Number.isFinite(rawScore) ? rawScore : 50;
  const scorePercentage = Math.min(Math.max(treeScore, 0), 100);
  const registeredAccount = !!(currentUser?.bankName && currentUser?.accountNumber && currentUser?.accountHolder);
  const copy = japanese ? {
    page: "マイページ", edit: "プロフィール編集", bank: "振込先口座", registered: "登録済み", missing: "未登録",
    register: "登録する", editBank: "変更する", parties: "小分け会", posts: "投稿", activities: "活動履歴",
    noParties: "まだ小分け会がありません", partyHint: "一緒に買い物する仲間を探してみましょう。",
    postHint: "投稿はコミュニティで確認できます。", community: "コミュニティへ",
  } : {
    page: "마이페이지", edit: "정보 수정", bank: "정산 계좌", registered: "등록됨", missing: "미등록",
    register: "등록하기", editBank: "수정하기", parties: "소분 모임", posts: "작성한 글", activities: "활동 내역",
    noParties: "아직 소분 모임이 없어요", partyHint: "함께 장볼 모임을 찾아보세요.",
    postHint: "작성한 글은 커뮤니티에서 확인할 수 있어요.", community: "커뮤니티로 이동",
  };

  function closeEditor() {
    setEditor(null);
    if (needsAccountNumber) {
      const url = new URL(window.location.href);
      url.searchParams.delete("error");
      window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    }
  }

  function moveActivity(event: KeyboardEvent<HTMLButtonElement>) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === "Home" ? "parties" : event.key === "End" ? "posts" : activity === "parties" ? "posts" : "parties";
    setActivity(next);
    document.getElementById(`profile-activity-${next}`)?.focus();
  }

  const getTreeLevel = (score: number) => {
    if (score < 20) return { name: texts.userPage.levels.soil, emoji: "🪨", color: "text-orange-700", bg: "bg-orange-50", bar: "from-orange-300 via-orange-500 to-orange-700" };
    if (score < 50) return { name: texts.userPage.levels.seed, emoji: "🫘", color: "text-amber-700", bg: "bg-amber-50", bar: "from-green-300 via-green-500 to-green-700" };
    if (score < 60) return { name: texts.userPage.levels.sprout, emoji: "🌱", color: "text-green-600", bg: "bg-green-50", bar: "from-green-300 via-green-500 to-green-700" };
    if (score < 70) return { name: texts.userPage.levels.sapling, emoji: "🪴", color: "text-green-700", bg: "bg-green-50", bar: "from-green-300 via-green-500 to-green-700" };
    if (score < 80) return { name: texts.userPage.levels.tree, emoji: "🌳", color: "text-green-800", bg: "bg-green-100", bar: "from-green-300 via-green-500 to-green-700" };
    return { name: texts.userPage.levels.forest, emoji: "🏞️", color: "text-emerald-700", bg: "bg-emerald-50", bar: "from-green-400 via-green-600 to-emerald-700" };
  };

  const level = getTreeLevel(treeScore);


  return (
    <div className="mx-auto flex w-full min-w-0 max-w-4xl flex-col gap-6 pb-8">
      <p className="text-xs font-medium text-gray-500">{copy.page}</p>
      <section className="rounded-[20px] border border-gray-200/80 bg-white px-5 pt-6 sm:px-8 sm:pt-8">
        <div className="grid grid-cols-[64px_minmax(0,1fr)] items-start gap-x-4 gap-y-5 sm:grid-cols-[96px_minmax(0,1fr)_auto] sm:items-center sm:gap-x-6">
          <div className="relative h-16 w-16 overflow-hidden rounded-full border border-green-50 bg-gray-50/40 sm:h-24 sm:w-24">
            <Image src={profile.profileImage || "/images/gachimura_logo.png"} alt={japanese ? "プロフィール画像" : "프로필 사진"} fill className={profile.profileImage ? "object-cover" : "object-contain p-2 sm:p-3"} />
          </div>
          <div className="min-w-0">
            <h1 className="break-words text-xl font-extrabold tracking-tight text-gray-900 sm:text-2xl">{nickname}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2.5">
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold sm:text-xs ${level.bg} ${level.color}`}><span>{level.emoji}</span>{level.name}</span>
              <span className="text-[10px] text-gray-400 sm:text-xs">{texts.userPage.reviewsCount.replace("{count}", String(profile.reviewsCount || 0))}</span>
            </div>
            <div className="mt-4 max-w-xs">
              <div className="mb-1.5 flex items-center justify-between text-[10px] text-gray-400 sm:text-xs"><span>{texts.userPage.treeScore}</span><strong className="text-sm text-green-700">{treeScore}</strong></div>
              <div className="h-1.5 overflow-hidden rounded-full bg-gray-100"><div className={`h-full rounded-full bg-gradient-to-r ${level.bar}`} style={{ width: `${scorePercentage}%` }} /></div>
            </div>
          </div>
          {owner && <button onClick={() => setEditor("basic")} className="col-span-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-green-100 bg-green-50/40 px-4 py-2.5 text-xs font-semibold text-[#166534] hover:bg-green-50 sm:col-span-1 sm:self-start sm:border-gray-200 sm:bg-white">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m14 5 5 5M5 16l-1 4 4-1L20 7a2 2 0 0 0-4-4ZM14 20h6" /></svg>{copy.edit}
          </button>}
        </div>
        {owner ? <div className="mt-6 flex items-center justify-between border-t border-gray-100 py-3 sm:py-4">
          <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50 text-gray-500"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 10h18M7 15h4"/></svg></span><span className="font-medium text-gray-700">{copy.bank}</span><span className={registeredAccount ? "text-[10px] text-green-600" : "text-[10px] text-amber-600"}>• {registeredAccount ? copy.registered : copy.missing}</span></div>
          <button onClick={() => setEditor("bank")} className="inline-flex min-h-11 shrink-0 items-center gap-1 pl-3 text-xs font-semibold text-[#166534]">{registeredAccount ? copy.editBank : copy.register}<span aria-hidden="true">›</span></button>
        </div> : <div className="h-6" />}
      </section>

      <section aria-label={copy.activities}>
        <div role="tablist" aria-label={copy.activities} className="mb-4 flex gap-6 border-b border-gray-200/80">
          {(["parties", "posts"] as const).map(section => <button key={section} id={`profile-activity-${section}`} type="button" role="tab" aria-selected={activity === section} aria-controls={`profile-content-${section}`} tabIndex={activity === section ? 0 : -1} onKeyDown={moveActivity} onClick={() => setActivity(section)} className={`inline-flex min-h-11 items-center gap-2 border-b-2 pb-3 text-sm font-semibold ${activity === section ? "border-[#166534] text-[#166534]" : "border-transparent text-gray-400"}`}>{copy[section]}{section === "parties" && <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-400">{parties.length}</span>}</button>)}
        </div>
        <div id="profile-content-parties" role="tabpanel" aria-labelledby="profile-activity-parties" hidden={activity !== "parties"}>
          {parties.length ? <div className="grid grid-cols-1 gap-x-6 gap-y-9 sm:grid-cols-2 md:grid-cols-3">{parties.map(party => <PartyCard key={party.id} party={party} />)}</div> : <div className="flex min-h-40 flex-col items-center justify-center rounded-2xl border border-gray-200/80 bg-white px-4 py-7 text-center"><span className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-green-50 text-green-300"><svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M5 9h14l-1 11H6ZM9 10V7a3 3 0 0 1 6 0v3"/></svg></span><p className="text-sm font-medium text-gray-600">{copy.noParties}</p><p className="mt-1 text-xs text-gray-400">{copy.partyHint}</p></div>}
        </div>
        <div id="profile-content-posts" role="tabpanel" aria-labelledby="profile-activity-posts" hidden={activity !== "posts"} className="rounded-2xl border border-gray-200/80 bg-white px-4 py-9 text-center">
          <p className="text-sm text-gray-500">{copy.postHint}</p><Link href="/community" className="mt-3 inline-flex min-h-11 items-center text-xs font-semibold text-[#166534]">{copy.community} ›</Link>
        </div>
      </section>

      {owner && <AppSettings />}
      {owner && selectedSection && <ProfileEditor key={currentUser.id} user={currentUser} lang={lang} initialSection={selectedSection} onClose={closeEditor} />}
    </div>
  );
}
