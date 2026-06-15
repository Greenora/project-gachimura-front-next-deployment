"use client";

import Image from "next/image";
import PartyCard from "@/components/main/PartyCard";
import { Language } from "@/app/common/types";
import { useLanguage } from "@/app/hooks/LanguageContext";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { clientFetch } from "@/app/hooks/useClientFetch";

const BANK_LIST = [
  { code: "089", name: "토스뱅크" },
  { code: "090", name: "카카오뱅크" },
  { code: "004", name: "KB국민은행" },
  { code: "088", name: "신한은행" },
  { code: "020", name: "우리은행" },
  { code: "081", name: "하나은행" },
  { code: "011", name: "NH농협은행" },
  { code: "003", name: "IBK기업은행" },
  { code: "071", name: "우체국" },
  { code: "045", name: "새마을금고" },
  { code: "048", name: "신협" },
  { code: "032", name: "부산은행" },
  { code: "031", name: "대구은행" },
];

interface UserProfileViewProps {
  user: any;
  parties: any[];
  lang: Language;
}

export default function UserProfileView({ user, parties, lang }: UserProfileViewProps) {
  const { texts } = useLanguage();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // 수정할 필드 상태들
  const [editNickname, setEditNickname] = useState(user.nickname || "");
  const [editNicknameJp, setEditNicknameJp] = useState(user.nickname_jp || "");
  const [editBankName, setEditBankName] = useState(user.bankName || "");
  const [editBankCode, setEditBankCode] = useState(user.bankCode || "");
  const [editAccountNumber, setEditAccountNumber] = useState(user.accountNumber || "");
  const [editAccountHolder, setEditAccountHolder] = useState(user.accountHolder || "");
  const [isSaving, setIsSaving] = useState(false);

  // 로그인한 사용자 확인
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const data = await clientFetch("/users/profile");
        setCurrentUser(data);
        if (data.id === user.id) {
          setEditNickname(data.nickname || "");
          setEditNicknameJp(data.nickname_jp || "");
          setEditBankName(data.bankName || "");
          setEditBankCode(data.bankCode || "");
          setEditAccountNumber(data.accountNumber || "");
          setEditAccountHolder(data.accountHolder || "");
        }
      } catch (error) {
        console.log("Not logged in");
      }
    };
    fetchCurrentUser();
  }, [user.id]);

  // 모임 만들기 등에서 계좌정보 미입력으로 리다이렉트 되었을 때 경고 처리
  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam === "accountNumber") {
      toast.error(
        lang === Language.japanese
          ? "精算および集まり登録のために、口座情報を入力してください。"
          : "정산 및 모임 생성을 위해 계좌 정보를 입력해주세요!",
        {
          duration: 6000,
          id: "account-number-required-toast",
        }
      );
      // 자동으로 모달 열어주기
      setIsEditModalOpen(true);
      
      // 주소창에서 에러 파라미터 지우기
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, [searchParams, lang]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);

    try {
      const response = await clientFetch("/users/profile", {
        method: "PATCH",
        body: {
          nickname: editNickname,
          nickname_jp: editNicknameJp || null,
          bankCode: editBankCode || null,
          bankName: editBankName || null,
          accountNumber: editAccountNumber || null,
          accountHolder: editAccountHolder || null,
        },
      });

      if (response.success) {
        toast.success(
          lang === Language.japanese ? "保存されました。" : "정보가 성공적으로 저장되었습니다!"
        );
        setIsEditModalOpen(false);
        router.refresh();
        window.location.reload();
      } else {
        toast.error(
          lang === Language.japanese ? "保存に失敗しました。" : "정보 저장에 실패했습니다."
        );
      }
    } catch (error) {
      console.error(error);
      toast.error(
        lang === Language.japanese ? "エラーが発生しました。" : "오류가 발생했습니다."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const nickname = lang === Language.japanese && user.nickname_jp ? user.nickname_jp : user.nickname;
  const treeScore = parseFloat(user.treeScore || "50.0");
  const scorePercentage = Math.min(Math.max(treeScore, 0), 100);

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
          <div className="flex flex-col md:flex-row md:items-center gap-3 justify-center md:justify-start">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">{nickname}</h1>
            {currentUser && currentUser.id === user.id && (
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="px-3 py-1.5 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors inline-flex items-center gap-1.5 self-center justify-center"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                {lang === Language.japanese ? "プロフィール編集" : "정보 수정"}
              </button>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <div className="items-center flex justify-center md:justify-start gap-3 mb-1">
              <div className={`flex items-center gap-1.5 px-3 py-1 ${level.bg} ${level.color} rounded-full text-[12px] font-bold`}>
                <span className="text-base">{level.emoji}</span>
                <span>{level.name}</span>
              </div>
              <div className="text-[12px] font-bold text-gray-400">
                {texts.userPage.reviewsCount.replace("{count}", String(user.reviewsCount || 0))}
              </div>
            </div>

            {/* 신뢰 바 */}
            <div className="flex flex-col gap-1.5 w-full max-w-xs mx-auto md:mx-0">
              <div className="flex justify-between items-end mb-0.5">
                <span className="text-[12px] font-bold text-gray-400">{texts.userPage.treeScore}</span>
                <span className={`text-[16px] font-black ${treeScore < 20 ? 'text-orange-600' : 'text-green-600'}`}>{treeScore}</span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-md overflow-hidden relative shadow-inner">
                <div
                  className={`h-full bg-gradient-to-r ${level.bar} rounded-md transition-all duration-1000 ease-out`}
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
            {texts.userPage.userParties.replace("{nickname}", nickname)}
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
            {texts.userPage.noParties}
          </div>
        )}
      </section>

      {/* 활동 내역 - 작성한 글 */}
      <section className="flex flex-col gap-8 mb-20">
        <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
          {texts.userPage.userPosts.replace("{nickname}", nickname)}
        </h2>
        <div className="py-24 text-center bg-white rounded-lg border-2 border-gray-50 text-gray-400 font-bold text-lg">
          {texts.userPage.noPosts}
        </div>
      </section>

      {/* 프로필 수정 모달 */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-black text-gray-900">
                {lang === Language.japanese ? "プロフィール編集" : "프로필 및 계좌 수정"}
              </h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSaveProfile} className="p-6 flex flex-col gap-4">
              {/* 닉네임 */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-500">
                  {lang === Language.japanese ? "ニックネーム" : "닉네임"}
                </label>
                <input
                  type="text"
                  required
                  value={editNickname}
                  onChange={(e) => setEditNickname(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 outline-none focus:border-green-600 text-sm text-black"
                />
              </div>

              {/* 일본어 닉네임 */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-500">
                  {lang === Language.japanese ? "ニックネーム (日本語) - 任意" : "닉네임 (일본어) - 선택"}
                </label>
                <input
                  type="text"
                  value={editNicknameJp}
                  onChange={(e) => setEditNicknameJp(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 outline-none focus:border-green-600 text-sm text-black"
                />
              </div>

              {/* 은행 선택 */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-500">
                  {lang === Language.japanese ? "銀行名" : "은행 선택"}
                </label>
                <select
                  value={editBankName}
                  onChange={(e) => {
                    const selectedName = e.target.value;
                    setEditBankName(selectedName);
                    const selectedBank = BANK_LIST.find((bank) => bank.name === selectedName);
                    setEditBankCode(selectedBank ? selectedBank.code : "");
                  }}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 outline-none focus:border-green-600 text-sm text-black bg-white"
                >
                  <option value="">{lang === Language.japanese ? "銀行を選択してください" : "은행을 선택해주세요"}</option>
                  {BANK_LIST.map((bank) => (
                    <option key={bank.code} value={bank.name}>
                      {bank.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 계좌 번호 */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-500">
                  {lang === Language.japanese ? "口座番号" : "계좌번호 (- 없이 입력)"}
                </label>
                <input
                  type="text"
                  required
                  pattern="[0-9]*"
                  inputMode="numeric"
                  value={editAccountNumber}
                  onChange={(e) => setEditAccountNumber(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder={lang === Language.japanese ? "ハイフンなしで入力" : "숫자만 입력해주세요"}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 outline-none focus:border-green-600 text-sm text-black"
                />
              </div>

              {/* 예금주 */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-500">
                  {lang === Language.japanese ? "口座名義" : "예금주명"}
                </label>
                <input
                  type="text"
                  required
                  value={editAccountHolder}
                  onChange={(e) => setEditAccountHolder(e.target.value)}
                  placeholder={lang === Language.japanese ? "口座名義を入力" : "예금주 실명을 입력해주세요"}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 outline-none focus:border-green-600 text-sm text-black"
                />
              </div>

              {/* 버튼 */}
              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-bold text-gray-700 transition-colors"
                >
                  {lang === Language.japanese ? "キャンセル" : "취소"}
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-3 rounded-lg bg-green-700 hover:bg-green-800 disabled:bg-gray-300 text-sm font-bold text-white transition-colors flex justify-center items-center gap-2"
                >
                  {isSaving && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  <span>{lang === Language.japanese ? "保存" : "저장"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
