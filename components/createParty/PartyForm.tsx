'use client';

import { useState } from "react";
import { useLanguage } from "@/app/hooks/LanguageContext";
import PartyInput from "./PartyInput";
import DateTimeSelector from "./DateTimeSelector";
import PartyContent from "./PartyContent";
import PartyLocation from "./PartyLocation"
import SubmitButton from "./SubmitButton";
import PartyImageUpload from "./PartyImageUpload";
import { clientFetch } from "@/app/hooks/useClientFetch";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

type FormErrors = {
  title?: string;
  date?: string;
  time?: string;
  description?: string;
  storeName?: string;
  storeAddress?: string;
}

export default function PartyForm() {
  const { texts, lang } = useLanguage();
  const pf = texts.partyForm; // party form 텍스트 참조
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [description, setDescription] = useState('');
  const [storeInfo, setStoreInfo] = useState({
    name: '',
    address_ko: '',
    address_jp: '',
    latitude: 0,
    longitude: 0,
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

    if (!title.trim()) newErrors.title = pf.titlePlaceholder;
    if (!date) newErrors.date = pf.errorDateTime;
    if (!time) newErrors.time = pf.errorDateTime;
    if (!description.trim()) newErrors.description = pf.descriptionPlaceholder;
    if (!storeInfo.name) newErrors.storeName = pf.storeEmpty;

    if (!storeInfo.name || !storeInfo.latitude || !storeInfo.longitude) {
      newErrors.storeName = pf.storeEmpty;
    }

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
    formData.append('address_ko', storeInfo.address_ko);
    formData.append('address_jp', storeInfo.address_jp); // 백엔드 요구사항에 따라 조정 필요
    formData.append('latitude', storeInfo.latitude.toString());
    formData.append('longitude', storeInfo.longitude.toString());
    if (imageFile) formData.append('thumbnail_image', imageFile);

    try {
      await clientFetch("/parties", { method: "POST", body: formData });
      toast.success(texts.auth.alertRegisterSuccess || "모임이 등록되었습니다.");
      router.push("/"); // 등록 성공 시 메인으로 이동
    } catch (error: any) {
      console.error("등록 실패:", error);
      toast.error(error.message || "등록에 실패했습니다.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <h2 className="text-2xl font-bold text-center mb-10 text-gray-800">{pf.pageTitle}</h2>

      <PartyInput
        label={pf.title}
        name="title"
        placeholder={pf.titlePlaceholder}
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          clearError('title');
        }}
        error={errors.title}
      />
      
      <DateTimeSelector
        label={pf.date}
        date={date}
        time={time}
        setDate={(val) => { setDate(val); clearError('date'); }}
        setTime={(val) => { setTime(val); clearError('time'); }}
        errors={{ date: errors.date, time: errors.time }}
        texts={{ dateSelect: pf.dateSelect, timeSelect: pf.timeSelect, error: pf.errorDateTime }}
      />

      <PartyImageUpload
        label={pf.image}
        onChange={setImageFile}
      />

      <PartyContent
        label={pf.description}
        name="content"
        placeholder={pf.descriptionPlaceholder}
        value={description}
        onChange={(val) => {
          setDescription(val);
          clearError('description');
        }}
        error={errors.description}
      />

      <PartyLocation
        label={pf.store}
        placeholder={pf.storePlaceholder}
        emptyMessage={pf.storeEmpty}
        storeInfo={storeInfo}
        setStoreInfo={(val) => {
          setStoreInfo(val);
          clearError('storeName');
        }}
        errors={{ storeName: errors.storeName }}
        currentLang={lang}
      />

      <div className="pt-4">
        <SubmitButton text={pf.submit} />
      </div>
    </form>
  );
}