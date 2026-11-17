"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
import { API_CONFIG } from "@/config/api";
import { useLanguage } from "./LanguageContext";
import { useUser } from "./UserContext";
import { USER_CHANGED_EVENT } from "./useClientFetch";

const ChatNotificationsContext = createContext({ unreadCount: 0 });
const notificationId = (userId: number, partyId: number) =>
  `chat-notification-${userId}-${partyId}`;

function visibleChat() {
  const match = window.location.pathname.match(/^\/chat\/([1-9]\d*)$/);
  const partyId = match ? Number(match[1]) : null;
  return document.visibilityState === "visible" && Number.isSafeInteger(partyId)
    ? partyId
    : null;
}

export function ChatNotificationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useUser();
  const { lang } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const [unread, setUnread] = useState<{
    userId: number | null;
    rooms: Map<number, number>;
  }>({ userId: null, rooms: new Map() });
  const language = useRef(lang);
  useEffect(() => {
    language.current = lang;
  }, [lang]);

  useEffect(() => {
    if (!user?.id) return;
    const userId = user.id;
    const socket = io(API_CONFIG.SOCKET_URL, {
      transports: ["websocket"],
      withCredentials: true,
    });
    let active = true;
    // shortcut: unread counts cover this tab's current session; durable read history needs server storage.
    const seen = new Set<number>();
    const notices = new Set<string>();
    const clear = () => {
      active = false;
      socket.removeAllListeners();
      socket.disconnect();
      notices.forEach((id) => toast.dismiss(id));
      notices.clear();
      seen.clear();
      setUnread({ userId: null, rooms: new Map() });
    };
    const sessionChanged = (event: Event) => {
      if ((event as CustomEvent<{ id: number } | null>).detail?.id !== userId)
        clear();
    };
    window.addEventListener(USER_CHANGED_EVENT, sessionChanged);
    socket.on(
      "chatNotification",
      (payload: { partyId?: number; messageId?: number } | null) => {
        const partyId = payload?.partyId;
        const messageId = payload?.messageId;
        if (
          !active ||
          typeof partyId !== "number" ||
          !Number.isSafeInteger(partyId) ||
          partyId < 1 ||
          typeof messageId !== "number" ||
          !Number.isSafeInteger(messageId) ||
          messageId < 1 ||
          seen.has(messageId)
        )
          return;
        seen.add(messageId);
        if (seen.size > 256) seen.delete(seen.values().next().value!);
        if (visibleChat() === partyId) return;
        setUnread((previous) => {
          const rooms = new Map(
            previous.userId === userId ? previous.rooms : [],
          );
          rooms.set(partyId, Math.min((rooms.get(partyId) || 0) + 1, 100));
          if (rooms.size > 100) rooms.delete(rooms.keys().next().value!);
          return { userId, rooms };
        });
        if (document.visibilityState !== "visible") return;
        const id = notificationId(userId, partyId);
        notices.add(id);
        if (notices.size > 100) {
          const oldest = notices.values().next().value!;
          toast.dismiss(oldest);
          notices.delete(oldest);
        }
        const japanese = language.current === "japanese";
        toast(
          (t) => (
            <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <span>
                {japanese
                  ? "新しいチャットメッセージが届きました。"
                  : "새 채팅 메시지가 도착했어요."}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (!active) return;
                  toast.dismiss(t.id);
                  router.push(`/chat/${partyId}`);
                }}
                className="min-h-11 shrink-0 font-semibold text-[#166534] underline"
              >
                {japanese ? "チャットを見る" : "채팅방 보기"}
              </button>
            </div>
          ),
          { id, duration: 6000 },
        );
      },
    );
    return () => {
      window.removeEventListener(USER_CHANGED_EVENT, sessionChanged);
      clear();
    };
  }, [user?.id, router]);

  useEffect(() => {
    const read = () => {
      const partyId = visibleChat();
      if (!user?.id || !partyId) return;
      toast.dismiss(notificationId(user.id, partyId));
      setUnread((previous) => {
        if (previous.userId !== user.id || !previous.rooms.has(partyId))
          return previous;
        const rooms = new Map(previous.rooms);
        rooms.delete(partyId);
        return { userId: user.id, rooms };
      });
    };
    read();
    window.addEventListener("focus", read);
    document.addEventListener("visibilitychange", read);
    return () => {
      window.removeEventListener("focus", read);
      document.removeEventListener("visibilitychange", read);
    };
  }, [pathname, user?.id]);

  const unreadCount =
    unread.userId === user?.id
      ? [...unread.rooms.values()].reduce((sum, count) => sum + count, 0)
      : 0;
  return (
    <ChatNotificationsContext.Provider value={{ unreadCount }}>
      {children}
    </ChatNotificationsContext.Provider>
  );
}

export function useChatNotifications() {
  return useContext(ChatNotificationsContext);
}
