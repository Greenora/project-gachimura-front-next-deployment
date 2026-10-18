'use client';

import { useId } from 'react';

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
  const inputId = useId();

  const combinedError = errors?.date || errors?.time;

  return (
    <div className="flex flex-col gap-2 mb-6 sm:flex-row sm:items-start sm:gap-0">
      <span className="font-medium text-gray-700 sm:w-48 sm:shrink-0 sm:h-11 sm:flex sm:items-center">
        {label}
      </span>

      <div className="min-w-0 flex-1">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="min-w-0 text-sm text-gray-600">
            <span className="mb-1 block">{texts.dateSelect}</span>
            <input
              id={`${inputId}-date`}
              type="date"
              name="meetingDate"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              aria-invalid={Boolean(errors?.date)}
              aria-describedby={combinedError ? `${inputId}-error` : undefined}
              className={`block min-w-0 w-full h-11 rounded-lg border px-3 text-base outline-none focus:border-green-700 ${errors?.date ? 'border-red-500' : 'border-gray-300'}`}
            />
          </label>

          <label className="min-w-0 text-sm text-gray-600">
            <span className="mb-1 block">{texts.timeSelect}</span>
            <input
              id={`${inputId}-time`}
              type="time"
              name="meetingTime"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              aria-invalid={Boolean(errors?.time)}
              aria-describedby={combinedError ? `${inputId}-error` : undefined}
              className={`block min-w-0 w-full h-11 rounded-lg border px-3 text-base outline-none focus:border-green-700 ${errors?.time ? 'border-red-500' : 'border-gray-300'}`}
            />
          </label>
        </div>

        {/* 안내 문구 */}
        <div className="min-h-5 mt-1">
          {combinedError && (
            <p id={`${inputId}-error`} className="text-xs text-red-500">
              {texts.error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
