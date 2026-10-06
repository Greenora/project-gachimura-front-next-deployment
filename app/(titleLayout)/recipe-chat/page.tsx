"use client";

import { useState } from "react";
import { useLanguage } from "@/app/hooks/LanguageContext";
import { Language } from "@/app/common/types";
import IngredientScanner from "@/components/recipe-chat/IngredientScanner";
import RecipeChatContainer from "@/components/recipe-chat/RecipeChatContainer";
import { API_CONFIG } from "@/config/api";

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
  const triggerRecipeRecommendation = async (targetIngredients: string[], fromImage: boolean = false, imageUrl?: string, userMessageText?: string) => {
    setIsChatLoading(true);

    try {
      const defaultMessage = lang === Language.japanese 
        ? "この食材で簡単な料理をおすすめして"
        : "이 재료들로 간단하게 만들 수 있는 요리 추천해줘";

      const res = await fetch(`${API_CONFIG.PUBLIC_BASE_URL}/recipe-chat/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ingredients: targetIngredients,
          message: userMessageText || defaultMessage,
          lang: lang === Language.japanese ? "japanese" : "korean",
        }),
      });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      const data = await res.json();

      const aiMsg: Message = {
        id: Math.random().toString(),
        sender: "ai",
        text: data.replyText || (lang === Language.japanese ? "おすすめのレシピです！" : "추천 레시피입니다!"),
        recipes: data.recipes,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      console.error("AI Recipe Error:", error);
      const errorMsg: Message = {
        id: Math.random().toString(),
        sender: "ai",
        text: lang === Language.japanese 
          ? "エラーが発生しました。もう一度お試しください。" 
          : "레시피를 가져오는데 실패했습니다. 잠시 후 다시 시도해주세요.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsChatLoading(false);
    }
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
    triggerRecipeRecommendation(updated, true, undefined, userMsg.text);
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
    triggerRecipeRecommendation(ingredients, false, undefined, userMsg.text);
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
    triggerRecipeRecommendation(ingredients.length > 0 ? ingredients : ["임의 재료"], false, undefined, messageText);
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
