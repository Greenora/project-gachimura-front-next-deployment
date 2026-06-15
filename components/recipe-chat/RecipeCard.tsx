"use client";

import { Language } from "@/app/common/types";

interface Recipe {
  title: string;
  time: string;
  difficulty: string;
  matchRate: string;
  ingredients: string[];
  instructions: string[];
}

interface RecipeCardProps {
  recipe: Recipe;
  lang: Language;
}

export default function RecipeCard({ recipe, lang }: RecipeCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col w-full">
      <div className="p-4 bg-green-50/40 border-b border-gray-100 flex justify-between items-center flex-wrap gap-2">
        <h3 className="text-xs font-black text-gray-900 flex items-center gap-1.5">
          ⭐ {recipe.title}
        </h3>
        <span className="text-[10px] bg-green-700 text-white px-2 py-0.5 rounded-full font-bold">
          {lang === Language.japanese ? `マッチ率 ${recipe.matchRate}` : `매칭률 ${recipe.matchRate}`}
        </span>
      </div>
      <div className="p-4 flex flex-col gap-3">
        {/* 메타 정보 */}
        <div className="flex gap-4 text-[10px] text-gray-500 font-bold border-b border-gray-50 pb-2">
          <span>⏱️ {recipe.time}</span>
          <span>📊 {recipe.difficulty}</span>
        </div>
        {/* 재료 리스트 */}
        <div>
          <h4 className="text-[11px] font-black text-gray-800 mb-1">
            {lang === Language.japanese ? "■ 材料" : "🛒 준비 재료"}
          </h4>
          <div className="flex flex-wrap gap-1">
            {recipe.ingredients.map((ing, i) => (
              <span key={i} className="text-[10px] bg-gray-50 border border-gray-100 text-gray-600 px-2 py-0.5 rounded">
                {ing}
              </span>
            ))}
          </div>
        </div>
        {/* 조리 순서 */}
        <div>
          <h4 className="text-[11px] font-black text-gray-800 mb-1">
            {lang === Language.japanese ? "■ 調理手順" : "🍳 조리 방법"}
          </h4>
          <ol className="list-decimal pl-4 flex flex-col gap-1 text-[10px] text-gray-600 leading-normal font-sans">
            {recipe.instructions.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
