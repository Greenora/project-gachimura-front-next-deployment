'use client';

export default function GroupLocation() {
  return (
    <div className="flex mb-10">
      <label className="w-50 font-medium text-gray-700 pt-2">마트 위치 설정</label>
      <div className="flex-1">
        {/* 지도 이미지 영역 */}
        <div className="w-full h-56 bg-gray-100 overflow-hidden border border-gray-200 mb-4 flex items-center justify-center text-gray-400 italic">
          지도 영역 (Google Maps API 연결 예정)
        </div>
        {/* 주소 정보 영역 */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg text-gray-900">(마트 이름)</span>
          <span className="text-gray-500 text-sm">(마트 주소)</span>
        </div>
      </div>
    </div>
  );
}