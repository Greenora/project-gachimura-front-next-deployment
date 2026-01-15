'use client';

import { useState } from 'react';
import PartyInput from "./PartyInput";

interface StoreInfo {
  name: string;
  address: string;
  latitude: string;
  longitude: string;
}
interface Props {
  label: string;
  placeholder: string;
  emptyMessage: string;
  storeInfo: StoreInfo;
  setStoreInfo: (val: StoreInfo) => void;
  errors?: {
    storeName?: string;
    storeAddress?: string;
  };
}

export default function PartyLocation({ label, placeholder, emptyMessage, storeInfo, setStoreInfo, errors }: Props) {
  // UI 전용 검색어 상태
  const [searchStore, setSearchStore] = useState('');

  // 지도 API 결과(장소)를 선택했을 때 이 함수를 호출하여 상태 업데이트
  const handleSelectPlace = (
    name: string,
    address: string,
    latitude: string,
    longitude: string,
  ) => {
    setStoreInfo({
      name,
      address,
      latitude,
      longitude,
    });

    // 검색창 UI 동기화
    setSearchStore(name);
  };

  return (
    <div className="mb-6">
      {/* 1. 검색창 */}
      <PartyInput
        label={label}
        placeholder={placeholder}
        value={searchStore}
        onChange={(e) =>
          setSearchStore(e.target.value)}
        error={errors?.storeName}
        className="mb-2"
      />

      {/* 2. Hidden Inputs: 실제 백엔드로 보낼 마트 이름과 주소를 담는 곳 */}
      {/* value가 storeInfo 상태와 연결되어 있어, 지도 검색 시 자동으로 업데이트됨 */}
      <input type="hidden" name="store_name" value={storeInfo?.name} />
      <input type="hidden" name="address" value={storeInfo?.address} />
      <input type="hidden" name="latitude" value={storeInfo?.latitude} />
      <input type="hidden" name="longitude" value={storeInfo?.longitude} />

      <div className="flex">
        <div className="w-48" /> 
        <div className="flex-1">
          <div className="w-full h-56 bg-gray-100 border border-gray-200 mb-2 flex items-center justify-center text-gray-400 italic text-sm">
            지도 영역
          </div>

          <div className="flex items-center gap-2 min-h-7">
            {storeInfo?.name ? (
              <>
                <span className="font-bold text-lg text-gray-900">
                  {storeInfo.name}
                </span>
                <span className="text-gray-500 text-sm">
                  {storeInfo.address}
                </span>
              </>
            ) : (
              <span className="text-gray-400 text-sm">{emptyMessage}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}