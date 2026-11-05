"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Language } from "@/app/common/types";
import { type UserProfile } from "@/app/hooks/UserContext";
import { clientFetch, USER_CHANGED_EVENT } from "@/app/hooks/useClientFetch";
import { normalizeMemberBirthdate, normalizeMemberPhone } from "@/app/lib/member-details";
import BirthdateSelect from "@/components/common/BirthdateSelect";

const BANK_LIST = [
  { code: "089", name: "토스뱅크" }, { code: "090", name: "카카오뱅크" },
  { code: "004", name: "KB국민은행" }, { code: "088", name: "신한은행" },
  { code: "020", name: "우리은행" }, { code: "081", name: "하나은행" },
  { code: "011", name: "NH농협은행" }, { code: "003", name: "IBK기업은행" },
  { code: "071", name: "우체국" }, { code: "045", name: "새마을금고" },
  { code: "048", name: "신협" }, { code: "032", name: "부산은행" }, { code: "031", name: "대구은행" },
];

export type ProfileSection = "basic" | "bank";

function basicFields(user: UserProfile) {
  return { nickname: user.nickname || "", nickname_jp: user.nickname_jp || "", phone: user.phone || "", birthdate: user.birthdate || "" };
}

function bankFields(user: UserProfile) {
  return {
    accountCountry: user.accountCountry || (user.bankBranchName || user.bankBranchCode || user.accountType ? "JP" : "KR"),
    bankName: user.bankName || "", bankCode: user.bankCode || "",
    bankBranchName: user.bankBranchName || "", bankBranchCode: user.bankBranchCode || "",
    accountType: user.accountType === "TOZA" ? "TOZA" : "FUTSU",
    accountNumber: user.accountNumber || "", accountHolder: user.accountHolder || "",
  };
}

export default function ProfileEditor({ user, lang, initialSection, onClose }: {
  user: UserProfile;
  lang: Language;
  initialSection: ProfileSection;
  onClose: () => void;
}) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const basicDirty = useRef(new Set<keyof ReturnType<typeof basicFields>>());
  const bankDirty = useRef(new Set<keyof ReturnType<typeof bankFields>>());
  const [tab, setTab] = useState(initialSection);
  const [basic, setBasic] = useState(() => basicFields(user));
  const [bank, setBank] = useState(() => bankFields(user));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const japanese = lang === Language.japanese;
  const copy = japanese ? {
    title: "プロフィール編集", basic: "基本情報", bank: "振込先口座", close: "閉じる", cancel: "キャンセル",
    nickname: "ニックネーム", nicknameJp: "ニックネーム（日本語）", optional: "任意", private: "非公開",
    phone: "電話番号", birthday: "生年月日",
    privacy: "電話番号と生年月日は他のユーザーには表示されません。",
    bankHint: "割り勘の入金案内に使う口座です。基本情報は口座を登録せずに保存できます。",
    kr: "韓国口座", jp: "日本口座", bankName: "銀行", chooseBank: "銀行を選択してください",
    branchName: "支店名", branchCode: "支店コード", accountType: "口座種別", accountNumber: "口座番号", holder: "口座名義",
    transfer: "実際の送金は利用している銀行アプリで行ってください。",
    saveBasic: "基本情報を保存", saveBank: "口座情報を保存", saving: "保存中…", saved: "保存しました。",
    savedContinue: "保存しました。他のタブの入力内容はそのままです。", unsavedOther: "他のタブに未保存の入力があります。",
    invalidNickname: "ニックネームを入力してください。", invalidPhone: "電話番号の形式を確認してください。",
    invalidBirthday: "生年月日の年・月・日をすべて選択してください。",
    invalidBank: "銀行・口座番号・口座名義を入力してください。日本口座は支店名も必要です。",
    failed: "保存できませんでした。入力内容はそのまま、もう一度お試しください。",
  } : {
    title: "정보 수정", basic: "기본정보", bank: "정산 계좌", close: "닫기", cancel: "취소",
    nickname: "닉네임", nicknameJp: "일본어 닉네임", optional: "선택", private: "비공개",
    phone: "전화번호", birthday: "생년월일",
    privacy: "전화번호와 생년월일은 다른 사람에게 표시되지 않아요.",
    bankHint: "정산할 때 안내할 계좌를 등록하세요. 기본정보는 계좌 등록 없이도 저장할 수 있어요.",
    kr: "한국 계좌", jp: "일본 계좌", bankName: "은행", chooseBank: "은행을 선택해주세요",
    branchName: "지점명", branchCode: "지점 코드", accountType: "계좌 종류", accountNumber: "계좌번호", holder: "예금주",
    transfer: "실제 이체는 사용하는 은행 앱에서 진행해주세요.",
    saveBasic: "기본정보 저장", saveBank: "계좌정보 저장", saving: "저장 중…", saved: "저장했습니다.",
    savedContinue: "저장했습니다. 다른 탭의 입력 내용은 유지했어요.", unsavedOther: "다른 탭에 저장하지 않은 입력이 있어요.",
    invalidNickname: "닉네임을 입력해주세요.", invalidPhone: "전화번호 형식을 확인해주세요.",
    invalidBirthday: "생년월일의 연도·월·일을 모두 선택해주세요.",
    invalidBank: "은행·계좌번호·예금주를 입력해주세요. 일본 계좌는 지점명도 필요해요.",
    failed: "저장하지 못했습니다. 입력 내용을 유지했으니 다시 시도해주세요.",
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, []);

  useEffect(() => {
    setBasic(previous => ({ ...basicFields(user), ...Object.fromEntries([...basicDirty.current].map(field => [field, previous[field]])) }));
    setBank(previous => ({ ...bankFields(user), ...Object.fromEntries([...bankDirty.current].map(field => [field, previous[field]])) }));
  }, [user]);

  function editBasic(field: keyof typeof basic, value: string) {
    basicDirty.current.add(field);
    setBasic(previous => ({ ...previous, [field]: value }));
    setError("");
  }

  function editBank(field: keyof typeof bank, value: string) {
    bankDirty.current.add(field);
    setBank(previous => ({ ...previous, [field]: value }));
    setError("");
  }

  function switchTab(next: ProfileSection) { setTab(next); setError(""); }
  function closeEditor() { dialogRef.current?.close(); onClose(); }
  function moveTab(event: KeyboardEvent<HTMLButtonElement>) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === "Home" ? "basic" : event.key === "End" ? "bank" : tab === "basic" ? "bank" : "basic";
    switchTab(next);
    document.getElementById(`profile-tab-${next}`)?.focus();
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const form = event.currentTarget;
    let changes: Partial<UserProfile>;
    if (tab === "basic") {
      const phone = normalizeMemberPhone(basic.phone.trim());
      const birthdate = normalizeMemberBirthdate(basic.birthdate.trim());
      if (basicDirty.current.has("nickname") && !basic.nickname.trim()) { setError(copy.invalidNickname); return; }
      if (basicDirty.current.has("phone") && basic.phone.trim() && !phone) { setError(copy.invalidPhone); return; }
      if (basicDirty.current.has("birthdate") && basic.birthdate.trim() && !birthdate) { setError(copy.invalidBirthday); return; }
      const values = { nickname: basic.nickname.trim(), nickname_jp: basic.nickname_jp.trim() || null, phone, birthdate };
      changes = Object.fromEntries([...basicDirty.current].map(field => [field, values[field]]));
    } else {
      const bankName = bank.bankName.trim();
      const accountNumber = bank.accountNumber.trim();
      const accountHolder = bank.accountHolder.trim();
      if (!bankName || !accountNumber || !accountHolder || (bank.accountCountry === "JP" && !bank.bankBranchName.trim())) {
        setError(copy.invalidBank); return;
      }
      const values = {
        accountCountry: bank.accountCountry as "KR" | "JP", bankName, accountNumber, accountHolder,
        bankCode: bank.accountCountry === "KR" ? bank.bankCode.trim() || null : null,
        bankBranchName: bank.accountCountry === "JP" ? bank.bankBranchName.trim() || null : null,
        bankBranchCode: bank.accountCountry === "JP" ? bank.bankBranchCode.trim() || null : null,
        accountType: bank.accountCountry === "JP" ? bank.accountType as "FUTSU" | "TOZA" : null,
      };
      changes = bank.accountCountry !== user.accountCountry
        ? values
        : bankDirty.current.size ? { accountCountry: values.accountCountry, ...Object.fromEntries([...bankDirty.current].map(field => [field, values[field]])) } : {};
    }
    const otherDirty = () => tab === "basic" ? bankDirty.current.size > 0 : basicDirty.current.size > 0;
    if (!Object.keys(changes).length) {
      if (otherDirty()) toast(copy.unsavedOther);
      else closeEditor();
      return;
    }
    setSaving(true);
    setError("");
    try {
      const response = await clientFetch<{ success: boolean }>("/users/profile", { method: "PATCH", body: changes });
      if (!response.success) throw new Error("PROFILE_SAVE_FAILED");
      if (!form.isConnected) return;
      let savedProfile = { ...user, ...changes };
      if (tab === "basic") basicDirty.current.clear();
      else bankDirty.current.clear();
      try {
        const profile = await clientFetch<UserProfile>("/users/profile", { redirectOnUnauthorized: false });
        if (form.isConnected && profile.id === user.id) {
          savedProfile = profile;
          window.dispatchEvent(new CustomEvent(USER_CHANGED_EVENT, { detail: profile }));
        }
      } catch {
        // The write succeeded; the next profile load can retry a failed refresh.
      }
      if (!form.isConnected) return;
      if (tab === "basic") setBasic(basicFields(savedProfile));
      else setBank(bankFields(savedProfile));
      if (otherDirty()) { setSaving(false); toast.success(copy.savedContinue); }
      else { toast.success(copy.saved); closeEditor(); }
      router.refresh();
    } catch {
      if (form.isConnected) { setSaving(false); setError(copy.failed); }
    }
  }

  const inputClass = "min-h-12 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-sm text-gray-900 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100";
  const labelClass = "mb-2 block text-xs font-semibold text-gray-600";
  const privateLabel = <span className="rounded bg-gray-50 px-1.5 py-0.5 text-[10px] font-normal text-gray-400">{copy.private}</span>;

  return (
    <dialog ref={dialogRef} onCancel={event => { event.preventDefault(); if (!saving) closeEditor(); }}
      aria-labelledby="profile-editor-title"
      className="fixed inset-0 m-auto w-[calc(100%-1.5rem)] max-w-[540px] max-h-[calc(100dvh-2rem)] overflow-hidden rounded-[22px] border border-gray-100 bg-white p-0 shadow-2xl backdrop:bg-black/40 backdrop:backdrop-blur-sm">
      <div className="flex max-h-[calc(100dvh-2rem)] flex-col">
        <div className="flex items-center justify-between px-5 pb-4 pt-5 sm:px-7 sm:pt-6">
          <h2 id="profile-editor-title" className="text-xl font-bold text-gray-900">{copy.title}</h2>
          <button type="button" onClick={closeEditor} disabled={saving} aria-label={copy.close} className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-50 disabled:opacity-40">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m6 6 12 12M18 6 6 18" /></svg>
          </button>
        </div>
        <div role="tablist" aria-label={copy.title} className="flex gap-6 border-b border-gray-100 px-5 sm:px-7">
          {(["basic", "bank"] as const).map(section => (
            <button key={section} id={`profile-tab-${section}`} type="button" role="tab" aria-selected={tab === section}
              aria-controls={`profile-panel-${section}`} tabIndex={tab === section ? 0 : -1} onKeyDown={moveTab}
              onClick={() => switchTab(section)} disabled={saving}
              className={`min-h-11 border-b-2 pb-3 text-sm font-semibold ${tab === section ? "border-[#166534] text-[#166534]" : "border-transparent text-gray-400"}`}>
              {copy[section]}
            </button>
          ))}
        </div>
        <form noValidate onSubmit={save} className="flex min-h-0 flex-col overflow-hidden">
          <div className="overflow-y-auto overscroll-contain px-5 py-5 sm:px-7 sm:py-6">
            <fieldset disabled={saving}>
              <div id="profile-panel-basic" role="tabpanel" aria-labelledby="profile-tab-basic" hidden={tab !== "basic"} className={tab === "basic" ? "space-y-4" : "hidden"}>
                <div><label htmlFor="profile-nickname" className={labelClass}>{copy.nickname}</label>
                  <input id="profile-nickname" autoComplete="nickname" maxLength={20} value={basic.nickname} onChange={event => editBasic("nickname", event.target.value)} className={inputClass} /></div>
                <div><label htmlFor="profile-nickname-jp" className={labelClass}>{copy.nicknameJp}<span className="ml-1.5 text-[10px] font-normal text-gray-400">{copy.optional}</span></label>
                  <input id="profile-nickname-jp" maxLength={20} value={basic.nickname_jp} onChange={event => editBasic("nickname_jp", event.target.value)} className={inputClass} /></div>
                <div><div className="mb-2 flex items-center justify-between"><label htmlFor="profile-phone" className="text-xs font-semibold text-gray-600">{copy.phone}<span className="ml-1.5 text-[10px] font-normal text-gray-400">{copy.optional}</span></label>{privateLabel}</div>
                  <input id="profile-phone" type="tel" inputMode="tel" autoComplete="tel" value={basic.phone} onChange={event => editBasic("phone", event.target.value)} className={inputClass} /></div>
                <div><div className="mb-2 flex items-center justify-between"><label htmlFor="profile-birthdate-year" className="text-xs font-semibold text-gray-600">{copy.birthday}<span className="ml-1.5 text-[10px] font-normal text-gray-400">{copy.optional}</span></label>{privateLabel}</div>
                  <BirthdateSelect id="profile-birthdate" value={basic.birthdate} onChange={value => editBasic("birthdate", value)} lang={lang} invalid={error === copy.invalidBirthday} />
                </div>
                <p className="rounded-xl bg-green-50/50 px-3.5 py-3 text-xs leading-relaxed text-gray-500">{copy.privacy}</p>
              </div>
              <div id="profile-panel-bank" role="tabpanel" aria-labelledby="profile-tab-bank" hidden={tab !== "bank"} className={tab === "bank" ? "space-y-4" : "hidden"}>
                <p className="text-xs leading-6 text-gray-500">{copy.bankHint}</p>
                <div role="group" aria-label={copy.bank} className="flex gap-1 rounded-xl bg-gray-50 p-1">
                  {(["KR", "JP"] as const).map(country => <button key={country} type="button" aria-pressed={bank.accountCountry === country} onClick={() => editBank("accountCountry", country)} className={`min-h-11 flex-1 rounded-lg px-3 text-xs font-semibold ${bank.accountCountry === country ? "bg-white text-[#166534] shadow-sm" : "text-gray-400"}`}>{country === "KR" ? copy.kr : copy.jp}</button>)}
                </div>
                <div><label htmlFor="profile-bank" className={labelClass}>{copy.bankName}</label>
                  {bank.accountCountry === "KR" ? <select id="profile-bank" value={bank.bankName} onChange={event => { const name = event.target.value; editBank("bankName", name); editBank("bankCode", BANK_LIST.find(item => item.name === name)?.code || ""); }} className={inputClass}>
                    <option value="">{copy.chooseBank}</option>
                    {bank.bankName && !BANK_LIST.some(item => item.name === bank.bankName) && <option value={bank.bankName}>{bank.bankName}</option>}
                    {BANK_LIST.map(item => <option key={item.code} value={item.name}>{item.name}</option>)}
                  </select> : <input id="profile-bank" value={bank.bankName} maxLength={50} onChange={event => editBank("bankName", event.target.value)} className={inputClass} />}</div>
                {bank.accountCountry === "JP" && <>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label htmlFor="profile-bank-branch" className={labelClass}>{copy.branchName}</label><input id="profile-bank-branch" maxLength={50} value={bank.bankBranchName} onChange={event => editBank("bankBranchName", event.target.value)} className={inputClass} /></div>
                    <div><label htmlFor="profile-bank-branch-code" className={labelClass}>{copy.branchCode}</label><input id="profile-bank-branch-code" inputMode="numeric" maxLength={20} value={bank.bankBranchCode} onChange={event => editBank("bankBranchCode", event.target.value.replace(/\D/g, ""))} className={inputClass} /></div>
                  </div>
                  <div><label htmlFor="profile-account-type" className={labelClass}>{copy.accountType}</label><select id="profile-account-type" value={bank.accountType} onChange={event => editBank("accountType", event.target.value)} className={inputClass}><option value="FUTSU">普通</option><option value="TOZA">当座</option></select></div>
                </>}
                <div><label htmlFor="profile-account-number" className={labelClass}>{copy.accountNumber}</label><input id="profile-account-number" inputMode="numeric" maxLength={50} value={bank.accountNumber} onChange={event => editBank("accountNumber", event.target.value.replace(/\D/g, ""))} className={inputClass} /></div>
                <div><label htmlFor="profile-account-holder" className={labelClass}>{copy.holder}</label><input id="profile-account-holder" maxLength={50} value={bank.accountHolder} onChange={event => editBank("accountHolder", event.target.value)} className={inputClass} /></div>
                <p className="rounded-xl bg-green-50/50 px-3.5 py-3 text-xs leading-relaxed text-gray-500">{copy.transfer}</p>
              </div>
            </fieldset>
            {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
          </div>
          <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4 sm:px-7">
            <button type="button" onClick={closeEditor} disabled={saving} className="min-h-11 rounded-xl bg-gray-100 px-5 py-3 text-xs font-semibold text-gray-600 disabled:opacity-40">{copy.cancel}</button>
            <button type="submit" disabled={saving} aria-busy={saving} className="min-h-11 rounded-xl bg-[#166534] px-5 py-3 text-xs font-semibold text-white disabled:bg-gray-300">{saving ? copy.saving : tab === "basic" ? copy.saveBasic : copy.saveBank}</button>
          </div>
        </form>
      </div>
    </dialog>
  );
}
