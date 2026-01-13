'use client';

import { useState } from 'react';
import PartyInput from "./PartyInput";

export default function GroupLocation() {
  const [searchStore, setSearchStore] = useState('');
  const [storeInfo, setStoreInfo] = useState<{
    name: string,
    address: string,
    latitude: string,
    longitude: string,
  } | null>(null);

  // 나중에 kakao API 등에서 장소를 선택했을 때 이 함수를 실행하게 됩니다.
  const handleSelectPlace = (
    selectedName: string,
    selectedAddress: string,
    selectedLatitude: string,
    selectedLongitude: string
  ) => {
    setStoreInfo({
      name: selectedName,
      address: selectedAddress,
      latitude: selectedLatitude,
      longitude: selectedLongitude
    });

    // 검색어를 선택된 마트 이름으로 동기화
    setSearchStore(selectedName);
  };

  return (
    <div className="mb-10">
      {/* 1. 검색창 */}
      <PartyInput
        label="마트"
        placeholder="마트 이름을 검색하세요"
        value={searchStore}
        onChange={(e) =>
          setSearchStore(e.target.value)}
        className="mb-2.5"
      />

      {/* 2. Hidden Inputs: 실제 백엔드로 보낼 마트 이름과 주소를 담는 곳 */}
      {/* value가 storeInfo 상태와 연결되어 있어, 지도 검색 시 자동으로 업데이트됨 */}
      <input type="hidden" name="store_name" value={storeInfo?.name} />
      <input type="hidden" name="address" value={storeInfo?.address} />

      <div className="flex">
        <div className="w-49" /> 
        <div className="flex-1">
          <div className="w-full h-56 bg-gray-100 border border-gray-200 mb-4 flex items-center justify-center text-gray-400 italic text-sm">
            지도 영역
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-lg text-gray-900">
              {storeInfo?.name || '(마트 이름)'}
            </span>
            <span className="text-gray-500 text-sm">
              {storeInfo?.address || '(마트 주소)'}
            </span>

            <input type="hidden" name="latitude" value={storeInfo?.latitude} />
            <input type="hidden" name="longitude" value={storeInfo?.longitude} />

          </div>
        </div>
      </div>
    </div>
  );
}