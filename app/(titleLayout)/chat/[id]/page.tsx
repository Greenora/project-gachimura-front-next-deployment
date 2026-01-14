import ChatContainer from "@/components/chat/ChatContainer";
import { API_CONFIG } from "@/config/api";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

async function getChatData(partyId: number) {
  try {
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

async function getUserProfile(token: string) {
  try {
    const res = await fetch(`${API_CONFIG.INTERNAL_BASE_URL}/users/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    return null;
  }
}

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const currentPartyId = parseInt(id, 10);

  if (isNaN(currentPartyId)) {
    return <div>유효하지 않은 모임 번호입니다.</div>;
  }

  // 1. 토큰 확인 및 유저 정보 가져오기
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;

  if (!token) {
    redirect(`/login?callbackUrl=/chat/${id}`);
  }

  const userProfile = await getUserProfile(token);
  if (!userProfile) {
    redirect(`/login?callbackUrl=/chat/${id}`);
  }

  // 2. 채팅 데이터 가져오기
  const { formattedMessages, formattedMembers, hostId, partyInfo } = await getChatData(currentPartyId);

  // 3. 멤버인지 확인 (보안 강화)
  const isMember = formattedMembers.some((m: any) => m.id === userProfile.id && m.status === 'APPROVED');
  const isHost = hostId === userProfile.id;

  if (!isMember && !isHost) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <h1 className="text-2xl font-bold">접근 권한 없음</h1>
        <p className="text-gray-500">이 채팅방의 회원이 아닙니다. 모임에 가입 신청을 먼저 해주세요.</p>
        <Link
          href="/"
          className="px-6 py-2 bg-[#166534] text-white rounded-lg font-medium"
        >
          홈으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <main className="w-full h-full">
      <ChatContainer
        partyId={currentPartyId}
        initialMessages={formattedMessages}
        initialMembers={formattedMembers}
        hostId={hostId}
        partyInfo={partyInfo}
        currentUser={userProfile}
      />
    </main>
  );
}