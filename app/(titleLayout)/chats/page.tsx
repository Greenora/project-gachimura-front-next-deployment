"use client";

import { useCallback, useState } from "react";
import { clientFetch } from "@/app/hooks/useClientFetch";
import { useLanguage } from "@/app/hooks/LanguageContext";
import ChatList, { JoinedParty } from "@/components/chat/ChatList";
import { useVisiblePolling } from "@/app/hooks/useVisiblePolling";

export default function ChatsPage() {
  const { texts } = useLanguage();
  const [chats, setChats] = useState<JoinedParty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [request, setRequest] = useState(0);

  const loadChats = useCallback(async (signal: AbortSignal) => {
    try {
      const data = await clientFetch<JoinedParty[]>("/parties/joined-parties");
      if (!signal.aborted) { setChats(data || []); setError(""); }
    } catch (err) {
      if (!signal.aborted) setError(err instanceof Error ? err.message : texts.chat.genericError);
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [texts.chat.genericError]);
  useVisiblePolling(loadChats, true, request);

  return (
    <section className="mx-auto w-full max-w-2xl px-4 py-6 sm:py-10" aria-labelledby="chats-title">
      <h1 id="chats-title" className="mb-5 text-2xl font-bold text-gray-900">{texts.main.myChats}</h1>
      <ChatList chats={chats} loading={loading} error={error} onRetry={() => {
        setLoading(true);
        setError("");
        setRequest(value => value + 1);
      }} />
    </section>
  );
}
