"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/app/hooks/LanguageContext";
import { clientFetch } from "@/app/hooks/useClientFetch";
import { useDateFormatter } from "@/app/hooks/useDateFormatter";
import { toast } from "react-hot-toast";

const EMOJIS = [
  { icon: "😭", scoreValue: -4 },
  { icon: "😢", scoreValue: -2 },
  { icon: "🙂", scoreValue: 2 },
  { icon: "😍", scoreValue: 4 },
];

interface ReviewPageContentProps {
  partyId: number;
}

export default function ReviewPageContent({ partyId }: ReviewPageContentProps) {
  const router = useRouter();
  const { texts } = useLanguage();
  const { formatFullDate } = useDateFormatter();

  const [party, setParty] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hasAlreadyReviewed, setHasAlreadyReviewed] = useState(false);

  // 평가 점수 상태
  const [score1, setScore1] = useState<number | null>(null);
  const [score2, setScore2] = useState<number | null>(null);
  const [score3, setScore3] = useState<number | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [partyData, membersData, userData, reviewStatus] = await Promise.all([
          clientFetch(`/parties/${partyId}`),
          clientFetch(`/party-members/${partyId}`),
          clientFetch(`/users/profile`),
          clientFetch(`/reviews/check/${partyId}`),
        ]);
        setParty(partyData);
        setMembers(membersData.filter((m: any) => m.status === "APPROVED"));
        setCurrentUser(userData);
        
        // 이미 평가했으면 true로 설정
        if (reviewStatus?.hasReviewed) {
          setHasAlreadyReviewed(true);
          toast.error("이미 이 모임에 대한 평가를 완료했습니다.");
          setTimeout(() => router.push("/"), 1500);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    }
    if (partyId) fetchData();
  }, [partyId, router]);

  const getEmojiLabel = (scoreValue: number): string => {
    switch (scoreValue) {
      case -4:
        return texts.reviewPage.veryUnsatisfied;
      case -2:
        return texts.reviewPage.unsatisfied;
      case 2:
        return texts.reviewPage.satisfied;
      case 4:
        return texts.reviewPage.verySatisfied;
      default:
        return "";
    }
  };

  const handleSubmit = async () => {
    if (score1 === null || score2 === null || score3 === null) {
      toast.error(texts.reviewPage.allFieldsRequired);
      return;
    }

    // 각 질문의 점수 평균 계산
    const averageScoreRaw = (score1 + score2 + score3) / 3;
    
    // 백엔드는 -4, -2, 0, 2, 4 만 허용하므로, 계산된 평균과 가장 가까운 유효한 점수로 맞춤 (Snap)
    const validScores = [-4, -2, 0, 2, 4];
    const averageScore = validScores.reduce((prev, curr) => 
      Math.abs(curr - averageScoreRaw) < Math.abs(prev - averageScoreRaw) ? curr : prev
    );

    setSubmitting(true);
    try {
      // 나를 제외한 모든 멤버에게 동일한 점수 부여 (기본 로직)
      const reviewRequests = members
        .filter((m: any) => m.userId !== currentUser?.id)
        .map((m: any) => 
          clientFetch("/reviews", {
            method: 'POST',
            body: {
              partyId,
              revieweeId: m.userId,
              score: averageScore
            }
          })
        );

      if (reviewRequests.length === 0) {
        toast.success(texts.reviewPage.success);
        setSubmitting(false);
        setTimeout(() => router.push("/home"), 1500);
        return;
      }

      await Promise.all(reviewRequests);
      toast.success(texts.reviewPage.success);
      setSubmitting(false);
      setTimeout(() => router.push("/home"), 1500);
    } catch (error) {
      console.error("평가 제출 실패:", error);
      toast.error(texts.reviewPage.submitError);
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-[calc(100vh-72px)]">{texts.auth.loading}</div>;
  if (!party) return <div className="flex items-center justify-center h-[calc(100vh-72px)]">{texts.reviewPage.notFound}</div>;

  return (
    <div className="max-w-4xl mx-auto px-6 py-16 flex flex-col items-center">
      {/* 타이틀 영역 */}
      <h1 className="text-3xl font-black text-gray-900 mb-4 text-center">
        {party.title} {texts.reviewPage.title}
      </h1>
      <p className="text-[14px] text-gray-500 font-bold mb-16 text-center">
        {texts.chat.date} {formatFullDate(party.meetingDate)} <span className="mx-2 opacity-20">|</span> {party.location?.name}
      </p>

      {/* 구분선 */}
      <div className="w-full border-t border-gray-100 mb-20"></div>

      {/* 질문 리스트 */}
      <div className="w-full space-y-20 max-w-2xl">
        {/* 질문 1 */}
        <div className="flex flex-col items-center gap-8">
          <h2 className="text-[18px] font-black text-gray-800 text-center">
            {texts.reviewPage.question1}
          </h2>
          <div className="flex gap-10">
            {EMOJIS.map((emoji) => (
              <button
                key={emoji.scoreValue}
                onClick={() => setScore1(emoji.scoreValue)}
                className={`text-4xl transition-all hover:scale-125 ${score1 === emoji.scoreValue ? "scale-125 opacity-100 grayscale-0" : "opacity-40 grayscale hover:grayscale-0"}`}
                title={getEmojiLabel(emoji.scoreValue)}
              >
                {emoji.icon}
              </button>
            ))}
          </div>
        </div>

        {/* 질문 2 */}
        <div className="flex flex-col items-center gap-8">
          <h2 className="text-[18px] font-black text-gray-800 text-center">
            {texts.reviewPage.question2}
          </h2>
          <div className="flex gap-10">
            {EMOJIS.map((emoji) => (
              <button
                key={emoji.scoreValue}
                onClick={() => setScore2(emoji.scoreValue)}
                className={`text-4xl transition-all hover:scale-125 ${score2 === emoji.scoreValue ? "scale-125 opacity-100 grayscale-0" : "opacity-40 grayscale hover:grayscale-0"}`}
                title={getEmojiLabel(emoji.scoreValue)}
              >
                {emoji.icon}
              </button>
            ))}
          </div>
        </div>

        {/* 질문 3 */}
        <div className="flex flex-col items-center gap-8">
          <h2 className="text-[18px] font-black text-gray-800 text-center">
            {texts.reviewPage.question3}
          </h2>
          <div className="flex gap-10">
            {EMOJIS.map((emoji) => (
              <button
                key={emoji.scoreValue}
                onClick={() => setScore3(emoji.scoreValue)}
                className={`text-4xl transition-all hover:scale-125 ${score3 === emoji.scoreValue ? "scale-125 opacity-100 grayscale-0" : "opacity-40 grayscale hover:grayscale-0"}`}
                title={getEmojiLabel(emoji.scoreValue)}
              >
                {emoji.icon}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 제출 버튼 */}
      <div className="mt-32 w-full flex flex-col items-center gap-4">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className={`w-full max-w-md bg-[#33612E] text-white py-5 rounded-full text-lg font-black shadow-xl shadow-green-900/10 transition-all hover:scale-[1.02] active:scale-95 ${submitting ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {submitting ? texts.auth.loading : texts.reviewPage.submit}
        </button>

        <p className="text-[12px] text-gray-400 font-bold">
          {texts.reviewPage.footer}
        </p>
      </div>
    </div>
  );
}
