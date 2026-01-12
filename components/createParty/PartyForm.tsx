'use client';

import PartyInput from "./PartyInput";
import DateTimeSelector from "./DateTimeSelector";
import PartyContent from "./PartyContent";
import PartyLocation from "./PartyLocation"
import SubmitButton from "./SubmitButton";
import PartyImageUpload from "./PartyImageUpload";
import { clientFetch } from "@/app/hooks/useClientFetch";

export default function PartyForm() {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    console.log("===모임 등록 데이터===");
    for (const [key, value] of formData.entries()) {
      console.log(key, value);
    }

    try {
      const result = await clientFetch("/parties", {
        method: "POST",
        body: formData,
      });

      console.log("생성된 모임:", result);
    } catch (error: any) {
      console.log("모임 생성 실패:", error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-12">
      <PartyInput label="제목" name="title" />
      
      <DateTimeSelector />

      <PartyImageUpload />

      <PartyContent />

      <PartyLocation />

      <div className="pt-4">
        <SubmitButton />
      </div>
    </form>
  );
}