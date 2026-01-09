'use client';

export default function DateTimeSelector() {
  return (
    <div className="flex items-center mb-6">
      <label className="w-50 font-medium text-gray-700">모임 날짜, 시간</label>
      <div className="flex gap-2">
        <button type="button" className="bg-gray-100 px-4 py-2 rounded-full text-sm font-medium">날짜</button>
        <button type="button" className="bg-gray-100 px-4 py-2 rounded-full text-sm font-medium">시간</button>
      </div>
    </div>
  );
}