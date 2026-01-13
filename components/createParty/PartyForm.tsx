'use client';

import { useState } from "react";
import PartyInput from "./PartyInput";
import DateTimeSelector from "./DateTimeSelector";
import PartyContent from "./PartyContent";
import PartyLocation from "./PartyLocation"
import SubmitButton from "./SubmitButton";
import PartyImageUpload from "./PartyImageUpload";
import { clientFetch } from "@/app/hooks/useClientFetch";
import { fieldset } from "framer-motion/client";

type FormErrors = {
  title?: string;
  date?: string;
  time?: string;
  description?: string;
  storeName?: string;
  storeAddress?: string;
}

export default function PartyForm() {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [description, setDescription] = useState('');
  const [storeInfo, setStoreInfo] = useState({
    name: '',
    address: '',
    latitude: '',
    longitude: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  const clearError = (field: keyof FormErrors) => {
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: FormErrors = {};

    if (!title.trim()) newErrors.title = '제목을 입력해주세요';
    if (!date) newErrors.date = '모임 날짜를 선택해주세요';
    if (!time) newErrors.time = '모임 시간을 선택해주세요';
    if (!description.trim()) newErrors.description = '설명을 작성해주세요';
    if (!storeInfo.name) newErrors.storeName = '마트를 선택해주세요';
    if (!storeInfo.address) newErrors.storeAddress = '마트 주소가 필요합니다';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) return;

    const formData = new FormData();
    formData.append('title', title);
    formData.append('meetingDate', date);
    formData.append('meetingTime', time);
    formData.append('content', description);
    formData.append('store_name', storeInfo.name);
    formData.append('address', storeInfo.address);
    formData.append('latitude', storeInfo.latitude);
    formData.append('longitude', storeInfo.longitude);
    if (imageFile) formData.append('thumbnail_image', imageFile);

    console.log("===모임 등록 데이터===");
    for (const [key, value] of formData.entries()) {
      console.log(key, value);
    }

    await clientFetch('/parties', { method: 'POST', body: formData });
  };

  return (
    <form onSubmit={handleSubmit} className="mt-12 max-w-exl mx-auto px-4">
      <PartyInput
        label="제목"
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          clearError('title');
        }}
        error={errors.title}
      />
      
      <DateTimeSelector
        date={date}
        time={time}
        setDate={(val) => { setDate(val); clearError('date'); }}
        setTime={(val) => { setTime(val); clearError('time'); }}
        errors={{ date: errors.date, time: errors.time }}
      />

      <PartyImageUpload onChange={setImageFile} />

      <PartyContent
        value={description}
        onChange={(val) => {
          setDescription(val);
          clearError('description');
        }}
        error={errors.description}
      />

      <PartyLocation
        storeInfo={storeInfo}
        setStoreInfo={(val) => {
          setStoreInfo(val);
          clearError('storeName');
        }}
        errors={{
          storeName: errors.storeName,
          storeAddress: errors.storeAddress,
        }}
      />

      <div className="pt-4">
        <SubmitButton />
      </div>
    </form>
  );
}