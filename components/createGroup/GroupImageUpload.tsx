'use client';

import { useState, useRef } from 'react';

export default function GroupImageUpload() {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 미리보기 URL 생성
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleContainerClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex mb-10">
      <label className="w-50 font-medium text-gray-700 pt-2">모임 대표사진(선택)</label>
      <div className="flex-1">
        {/* 숨겨진 파일 Input */}
        <input 
          type="file" 
          name="groupImage" 
          accept="image/*" 
          className="hidden" 
          ref={fileInputRef}
          onChange={handleImageChange}
        />
        
        {/* 클릭 가능한 업로드 영역 */}
        <div 
          onClick={handleContainerClick}
          className="w-50 h-50 bg-[#F2F2F2] rounded-xl flex items-center justify-center cursor-pointer border border-gray-100 hover:bg-gray-200 transition-colors overflow-hidden"
        >
          {preview ? (
            <img src={preview} alt="미리보기" className="w-full h-full object-cover" />
          ) : (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}