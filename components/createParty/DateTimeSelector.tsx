'use client';

import { useRef, useState } from 'react';

export default function DateTimeSelector() {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  
  const dateInputRef = useRef<HTMLInputElement>(null);
  const timeInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex items-center mb-10">
      <label className="w-49 font-medium text-gray-700">모임 날짜, 시간</label>

      {/* FormData로 실제 전송되는 값들 */}
      <input
        type="date"
        name="meetingDate"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        hidden
      />

      <input
        type="time"
        name="meetingTime"
        value={time}
        onChange={(e) => setTime(e.target.value)}
        hidden
      />

      <div className="flex gap-2">
        {/* 날짜 선택 */}
        <div className="relative">
          <input
            type="date"
            ref={dateInputRef}
            onChange={(e) => setDate(e.target.value)}
            className="absolute opacity-0 w-0 h-0"
            hidden
          />
          <button
            type="button"
            onClick={() => dateInputRef.current?.showPicker()} // 브라우저 달력 실행
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              date ? 'bg-gray-100 text-gray-700 border border-gray-200' : 'bg-emerald-50 text-green-600 border border-green-200'
            }`}
          >
            {date ? date.replace(/-/g, '.') : '날짜 선택'}
          </button>
        </div>

        {/* 시간 선택 */}
        <div className="relative">
          <input
            type="time"
            ref={timeInputRef}
            onChange={(e) => setTime(e.target.value)}
            className="absolute opacity-0 w-0 h-0"
            hidden
          />
          <button
            type="button"
            onClick={() => timeInputRef.current?.showPicker()} // 브라우저 시간 선택기 실행
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              time
                ? 'bg-gray-100 text-gray-700 border border-gray-200'
                : 'bg-emerald-50 text-green-600 border border-green-200'
            }`}
          >
            {time || '시간 선택'}
          </button>
        </div>
      </div>
    </div>
  );
}