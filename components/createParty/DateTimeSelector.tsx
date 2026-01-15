'use client';

import { useRef } from 'react';

interface Props {
  label: string;
  date: string;
  time: string;
  setDate: (v: string) => void;
  setTime: (v: string) => void;
  errors?: { date?: string; time?: string };
  texts: {
    dateSelect: string;
    timeSelect: string;
    error: string
  };
}

export default function DateTimeSelector({
  label,
  date,
  time,
  setDate,
  setTime,
  errors,
  texts
}: Props) {
  const dateInputRef = useRef<HTMLInputElement>(null);
  const timeInputRef = useRef<HTMLInputElement>(null);

  const combinedError = errors?.date || errors?.time;

  return (
    <div className="flex items-start mb-6">
      <label className="w-48 font-medium text-gray-700 h-10 flex items-center">
        {label}
      </label>

      <div className="flex-1">
        <div className="flex gap-3 h-12">
        {/* FormData로 실제 전송되는 값들 */}
          {/* 날짜 */}
          <div className="relative h-11">
            <input
              ref={dateInputRef}
              type="date"
              name="meetingDate"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="absolute invisible w-0 h-0"
            />
            <button
              type="button"
              onClick={() => dateInputRef.current?.showPicker()}
              className={`px-4 py-2 rounded-full text-sm border w-full h-full transition-colors outline-none
                ${errors?.date
                  ? 'border-red-500 text-red-600'
                  : date
                  ? 'bg-gray-100 text-gray-700 border-gray-200 focus:border-green-700'
                  : 'bg-emerald-50 text-green-600 border-green-200 focus:border-green-700'}`}
            >
              {date ? date.replace(/-/g, '.') : texts.dateSelect}
            </button>
          </div>

          {/* 시간 */}
          <div className="relative h-11">
            <input
              ref={timeInputRef}
              type="time"
              name="meetingTime"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="absolute invisible w-0 h-0"
            />
            <button
              type="button"
              onClick={() => timeInputRef.current?.showPicker()}
              className={`px-4 py-2 rounded-full text-sm border w-full h-full transition-colors outline-none
                ${
                  errors?.time
                    ? 'border-red-500 text-red-600'
                    : time
                    ? 'bg-gray-100 text-gray-700 border-gray-200 focus:border-green-700'
                    : 'bg-emerald-50 text-green-600 border-green-200 focus:border-green-700'}`}
            >
              {time || texts.timeSelect}
            </button>
          </div>
        </div>

        {/* 안내 문구 */}
        <div className="min-h-5 mt-1">
          {combinedError && (
            <p className="text-xs text-red-500">
              {texts.error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}