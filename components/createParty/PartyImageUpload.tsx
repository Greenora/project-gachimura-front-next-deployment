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
    const file = e.target.files?.[0] || null;
    // server 전송용 file 저장
    onChange(file);

    if (!file) {
      setPreview(null);
      return;
    }

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
    <div className="flex mb-10">
      <label className="w-48 font-medium text-gray-700 h-10 flex items-center">{label}</label>
      <div className="flex-1 flex items-start">
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
        <div 
          onClick={handleClickUpload}
          className="w-52 h-52 shrink-0 flex-none bg-gray-100 rounded-xl flex items-center justify-center cursor-pointer border hover:bg-green-100 transition-colors overflow-hidden"
        >
          {preview ? (
            <img src={preview} alt="미리보기" className="w-full h-full object-cover" />
          ) : (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
            </svg>
          )}
        </div>
        {/* <div className="min-h-5 mt-1" /> */}
      </div>
    </div>
  );
}