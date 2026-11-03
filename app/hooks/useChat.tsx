import { useCallback, useEffect, useRef, useState } from "react";
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

export function useChat(partyId: number) {
  const socketRef = useRef<Socket | null>(null);
  const roomJoinedRef = useRef(false);
  const [received, setReceived] = useState<{ partyId: number; messages: ChatPayload[] }>({ partyId, messages: [] });
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected" | "error">("connecting");
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const buildMessageKey = (payload: ChatPayload) => {
    const normalizedType = payload.messageType ?? "TALK";
    const normalizedTimestamp = payload.createdAt ? String(new Date(payload.createdAt).getTime()) : "";
    const normalizedUserId = payload.userId ?? 0;
    return `${normalizedTimestamp}|${normalizedUserId}|${normalizedType}|${payload.message}`;
  };

  useEffect(() => {
    if (!partyId || partyId <= 0 || Number.isNaN(partyId)) return;

    // 1. 소켓 연결
    const newSocket = io(API_CONFIG.SOCKET_URL, {
      transports: ["websocket"],
      withCredentials: true,
    });
    let connectionAttempt = 0;

    // 2. 연결 성공 시 이벤트
    newSocket.on("connect", () => {
      const attempt = ++connectionAttempt;
      roomJoinedRef.current = false;
      setConnectionStatus("connecting");
      setConnectionError(null);

      newSocket.timeout(8000).emit("joinRoom", { partyId }, (error: Error | null, response?: { ok: boolean; error?: string }) => {
        if (socketRef.current !== newSocket || !newSocket.connected || attempt !== connectionAttempt) return;
        if (error || response?.ok !== true) {
          setConnectionStatus("error");
          setConnectionError(response?.error || null);
          return;
        }
        roomJoinedRef.current = true;
        setConnectionStatus("connected");
      });
    });

    // 3. 메시지 수신 (Payload 객체로 받음)
    newSocket.on("message", (payload: ChatPayload) => {
      if (payload.partyId !== partyId) return;
      // 중복 수신 방지: 동일 메시지 키가 있으면 추가하지 않음
      setReceived((received) => {
        const prev = received.partyId === partyId ? received.messages : [];
        const nextKey = buildMessageKey(payload);
        const isDuplicate = prev.some((msg) => buildMessageKey(msg) === nextKey);
        if (isDuplicate) return received;
        return { partyId, messages: [...prev, { ...payload, messageType: payload.messageType ?? "TALK" }] };
      });
    });

    newSocket.on("connect_error", () => {
      roomJoinedRef.current = false;
      setConnectionStatus("error");
      setConnectionError(null);
    });
    newSocket.on("disconnect", () => {
      connectionAttempt++;
      roomJoinedRef.current = false;
      setConnectionStatus((status) => status === "error" ? status : "disconnected");
    });
    newSocket.on("error", (msg: string) => {
      roomJoinedRef.current = false;
      setConnectionStatus("error");
      setConnectionError(typeof msg === "string" ? msg : null);
    });

    socketRef.current = newSocket;

    return () => {
      roomJoinedRef.current = false;
      socketRef.current = null;
      newSocket.removeAllListeners();
      newSocket.disconnect();
    };
  }, [partyId]);

  // 메시지 전송 함수
  const sendMessage = useCallback(async (msg: string): Promise<boolean> => {
    const socket = socketRef.current;
    if (!socket?.connected || !roomJoinedRef.current || connectionStatus !== "connected" || !msg.trim() || msg.length > 2000) return false;
    const connectionId = socket.id;
    return new Promise(resolve => {
      const disconnected = () => resolve(false);
      socket.once("disconnect", disconnected);
      socket.timeout(8000).emit("message", { partyId, message: msg }, (error: Error | null, response?: { ok: boolean; error?: string }) => {
        socket.off("disconnect", disconnected);
        if (socketRef.current !== socket || !socket.connected || socket.id !== connectionId) return resolve(false);
        if (error || response?.ok !== true) {
          roomJoinedRef.current = false;
          setConnectionStatus("error");
          setConnectionError(response?.error || null);
          return resolve(false);
        }
        resolve(true);
      });
    });
  }, [partyId, connectionStatus]);

  const reconnect = useCallback(() => {
    if (!socketRef.current) return;
    roomJoinedRef.current = false;
    socketRef.current.disconnect();
    setConnectionStatus("connecting");
    setConnectionError(null);
    socketRef.current.connect();
  }, []);

  return {
    messages: received.partyId === partyId ? received.messages : [],
    sendMessage,
    connectionStatus,
    connectionError,
    reconnect,
  };
}
