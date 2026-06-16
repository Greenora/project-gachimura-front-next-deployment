"use client";

import { useEffect, useMemo, useState } from "react";
import Avatar from "@/components/common/Avatar";
import { Language } from "@/app/common/types";

interface CommunityComposerDrawerProps {
  isOpen: boolean;
  lang: Language;
  onClose: () => void;
  onSubmit: (value: { content: string; linkedPartyId: number | null }) => void;
  linkableParties?: Array<{ id: number; title: string; storeName?: string | null }>;
}

export default function CommunityComposerDrawer({
  isOpen,
  lang,
  onClose,
  onSubmit,
  linkableParties = [],
}: CommunityComposerDrawerProps) {
  const [content, setContent] = useState("");
  const [linkedPartyId, setLinkedPartyId] = useState("");
  const maxLength = 240;

  const texts = useMemo(() => {
    if (lang === Language.japanese) {
      return {
        title: "投稿を作成",
        placeholder:
          "例) ○○スーパーの卵は夕方に割引されることが多いです。\n例) 2kgヨーグルトは3人で分けると1人あたり約700円でした。",
        cancel: "キャンセル",
        submit: "投稿する",
        me: "私",
        linkedPartyLabel: "自分の集まりをリンク",
        linkedPartyEmpty: "リンクしない",
        guidelineTitle: "投稿ガイド",
        guidelines: [
          "個人情報や口座番号は本文に書かず、必要な案内は集まり内で共有しましょう。",
          "支払い・受け渡しの相談は、承認された集まりで行いましょう。",
          "お得情報、買い物メモ、一緒に分けたい商品の話を気軽にどうぞ。",
        ],
      };
    }

    return {
      title: "새 글 작성",
      placeholder:
        "예) OO마트 계란은 저녁 7시쯤 할인 들어와요.\n예) 2kg 요거트 3명이 나누니 1인당 7천 원 정도였어요.",
      cancel: "취소",
      submit: "게시하기",
      me: "나",
      linkedPartyLabel: "내 모임 연결하기",
      linkedPartyEmpty: "연결하지 않기",
      guidelineTitle: "작성 가이드",
      guidelines: [
        "계좌번호 같은 개인정보는 글에 직접 쓰지 말고, 필요한 안내는 모임 안에서 공유해주세요.",
        "입금이나 수령 일정은 승인된 모임에서 이야기해주세요.",
        "할인 소식, 장보기 메모, 같이 나누고 싶은 상품 이야기를 편하게 남겨주세요.",
      ],
    };
  }, [lang]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = content.trim();

    if (!trimmed) {
      return;
    }

    onSubmit({
      content: trimmed,
      linkedPartyId: linkedPartyId ? Number(linkedPartyId) : null,
    });
    setContent("");
    setLinkedPartyId("");
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-[110] bg-black/30 transition-opacity duration-300 ${
          isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={`fixed right-0 top-0 z-[120] flex h-full w-full max-w-md flex-col border-l border-gray-200 bg-white shadow-2xl transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label={texts.title}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-[18px] font-black tracking-tight text-gray-900">{texts.title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
            aria-label={texts.cancel}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex h-full flex-col">
          <div className="flex-1 space-y-4 px-5 py-5">
            <div className="flex items-center gap-3">
              <Avatar nickname={texts.me} size={40} />
              <p className="text-[14px] font-bold text-gray-800">@{texts.me}</p>
            </div>

            <div className="rounded-2xl border border-green-100 bg-green-50/70 px-4 py-3">
              <p className="mb-2 text-[12px] font-black text-green-800">{texts.guidelineTitle}</p>
              <ul className="space-y-1 text-[12px] font-medium leading-5 text-green-900/80">
                {texts.guidelines.map((guideline) => (
                  <li key={guideline}>- {guideline}</li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-black text-gray-600">
                {texts.linkedPartyLabel}
              </label>
              <select
                value={linkedPartyId}
                onChange={(event) => setLinkedPartyId(event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-[13px] font-bold text-gray-700 outline-none transition-all focus:border-green-600 focus:ring-4 focus:ring-green-50"
              >
                <option value="">{texts.linkedPartyEmpty}</option>
                {linkableParties.map((party) => (
                  <option key={party.id} value={party.id}>
                    {party.title}
                    {party.storeName ? ` · ${party.storeName}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value.slice(0, maxLength))}
              placeholder={texts.placeholder}
              className="h-52 w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-[15px] text-gray-800 outline-none transition-all focus:border-green-600 focus:ring-4 focus:ring-green-50"
            />

            <p className="text-right text-[12px] font-bold text-gray-400">
              {content.length}/{maxLength}
            </p>
          </div>

          <div className="border-t border-gray-100 px-5 py-4">
            <button
              type="submit"
              disabled={!content.trim()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#166534] px-5 py-3 text-[14px] font-black text-white shadow-lg shadow-green-900/20 transition-all hover:bg-[#14532d] disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M22 2L11 13"></path>
                <path d="M22 2L15 22L11 13L2 9L22 2Z"></path>
              </svg>
              {texts.submit}
            </button>
          </div>
        </form>
      </aside>
    </>
  );
}
