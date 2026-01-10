'use client';

import { useState } from 'react';
import PartyInput from "./PartyInput";

export default function GroupLocation() {
  const [martInfo, setMartInfo] = useState({
    name: '',
    address: ''
  });

  // 나중에 구글 API 등에서 장소를 선택했을 때 이 함수를 실행하게 됩니다.
  const handleSelectPlace = (selectedName: string, selectedAddress: string) => {
    setMartInfo({ name: selectedName, address: selectedAddress });
  };

  return (
    <div className="mb-10">
      {/* 1. 검색창 */}
      <PartyInput
        label="마트"
        placeholder="마트 이름을 검색하세요"
        className="mb-2.5"
      />

      {/* 2. Hidden Inputs: 실제 백엔드로 보낼 마트 이름과 주소를 담는 곳 */}
      {/* value가 martInfo 상태와 연결되어 있어, 지도 검색 시 자동으로 업데이트됨 */}
      <input type="hidden" name="martName" value={martInfo.name} />
      <input type="hidden" name="martAddress" value={martInfo.address} />

      <div className="flex">
        <div className="w-49" /> 
        <div className="flex-1">
          <div className="w-full h-56 bg-gray-100 border border-gray-200 mb-4 flex items-center justify-center text-gray-400 italic text-sm">
            지도 영역
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-lg text-gray-900">
              {martInfo.name || '(마트 이름)'}
            </span>
            <span className="text-gray-500 text-sm">
              {martInfo.address || '(마트 주소)'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}