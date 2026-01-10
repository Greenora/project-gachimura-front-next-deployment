'use client';

import { useState } from 'react';

export default function GroupDescription() {
  const [text, setText] = useState('');
  const maxLength = 200;

  return (
    <div className="flex mb-10">
      <label className="w-50 font-medium text-gray-700 pt-2">모임 설명</label>
      <div className="flex-1 relative">
        <textarea
          name="description"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={maxLength}
          placeholder="구매할 물품과 기타 설명을 자세하게 적어주세요. 정확한 모임 위치는 모임의 채팅방에서 공유해주세요!"
          className="w-full h-36 border border-gray-300 rounded-lg p-4 resize-none bg-white text-sm focus:outline-none focus:border-green-700"
        />
        <div className="absolute bottom-3 right-4 text-xs text-gray-400">
          {text.length}/{maxLength}
        </div>
      </div>
    </div>
  );
}