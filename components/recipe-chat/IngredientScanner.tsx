"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Language } from "@/app/common/types";

interface IngredientScannerProps {
  lang: Language;
  selectedImage: string | null;
  setSelectedImage: (img: string | null) => void;
  isAnalyzing: boolean;
  setIsAnalyzing: (analyzing: boolean) => void;
  ingredients: string[];
  setIngredients: React.Dispatch<React.SetStateAction<string[]>>;
  onAnalyzeComplete: (detected: string[]) => void;
  onRecommendRequest?: () => void;
}

export default function IngredientScanner({
  lang,
  selectedImage,
  setSelectedImage,
  isAnalyzing,
  setIsAnalyzing,
  ingredients,
  setIngredients,
  onAnalyzeComplete,
  onRecommendRequest,
}: IngredientScannerProps) {
  const [tagInput, setTagInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyzeImage = () => {
    if (!selectedImage || isAnalyzing) return;
    setIsAnalyzing(true);

    setTimeout(() => {
      const detected =
        lang === Language.japanese
          ? ["トマト", "卵", "ネギ", "豚肉"]
          : ["토마토", "달걀", "대파", "삼겹살"];
      onAnalyzeComplete(detected);
    }, 2500);
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTag = tagInput.trim();
    if (cleanTag && !ingredients.includes(cleanTag)) {
      setIngredients((prev) => [...prev, cleanTag]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setIngredients((prev) => prev.filter((t) => t !== tag));
  };

  return (
    <div className="w-full md:w-[350px] lg:w-[400px] flex flex-col gap-6 md:shrink-0">
      {/* 이미지 업로드 카드 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col gap-4">
        <h2 className="text-md font-black text-gray-900 flex items-center gap-2">
          📸 <span>{lang === Language.japanese ? "冷蔵庫の写真分析" : "냉장고 사진 분석"}</span>
        </h2>

        <p className="text-xs text-gray-500 font-bold leading-relaxed">
          {lang === Language.japanese
            ? "冷蔵庫の食材を撮影してアップロードすると、AI가 자동으로 식재료를 인식합니다."
            : "냉장고나 식재료 사진을 올려주시면 AI가 어떤 식재료가 남아있는지 자동으로 찾아냅니다."}
        </p>

        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-green-600 hover:bg-green-50/20 transition-all group relative overflow-hidden min-h-[180px]"
        >
          {selectedImage ? (
            <>
              <Image
                src={selectedImage}
                alt="selected"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-xs font-bold text-white bg-green-700/80 px-3 py-1.5 rounded-full">
                  {lang === Language.japanese ? "写真変更" : "사진 변경하기"}
                </span>
              </div>
              {isAnalyzing && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3 z-10 text-white">
                  <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-bold animate-pulse">
                    {lang === Language.japanese ? "写真を分析중..." : "이미지 분석중..."}
                  </span>
                  <div className="absolute left-0 right-0 h-1 bg-green-400 animate-[bounce_2s_infinite]" />
                </div>
              )}
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-green-50 group-hover:text-green-600 transition-colors">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                  <circle cx="12" cy="13" r="4"></circle>
                </svg>
              </div>
              <span className="text-xs font-black text-gray-600 group-hover:text-green-700 transition-colors">
                {lang === Language.japanese ? "写真を選択またはドラッグ" : "사진 올리기 / 촬영하기"}
              </span>
              <span className="text-[10px] text-gray-400 font-bold">
                PNG, JPG (최대 10MB)
              </span>
            </>
          )}
        </div>

        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleImageChange}
          className="hidden"
        />

        {selectedImage && !isAnalyzing && (
          <button
            onClick={handleAnalyzeImage}
            className="w-full py-3 rounded-xl bg-green-700 hover:bg-green-800 text-sm font-bold text-white transition-colors flex justify-center items-center gap-2 shadow-md animate-in fade-in slide-in-from-bottom-2 duration-200"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
            </svg>
            <span>{lang === Language.japanese ? "AIで食材を分析" : "AI 재료 스캔 시작"}</span>
          </button>
        )}
      </div>

      {/* 식재료 보관함 (태그 수동 추가) */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col gap-4">
        <h2 className="text-md font-black text-gray-900 flex items-center gap-2">
          🥕 <span>{lang === Language.japanese ? "保有食材リスト" : "보유 식재료 관리"}</span>
        </h2>

        <p className="text-xs text-gray-500 font-bold leading-relaxed">
          {lang === Language.japanese
            ? "分析された食材に加え, 직접 키워드를 입력해 식재료를 추가할 수 있습니다."
            : "사진에서 인식된 재료 외에, 가지고 계신 재료를 직접 입력해 보관함에 넣을 수 있습니다."}
        </p>

        {/* 태그 입력 폼 */}
        <form onSubmit={handleAddTag} className="flex gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder={lang === Language.japanese ? "例: 牛肉, たまねぎ" : "예: 양파, 우유, 버터"}
            className="flex-1 px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-green-600 text-xs text-black"
          />
          <button
            type="submit"
            className="px-3 rounded-lg bg-gray-950 hover:bg-gray-800 text-white text-xs font-bold transition-colors"
          >
            {lang === Language.japanese ? "追加" : "추가"}
          </button>
        </form>

        {/* 식재료 태그 리스트 */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-1.5 min-h-[60px] p-3 rounded-xl bg-gray-50 border border-gray-100">
            {ingredients.length > 0 ? (
              ingredients.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-gray-200 text-xs font-bold text-gray-700 shadow-sm transition-all hover:border-red-300 hover:text-red-600 cursor-pointer"
                  onClick={() => handleRemoveTag(tag)}
                  title={lang === Language.japanese ? "クリックで削除" : "클릭하면 제거됩니다"}
                >
                  <span>{tag}</span>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </span>
              ))
            ) : (
              <span className="text-[11px] text-gray-400 font-bold m-auto">
                {lang === Language.japanese ? "登録された食材がありません" : "식재료를 추가해 주세요"}
              </span>
            )}
          </div>

          {ingredients.length > 0 && onRecommendRequest && (
            <button
              onClick={onRecommendRequest}
              type="button"
              className="w-full py-2.5 rounded-xl bg-green-700 hover:bg-green-800 text-xs font-bold text-white transition-all flex justify-center items-center gap-1.5 shadow-md animate-in fade-in duration-200"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
              </svg>
              <span>{lang === Language.japanese ? "この食材でレシピを推薦" : "이 재료들로 요리 추천받기"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
