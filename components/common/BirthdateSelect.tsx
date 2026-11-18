"use client";

import { Language } from "@/app/common/types";

export default function BirthdateSelect({ id, value, onChange, lang, disabled = false, invalid = false }: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  lang: Language;
  disabled?: boolean;
  invalid?: boolean;
}) {
  const [year = "", month = "", day = ""] = value.split("-");
  const today = new Date().toISOString().slice(0, 10);
  const currentYear = Number(today.slice(0, 4));
  const currentMonth = Number(today.slice(5, 7));
  const currentDay = Number(today.slice(8));
  const years = Array.from({ length: currentYear - 1899 }, (_, index) => currentYear - index);
  if (Number(year) >= 1000 && Number(year) < 1900) years.push(Number(year));
  const maxMonth = Number(year) === currentYear ? currentMonth : 12;
  const maxDay = year && month
    ? Math.min(new Date(Date.UTC(Number(year), Number(month), 0)).getUTCDate(), Number(year) === currentYear && Number(month) === currentMonth ? currentDay : 31)
    : 0;
  const japanese = lang === Language.japanese;
  const labels = japanese ? ["年", "月", "日"] : ["연도", "월", "일"];
  const names = japanese ? ["生まれた年", "生まれた月", "生まれた日"] : ["태어난 연도", "태어난 월", "태어난 일"];
  const selectClass = `min-h-12 w-full min-w-0 rounded-xl border bg-white px-2.5 py-3 text-sm text-gray-900 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-gray-50 disabled:text-gray-400 ${invalid ? "border-red-500" : "border-gray-200"}`;

  function change(nextYear: string, nextMonth: string, nextDay: string) {
    if (!nextYear) { onChange(""); return; }
    const months = Number(nextYear) === currentYear ? currentMonth : 12;
    if (Number(nextMonth) > months) nextMonth = "";
    const days = nextMonth ? Math.min(new Date(Date.UTC(Number(nextYear), Number(nextMonth), 0)).getUTCDate(), Number(nextYear) === currentYear && Number(nextMonth) === currentMonth ? currentDay : 31) : 0;
    if (!nextMonth || Number(nextDay) > days) nextDay = "";
    onChange(`${nextYear}-${nextMonth}-${nextDay}`);
  }

  return (
    <div id={id} role="group" aria-label={japanese ? "生年月日" : "생년월일"}>
      <div className="grid grid-cols-[1.25fr_1fr_1fr] gap-2">
        <select id={`${id}-year`} autoComplete="bday-year" aria-label={names[0]} aria-invalid={invalid} aria-describedby={`${id}-hint`} value={year} disabled={disabled} onChange={event => change(event.target.value, month, day)} className={selectClass}>
          <option value="">{labels[0]}</option>
          {years.map(option => <option key={option} value={option}>{option}{japanese ? "年" : "년"}</option>)}
        </select>
        <select id={`${id}-month`} autoComplete="bday-month" aria-label={names[1]} aria-invalid={invalid} aria-describedby={`${id}-hint`} value={month} disabled={disabled || !year} onChange={event => change(year, event.target.value, day)} className={selectClass}>
          <option value="">{labels[1]}</option>
          {Array.from({ length: maxMonth }, (_, index) => index + 1).map(option => <option key={option} value={String(option).padStart(2, "0")}>{option}{japanese ? "月" : "월"}</option>)}
        </select>
        <select id={`${id}-day`} autoComplete="bday-day" aria-label={names[2]} aria-invalid={invalid} aria-describedby={`${id}-hint`} value={day} disabled={disabled || !year || !month} onChange={event => change(year, month, event.target.value)} className={selectClass}>
          <option value="">{labels[2]}</option>
          {Array.from({ length: maxDay }, (_, index) => index + 1).map(option => <option key={option} value={String(option).padStart(2, "0")}>{option}{japanese ? "日" : "일"}</option>)}
        </select>
      </div>
      <div className="mt-1 flex items-center justify-between gap-2">
        <p id={`${id}-hint`} className="text-[11px] leading-relaxed text-gray-400">{japanese ? "年・月・日をそれぞれ選択してください。" : "연도·월·일을 각각 선택해주세요."}</p>
        <button type="button" aria-label={japanese ? "生年月日をクリア" : "생년월일 지우기"} disabled={disabled || !value} onClick={() => onChange("")} className="min-h-11 shrink-0 px-1 text-xs font-medium text-gray-500 underline decoration-gray-300 underline-offset-4 disabled:opacity-40">{japanese ? "クリア" : "지우기"}</button>
      </div>
    </div>
  );
}
