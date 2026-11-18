'use client';

import { useState, useRef } from 'react';

interface Props {
  label: string;
  onChange: (file: File | null) => void;
}

export default function PartyImageUpload({ label, onChange }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null); // UI (미리보기)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    // server 전송용 file 저장
    onChange(file);

    // UI 미리보기
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col gap-2 mb-8 sm:flex-row sm:gap-0">
      <span className="font-medium text-gray-700 sm:w-48 sm:shrink-0 sm:h-11 sm:flex sm:items-center">{label}</span>
      <div className="min-w-0 flex-1 flex items-start">
        {/* 실제 서버로 전송되는 Input */}
        <input
          ref={fileInputRef}
          type="file" 
          name="thumbnail_image" 
          accept="image/*" 
          className="hidden" 
          onChange={handleImageChange}
        />
        
        {/* 클릭 가능한 업로드 영역 */}
        <button
          type="button"
          aria-label={label}
          onClick={handleClickUpload}
          className="w-52 max-w-full aspect-square shrink-0 bg-gray-100 rounded-xl flex items-center justify-center cursor-pointer border hover:bg-green-100 transition-colors overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-green-700"
        >
          {preview ? (
            <img src={preview} alt={label} className="w-full h-full object-cover" />
          ) : (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
            </svg>
          )}
        </button>
        {/* <div className="min-h-5 mt-1" /> */}
      </div>
    </div>
  );
}
