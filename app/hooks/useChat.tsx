import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { API_CONFIG } from "@/config/api";

export interface ChatPayload {
  userId: number;
  partyId: number;
  message: string;
  nickname: string;
  profileImage?: string | null;
  messageType?: "TALK" | "SYSTEM";
  createdAt?: string;
}

export function useChat(userId: number, nickname: string, partyId: number, profileImage?: string | null) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<ChatPayload[]>([]);

  useEffect(() => {
    // 1. 소켓 연결
    const newSocket = io(API_CONFIG.SOCKET_URL, { transports: ["websocket"] });

    // 2. 연결 성공 시 이벤트
    newSocket.on("connect", () => {
      console.log("Chat Connected! ID:", newSocket.id);

      // 방 입장 요청
      newSocket.emit("joinRoom", { userId, partyId });
    });

    // 3. 메시지 수신 (Payload 객체로 받음)
    newSocket.on("message", (payload: ChatPayload) => {
      // 내 방 메시지인지 확인하거나, 소켓 룸 기능을 믿고 업데이트
      setMessages((prev) => [...prev, payload]);
    });

    // 4. 에러 수신
    newSocket.on("error", (msg: string) => {
      alert(msg);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [userId, partyId]); // 유저나 방이 바뀌면 재연결

  // 메시지 전송 함수
  const sendMessage = (msg: string) => {
    if (socket) {
      const payload: ChatPayload = {
        userId,
        nickname,
        profileImage,
        partyId,
        message: msg,
      };

      socket.emit("message", payload);
    }
  };

  return { messages, sendMessage };
}