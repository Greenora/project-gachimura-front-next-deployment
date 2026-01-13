'use client';

interface Props {
  value: string;
  onChange: (v: string) => void;
  error?: string;
}

export default function PartyContent({ value, onChange, error }: Props) {
  const maxLength = 200;

  return (
    <div className="flex mb-6">
      <label className="w-49 font-medium text-gray-700 h-10 flex items-center">모임 설명</label>
      <div className="flex-1">
        <div className="relative">
          <textarea
            name="content"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            maxLength={maxLength}
            placeholder="구매할 물품과 기타 설명을 자세하게 적어주세요. 정확한 모임 위치는 모임의 채팅방에서 공유해주세요!"
            className={`w-full h-36 border rounded-lg p-4 resize-none bg-white text-sm outline-none transition-colors
              ${error ? 'border-red-500' : 'border border-gray-300 focus:border-green-700'}`}
          />
          <div className="absolute bottom-3 right-4 text-xs text-gray-400">
            {value.length}/{maxLength}
          </div>
        </div>

        <div className="min-h-5 mt-1">
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
      </div>
    </div>
  );
}