"use client";

import { useState } from "react";
import { useLanguage } from "@/app/hooks/LanguageContext";
import { Language } from "@/app/common/types";
import IngredientScanner from "@/components/recipe-chat/IngredientScanner";
import RecipeChatContainer from "@/components/recipe-chat/RecipeChatContainer";

interface Recipe {
  title: string;
  time: string;
  difficulty: string;
  matchRate: string;
  ingredients: string[];
  instructions: string[];
}

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  image?: string;
  recipes?: Recipe[];
  timestamp: Date;
}

export default function RecipeChatPage() {
  const { lang } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "ai",
      text:
        lang === Language.japanese
          ? "こんにちは！ Gachimura AI Cook です. 🍳\n冷蔵庫の写真を引き受けてアップロードするか、お기지 재료를 입력해 주시면 지금 바로 요리할 수 있는 최적의 레시피를 바로 추천해 드립니다!"
          : "안녕하세요! 가치무라 AI 레시피 상담소입니다. 🍳\n냉장고 사진을 찍어 올려주시거나 가지고 계신 식재료들을 알려주시면, 지금 바로 만들어 먹을 수 있는 최고의 요리 레시피를 추천해 드릴게요!",
      timestamp: new Date(),
    },
  ]);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [ingredients, setIngredients] = useState<string[]>([]);

  // AI 레시피 추천 처리 공통 함수
  const triggerRecipeRecommendation = (targetIngredients: string[], fromImage: boolean = false, imageUrl?: string) => {
    setIsChatLoading(true);

    // AI 레시피 생성 시뮬레이션 (2.5초 대기)
    setTimeout(() => {
      const mockRecipes: Recipe[] = [
        {
          title: lang === Language.japanese ? "超簡単！ふんわりトマト卵炒め" : "초간단! 보들보들 토마토 달걀 볶음",
          time: "10 min",
          difficulty: lang === Language.japanese ? "初級" : "초급",
          matchRate: "95%",
          ingredients:
            lang === Language.japanese
              ? ["トマト 2個", "卵 3個", "刻みネギ", "オイスターソース 1T", "ごま油"]
              : ["토마토 2개", "달걀 3개", "대파 1/2대", "굴소스 1큰술", "참기름 1/2큰술"],
          instructions:
            lang === Language.japanese
              ? [
                  "トマトはくし形に切り、卵は器にといておきます。",
                  "フライパンに油を引き, とき卵を入れて素早く炒め、一度取り出します。",
                  "同じフライパンでネギとトマトを炒め、しんなりしたら卵を戻します。",
                  "オイス터소스와 참기름을 더해 완성합니다."
                ]
              : [
                  "토마토는 한입 크기로 썰고 달걀은 미리 풀어둡니다.",
                  "팬에 식용유를 두르고 달걀을 부어 스크램블 하듯 부드럽게 익힌 뒤 그릇에 덜어둡니다.",
                  "같은 팬에 송송 썬 대파와 토마토를 볶아 즙이 살짝 나올 때까지 익혀줍니다.",
                  "달걀을 다시 넣고 굴소스와 참기름을 더해 가볍게 섞어 완성합니다."
                ]
        },
        {
          title: lang === Language.japanese ? "네기 듬뿍 삼겹살 볶음" : "대파 송송 삼겹살 볶음",
          time: "15 min",
          difficulty: lang === Language.japanese ? "初級" : "초급",
          matchRate: "85%",
          ingredients:
            lang === Language.japanese
              ? ["豚バラ肉 200g", "刻みネギ 1本", "醤油 1.5T", "砂糖 1T", "おろしにんにく"]
              : ["삼겹살 200g", "대파 1대", "간장 1.5큰술", "설탕 1큰술", "다진마늘 1/2큰술"],
          instructions:
            lang === Language.japanese
              ? [
                  "豚バラ肉は一口大に切り、フライパンでカリッと炒めます。",
                  "余분 기름을 닦아내고 마늘과 네기를 볶아 향을 냅니다.",
                  "간장, 설탕을 더해 맛이 고루 배도록 볶아냅니다."
                ]
              : [
                  "삼겹살을 한입 크기로 썰어 팬에 노릇하게 구워줍니다.",
                  "기름을 살짝 닦아낸 뒤 다진 마늘과 큼직하게 썬 대파를 넣고 볶습니다.",
                  "간장과 설탕을 넣어 간을 맞춘 후 센 불에서 빠르게 볶아 완성합니다."
                ]
        }
      ];

      const aiMsg: Message = {
        id: Math.random().toString(),
        sender: "ai",
        text:
          lang === Language.japanese
            ? `写真と食材 (${targetIngredients.join(", ")}) をもとに、おすすめのレシピをお持ちしました！ 🍽️`
            : `스캔 및 등록된 식재료 (${targetIngredients.join(", ")})를 바탕으로 지금 만들어 드시기 가장 좋은 추천 요리 레시피를 준비했습니다! 🍽️`,
        recipes: mockRecipes,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsChatLoading(false);
    }, 2500);
  };

  // 식재료 스캔 완료 시 콜백
  const handleAnalyzeComplete = (detected: string[]) => {
    // 1. 이미지 및 식재료 상태 업데이트
    const updated = Array.from(new Set([...ingredients, ...detected]));
    setIngredients(updated);
    setIsAnalyzing(false);

    // 2. 채팅 화면에 사용자 메시지 자동 등록
    const userMsg: Message = {
      id: Math.random().toString(),
      sender: "user",
      text:
        lang === Language.japanese
          ? `写真をスキャンしました。検出された食材: ${detected.join(", ")}`
          : `사진 스캔 완료! 감지된 재료: ${detected.join(", ")} (이 재료들로 레시피 추천해줘)`,
      image: selectedImage || undefined,
      timestamp: new Date(),
    };
    
    // 3. 사진 슬롯 비우기 및 레시피 분석 트리거
    setSelectedImage(null);
    setMessages((prev) => [...prev, userMsg]);
    
    // 4. 레시피 추천 자동 시작
    triggerRecipeRecommendation(updated, true);
  };

  // 태그 수동 추가 완료 후 추천 요청 핸들러
  const handleRecommendRequest = () => {
    if (ingredients.length === 0 || isChatLoading) return;

    // 사용자 메세지 추가
    const userMsg: Message = {
      id: Math.random().toString(),
      sender: "user",
      text:
        lang === Language.japanese
          ? `登録した食材 (${ingredients.join(", ")}) で料理を推薦して`
          : `내가 등록한 재료들 (${ingredients.join(", ")})로 어울리는 요리 추천해줘`,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    triggerRecipeRecommendation(ingredients, false);
  };

  // 사용자 직접 채팅 입력 전송 핸들러
  const handleSendMessage = (messageText: string) => {
    const userMsg: Message = {
      id: Math.random().toString(),
      sender: "user",
      text: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    triggerRecipeRecommendation(ingredients.length > 0 ? ingredients : ["토마토", "달걀"], false);
  };

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-8 min-h-[calc(100vh-72px)] animate-in fade-in duration-300">
      {/* 왼쪽: 식재료 스캔 및 보관함 패널 */}
      <IngredientScanner
        lang={lang}
        selectedImage={selectedImage}
        setSelectedImage={setSelectedImage}
        isAnalyzing={isAnalyzing}
        setIsAnalyzing={setIsAnalyzing}
        ingredients={ingredients}
        setIngredients={setIngredients}
        onAnalyzeComplete={handleAnalyzeComplete}
        onRecommendRequest={handleRecommendRequest}
      />

      {/* 오른쪽: AI 레시피 상담 챗봇 영역 */}
      <RecipeChatContainer
        lang={lang}
        messages={messages}
        onSendMessage={handleSendMessage}
        isChatLoading={isChatLoading}
        ingredients={ingredients}
      />
    </div>
  );
}
