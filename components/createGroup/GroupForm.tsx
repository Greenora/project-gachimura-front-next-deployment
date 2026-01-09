'use client';

import GroupInput from "./GroupInput";
import DateTimeSelector from "./DateTimeSelector";
import GroupDescription from "./GroupDescription";
import GroupLocation from "./GroupLocation";
import SubmitButton from "./SubmitButton";
import GroupImageUpload from "./GroupImageUpload";

export default function GroupForm() {
  const handleClientAction = (formData: FormData) => {
    const data = Object.fromEntries(formData.entries());
    console.log("=== 모임 등록 데이터 ===");
    console.log(data);
  };

  return (
    <form action={handleClientAction} className="mt-12">
      <GroupInput label="제목" name="title" />
      
      <DateTimeSelector />
      
      <GroupInput label="마트 명(지점명)" name="martName" placeholder="예) 코스트코 대구점" />

      <GroupImageUpload />

      <GroupDescription />

      <GroupLocation />

      <div className="pt-4">
        <SubmitButton />
      </div>
    </form>
  );
}