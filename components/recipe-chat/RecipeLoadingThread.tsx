"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Language } from "@/app/common/types";

interface RecipeLoadingThreadProps {
  lang: Language;
}

export default function RecipeLoadingThread({ lang }: RecipeLoadingThreadProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);

  const steps = [
    {
      title: lang === Language.japanese ? "食材分析" : "식재료 분석",
      desc:
        lang === Language.japanese
          ? "冷蔵庫の食材の組み合わせと栄養バランスを計算しています."
          : "보유하신 식재료들의 조합과 영양·맛 밸런스를 계산하고 있습니다.",
    },
    {
      title: lang === Language.japanese ? "レシピ探索" : "레시피 탐색",
      desc:
        lang === Language.japanese
          ? "最適な調理法とベストな組み合わせを検索しています."
          : "식재료에 딱 맞는 최적의 요리법과 메뉴 조합을 찾고 있습니다.",
    },
    {
      title: lang === Language.japanese ? "手順設計" : "조리법 설계",
      desc:
        lang === Language.japanese
          ? "失敗しない火加減と簡単調理ステップを整理しています."
          : "실패 없는 불 조절과 누구나 따라 하기 쉬운 조리 단계를 구성 중입니다.",
    },
    {
      title: lang === Language.japanese ? "ガイド完成" : "가이드 완성",
      desc:
        lang === Language.japanese
          ? "分かりやすい調理ガイドとアドバイスをまとめています."
          : "상세한 조리 순서와 맞춤 팁을 최종 정리하고 있습니다.",
    },
  ];

  const cookingTips = [
    lang === Language.japanese
      ? "長ネギを油でじっくり炒めてネギ油を作ると、料理全体の風味が格段にアップします。"
      : "대파와 마늘을 먼저 기름에 살짝 볶아 파기름을 내면 풍미가 훨씬 깊어집니다.",
    lang === Language.japanese
      ? "卵料理は弱火でゆっくり火を通すとふわふわで柔らかい食感に仕上がります。"
      : "달걀 요리는 약불에서 은근하게 익혀야 촉촉하고 부드러운 식감이 살아납니다.",
    lang === Language.japanese
      ? "お肉は調理10分前に室温に戻すと、旨味や肉汁が逃げにくくなります。"
      : "고기는 조리 10분 전 실온에 꺼내두면 육즙 손실이 줄어들고 골고루 익습니다.",
    lang === Language.japanese
      ? "食材の水気をしっかり拭き取ると、油ハネを防ぎ香ばしく仕上がります。"
      : "볶음 요리를 할 땐 재료의 물기를 닦아내야 기름이 튀지 않고 고소하게 볶아집니다.",
  ];

  useEffect(() => {
    const stepTimer = setInterval(() => {
      setCurrentStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 1800);

    const tipTimer = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % cookingTips.length);
    }, 2500);

    return () => {
      clearInterval(stepTimer);
      clearInterval(tipTimer);
    };
  }, [cookingTips.length, steps.length]);

  return (
    <div className="flex gap-3 w-full max-w-[580px] self-start animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Gachimura AI Cook 공식 프로필 이미지 */}
      <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center shrink-0 overflow-hidden relative shadow-xs">
        <Image
          src="/images/gachimura_logo.png"
          alt="Gachimura AI Cook"
          fill
          className="object-contain p-0.5"
        />
      </div>

      {/* 로딩 메시지 카드 본문 (고정 너비 및 min-w-0 보장) */}
      <div className="flex flex-col gap-2 w-full min-w-0">
        <div className="bg-white border border-gray-200/80 rounded-2xl rounded-tl-none p-5 shadow-xs flex flex-col gap-4 w-full min-w-0">
          {/* 1. 헤더: 실시간 상태 라벨 */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-green-50 text-green-700 border border-green-200/60 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse" />
                {lang === Language.japanese ? "AI レシピ生成中" : "AI 레시피 생성 중"}
              </span>
              <span className="text-xs text-gray-400 font-medium hidden sm:inline">
                {lang === Language.japanese ? "リアルタイム分析" : "실시간 맞춤 분석"}
              </span>
            </div>

            <span className="text-[10px] font-bold text-gray-400 shrink-0">
              Step {currentStep + 1} / 4
            </span>
          </div>

          {/* 2. 현재 단계 안내 문구 (min-h-[64px]로 높이 고정) */}
          <div className="flex items-start gap-3 bg-gray-50/70 p-3.5 rounded-xl border border-gray-100 min-h-[64px] min-w-0">
            <div className="w-6 h-6 rounded-md bg-white border border-gray-200 flex items-center justify-center text-[11px] font-black text-green-700 shrink-0 shadow-2xs">
              0{currentStep + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-bold text-gray-900 truncate">
                  {steps[currentStep].title}
                </h4>
              </div>
              <p className="text-[11px] text-gray-600 font-medium mt-1 leading-relaxed">
                {steps[currentStep].desc}
              </p>
            </div>
          </div>

          {/* 3. 진행 단계 인디케이터 (스텝 트래커) */}
          <div className="grid grid-cols-4 gap-1.5 pt-1">
            {steps.map((st, idx) => {
              const isPast = idx < currentStep;
              const isCurrent = idx === currentStep;

              return (
                <div key={idx} className="flex flex-col items-center gap-1 min-w-0">
                  <div
                    className={`w-full h-1.5 rounded-full transition-all duration-500 ${
                      isPast
                        ? "bg-green-700"
                        : isCurrent
                        ? "bg-green-600 animate-pulse"
                        : "bg-gray-100"
                    }`}
                  />
                  <span
                    className={`text-[9px] font-bold truncate w-full text-center transition-colors ${
                      isCurrent
                        ? "text-green-700 font-extrabold"
                        : isPast
                        ? "text-gray-600"
                        : "text-gray-300"
                    }`}
                  >
                    {isPast ? "✓ " : ""}
                    {st.title}
                  </span>
                </div>
              );
            })}
          </div>

          {/* 4. 스켈레톤 레시피 카드 프리뷰 */}
          <div className="border border-dashed border-gray-200 bg-gray-50/40 rounded-xl p-3.5 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-14 bg-green-100 rounded-full animate-pulse" />
            </div>

            <div className="flex items-center gap-3 pt-1">
              <div className="h-3 w-16 bg-gray-200/70 rounded animate-pulse" />
              <div className="h-3 w-14 bg-gray-200/70 rounded animate-pulse" />
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="h-2.5 w-full bg-gray-200/60 rounded animate-pulse" />
              <div className="h-2.5 w-4/5 bg-gray-200/60 rounded animate-pulse" />
            </div>
          </div>

          {/* 5. 요리 상식 팁 배너 (h-8 고정 높이 및 w-full, truncate로 크기 변화 원천 방지) */}
          <div className="flex items-center gap-2 px-3 h-8 rounded-lg bg-gray-50 border border-gray-100 text-[10px] text-gray-500 font-medium w-full min-w-0 overflow-hidden">
            <span className="font-extrabold text-green-700 shrink-0">TIP</span>
            <span className="truncate flex-1 min-w-0 block">{cookingTips[tipIndex]}</span>
          </div>
        </div>

        {/* 하단 생성 안내 문구 */}
        <span className="text-[9px] text-gray-400 font-medium self-start pl-1 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse" />
          {lang === Language.japanese ? "レシピを生成しています..." : "AI가 레시피를 작성하고 있습니다..."}
        </span>
      </div>
    </div>
  );

}
