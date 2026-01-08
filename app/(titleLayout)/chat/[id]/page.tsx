import ChatContainer from "@/components/chat/ChatContainer";
import { API_CONFIG } from "@/config/api";

async function getChatData(partyId: number) {
  try {
    // Docker 내부 네트워크(INTERNAL_BASE_URL)를 통해 데이터 페칭
    const [msgRes, memberRes, partyRes] = await Promise.all([
      fetch(`${API_CONFIG.INTERNAL_BASE_URL}/chat-message/${partyId}`, { cache: 'no-store' }),
      fetch(`${API_CONFIG.INTERNAL_BASE_URL}/party-members/${partyId}`, { cache: 'no-store' }),
      fetch(`${API_CONFIG.INTERNAL_BASE_URL}/parties/${partyId}`, { cache: 'no-store' })
    ]);

    const [messages, members, party] = await Promise.all([
      msgRes.json(),
      memberRes.json(),
      partyRes.json()
    ]);

    const formattedMessages = messages.map((m: any) => ({
      userId: m.senderId,
      nickname: m.sender?.nickname || "알 수 없음",
      profileImage: m.sender?.profileImage,
      message: m.content,
      partyId: m.partyId,
      messageType: m.messageType,
      createdAt: m.createdAt
    }));

    const formattedMembers = members.map((m: any) => ({
      id: m.userId,
      nickname: m.user?.nickname || "알 수 없음",
      profileImage: m.user?.profileImage,
      status: m.status
    }));

    return {
      formattedMessages,
      formattedMembers,
      hostId: party.hostId,
      partyInfo: party
    };
  } catch (error) {
    console.error("데이터 페칭 실패:", error);
    return { formattedMessages: [], formattedMembers: [], hostId: null, partyInfo: null };
  }
}

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const currentPartyId = parseInt(id, 10);

  if (isNaN(currentPartyId)) {
    return <div>유효하지 않은 모임 번호입니다.</div>;
  }

  const { formattedMessages, formattedMembers, hostId, partyInfo } = await getChatData(currentPartyId);

  return (
    <main className="w-full h-full">
      <ChatContainer
        partyId={currentPartyId}
        initialMessages={formattedMessages}
        initialMembers={formattedMembers}
        hostId={hostId}
        partyInfo={partyInfo}
      />
    </main>
  );
}