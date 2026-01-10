'use client';

import PartyInput from "./PartyInput";
import DateTimeSelector from "./DateTimeSelector";
import PartyContent from "./PartyContent";
import PartyLocation from "./PartyLocation"
import SubmitButton from "./SubmitButton";
import PartyImageUpload from "./PartyImageUpload";

export default function PartyForm() {
  const handleClientAction = (formData: FormData) => {
    const data = Object.fromEntries(formData.entries());
    console.log("=== 모임 등록 데이터 ===");
    console.log(data);
  };

  return (
    <form action={handleClientAction} className="mt-12">
      <PartyInput label="제목" name="title" />
      
      <DateTimeSelector />
      
      {/* <PartyInput label="마트 명(지점명)" name="martName" placeholder="예) 코스트코 대구점" /> */}
      <PartyLocation />

      <PartyImageUpload />

      <PartyContent />

      {/* <PartyLocation /> */}

      <div className="pt-4">
        <SubmitButton />
      </div>
    </form>
  );
}