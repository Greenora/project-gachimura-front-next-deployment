import ChatContainer from "@/components/chat/ChatContainer";
import { API_CONFIG } from "@/config/api";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Language } from "@/app/common/types";
import { menu } from "@/app/constants/menu";

async function getChatData(partyId: number, token: string, unknownNickname: string) {
  try {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const [msgRes, memberRes, partyRes] = await Promise.all([
      fetch(`${API_CONFIG.INTERNAL_BASE_URL}/chat-message/${partyId}`, {
        headers,
        cache: 'no-store'
      }),
      fetch(`${API_CONFIG.INTERNAL_BASE_URL}/party-members/${partyId}`, {
        headers,
        cache: 'no-store'
      }),
      fetch(`${API_CONFIG.INTERNAL_BASE_URL}/parties/${partyId}`, {
        headers,
        cache: 'no-store'
      })
    ]);

    const [messages, members, party] = await Promise.all([
      msgRes.json(),
      memberRes.json(),
      partyRes.json()
    ]);

    const formattedMessages = messages.map((m: any) => ({
      userId: m.senderId ?? 0,
      nickname: m.sender?.nickname || unknownNickname,
      nickname_jp: m.sender?.nickname_jp,
      profileImage: m.sender?.profileImage,
      message: m.content,
      partyId: m.partyId,
      messageType: m.messageType,
      createdAt: m.createdAt
    }));

    const formattedMembers = members.map((m: any) => ({
      id: m.userId,
      nickname: m.user?.nickname || unknownNickname,
      nickname_jp: m.user?.nickname_jp,
      profileImage: m.user?.profileImage,
      status: m.status
    }));

    return {
      formattedMessages,
      formattedMembers,
      hostId: party.host?.id,
      partyInfo: {
        ...party,
        meetDate: party.meetingDate,
        storeName: party.location?.name
      }
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

  // 1. 토큰 확인 및 유저 정보 가져오기
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;
  const lang = (cookieStore.get("language")?.value as Language) || Language.korean;
  const validLang = Object.values(Language).includes(lang) ? lang : Language.korean;
  const texts = menu[validLang];

  if (isNaN(currentPartyId)) {
    return <div>{texts.chat.invalidPartyId}</div>;
  }

  if (!token) {
    redirect(`/login?callbackUrl=/chat/${id}`);
  }

  const userProfile = await getUserProfile(token);
  if (!userProfile) {
    redirect(`/login?callbackUrl=/chat/${id}`);
  }

  // 2. 채팅 데이터 가져오기 (인증 토큰 포함)
  const { formattedMessages, formattedMembers, hostId, partyInfo } = await getChatData(currentPartyId, token, texts.chat.unknownNickname);

  // 3. 멤버인지 확인 (보안 강화)
  const isMember = formattedMembers.some((m: any) => m.id === userProfile.id && m.status === 'APPROVED');
  const isHost = hostId === userProfile.id;

  if (!isMember && !isHost) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <h1 className="text-2xl font-bold">{texts.chat.noAccessTitle}</h1>
        <p className="text-gray-500">{texts.chat.noAccessDescription}</p>
        <Link
          href="/"
          className="px-6 py-2 bg-[#166534] text-white rounded-lg font-medium"
        >
          {texts.chat.backToHome}
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