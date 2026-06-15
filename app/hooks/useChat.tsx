import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { API_CONFIG } from "@/config/api";

export interface ChatPayload {
  userId: number;
  partyId: number;
  message: string;
  nickname: string;
  nickname_jp?: string;
  profileImage?: string | null;
  messageType?: "TALK" | "SYSTEM" | "SYSTEM_REVIEW";
  createdAt?: string;
}

function getCookieValue(name: string) {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(^|;)\\s*${name}\\s*=\\s*([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
}

export function useChat(partyId: number) {
  const socketRef = useRef<Socket | null>(null);
  const [messages, setMessages] = useState<ChatPayload[]>([]);

  const buildMessageKey = (payload: ChatPayload) => {
    const normalizedType = payload.messageType ?? "TALK";
    const normalizedTimestamp = payload.createdAt ? String(new Date(payload.createdAt).getTime()) : "";
    const normalizedUserId = payload.userId ?? 0;
    return `${normalizedTimestamp}|${normalizedUserId}|${normalizedType}|${payload.message}`;
  };

  useEffect(() => {
    // 1. 소켓 연결
    const token = getCookieValue("accessToken");
    const newSocket = io(API_CONFIG.SOCKET_URL, {
      transports: ["websocket"],
      auth: { token },
    });

    // 2. 연결 성공 시 이벤트
    newSocket.on("connect", () => {
      console.log("Chat Connected! ID:", newSocket.id);

      // 방 입장 요청
      newSocket.emit("joinRoom", { partyId });
    });

    // 3. 메시지 수신 (Payload 객체로 받음)
    newSocket.on("message", (payload: ChatPayload) => {
      // 중복 수신 방지: 동일 메시지 키가 있으면 추가하지 않음
      setMessages((prev) => {
        const nextKey = buildMessageKey(payload);
        const isDuplicate = prev.some((msg) => buildMessageKey(msg) === nextKey);
        if (isDuplicate) return prev;
        return [...prev, { ...payload, messageType: payload.messageType ?? "TALK" }];
      });
    });

    // 4. 에러 수신
    newSocket.on("error", (msg: string) => {
      alert(msg);
    });

    socketRef.current = newSocket;

    return () => {
      socketRef.current = null;
      newSocket.disconnect();
    };
  }, [partyId]);

  // 메시지 전송 함수
  const sendMessage = (msg: string) => {
    if (socketRef.current) {
      socketRef.current.emit("message", { partyId, message: msg });
    }
  };

  return { messages, sendMessage };
}
