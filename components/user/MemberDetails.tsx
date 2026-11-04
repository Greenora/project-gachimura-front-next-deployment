"use client";

import { useState, type FormEvent } from "react";
import { Language } from "@/app/common/types";
import { useLanguage } from "@/app/hooks/LanguageContext";
import { type UserProfile } from "@/app/hooks/UserContext";
import { clientFetch } from "@/app/hooks/useClientFetch";
import { isMemberBirthdate, normalizeMemberPhone } from "@/app/lib/member-details";

export default function MemberDetails({ user }: { user: UserProfile }) {
  const { lang } = useLanguage();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const copy = lang === Language.japanese ? {
    title: "連絡先と生年月日", phone: "電話番号", birthdate: "生年月日", save: "保存", saving: "保存中…",
    privacy: "この情報は本人にのみ表示されます。空欄で保存すると削除できます。",
    invalidPhone: "電話番号を確認してください。(例: 09012345678)",
    invalidBirthdate: "年を4桁にして正しい生年月日を入力してください。",
    failed: "保存できませんでした。入力内容を確認して、もう一度お試しください。", saved: "保存しました。",
  } : {
    title: "연락처 및 생년월일", phone: "전화번호", birthdate: "생년월일", save: "저장", saving: "저장 중…",
    privacy: "본인에게만 표시됩니다. 빈칸으로 저장하면 삭제할 수 있습니다.",
    invalidPhone: "전화번호를 확인해주세요. (예: 01012345678)",
    invalidBirthdate: "올바른 생년월일을 연도 4자리로 입력해주세요.",
    failed: "저장하지 못했습니다. 입력 내용을 확인하고 다시 시도해주세요.", saved: "저장했습니다.",
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    const form = event.currentTarget;
    const input = new FormData(form);
    const rawPhone = String(input.get("phone") || "").trim();
    const phone = rawPhone ? normalizeMemberPhone(rawPhone) : null;
    const birthdate = String(input.get("birthdate") || "").trim() || null;
    setSaved(false);
    if (rawPhone && !phone) { setError(copy.invalidPhone); return; }
    if ((form.elements.namedItem("birthdate") as HTMLInputElement).validity.badInput || (birthdate && !isMemberBirthdate(birthdate))) {
      setError(copy.invalidBirthdate); return;
    }
    setError("");
    setSaving(true);
    try {
      const result = await clientFetch<{ success: boolean }>("/users/profile", { method: "PATCH", body: { phone, birthdate } });
      if (!result.success) throw new Error("PROFILE_SAVE_FAILED");
      if (!form.isConnected) return;
      for (const [name, value] of Object.entries({ phone, birthdate })) {
        const field = form.elements.namedItem(name) as HTMLInputElement;
        field.value = field.defaultValue = value || "";
      }
      setSaved(true);
    } catch {
      if (form.isConnected) setError(copy.failed);
    } finally {
      if (form.isConnected) setSaving(false);
    }
  };

  return (
    <section aria-labelledby="member-details-title" className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6">
      <h2 id="member-details-title" className="text-lg font-bold text-gray-900">{copy.title}</h2>
      <p className="mt-2 text-sm text-gray-600">{copy.privacy}</p>
      <form noValidate onSubmit={submit} onChange={() => { setSaved(false); setError(""); }} className="mt-4">
        <fieldset disabled={saving} className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="member-phone" className="mb-2 block text-sm font-medium text-gray-700">{copy.phone}</label>
            {/* Native inputs preserve edits when the shared profile refreshes in the background. */}
            <input id="member-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" defaultValue={user.phone || ""}
              className="min-h-11 w-full rounded-xl border border-gray-300 px-3 py-2 text-gray-900" />
          </div>
          <div>
            <label htmlFor="member-birthdate" className="mb-2 block text-sm font-medium text-gray-700">{copy.birthdate}</label>
            <input id="member-birthdate" name="birthdate" type="date" autoComplete="bday" min="1000-01-01"
              max={new Date().toISOString().slice(0, 10)} defaultValue={user.birthdate || ""}
              className="min-h-11 w-full rounded-xl border border-gray-300 px-3 py-2 text-gray-900" />
          </div>
          <button type="submit" aria-busy={saving} className="min-h-11 rounded-xl bg-[#166534] px-5 font-bold text-white disabled:bg-gray-300 sm:col-span-2 sm:justify-self-start">
            {saving ? copy.saving : copy.save}
          </button>
        </fieldset>
        {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
        {saved && <p role="status" className="mt-3 text-sm text-green-800">{copy.saved}</p>}
      </form>
    </section>
  );
}
