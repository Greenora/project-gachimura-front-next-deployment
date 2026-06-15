import SettlementClient from "@/components/settlement/SettlementClient";
import { API_CONFIG } from "@/config/api";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Language } from "@/app/common/types";
import { menu } from "@/app/constants/menu";
import type { ComponentProps } from "react";

type SettlementPageProps = ComponentProps<typeof SettlementClient>;
type SettlementData = SettlementPageProps["initialSettlement"];
type PartyInfo = SettlementPageProps["partyInfo"];
type Member = SettlementPageProps["members"][number];
type CurrentUser = SettlementPageProps["currentUser"];
type Payment = SettlementPageProps["initialPayments"][number];

interface PartyApiResponse {
  id: number;
  title?: string;
  meetingDate?: string;
  storeName?: string;
  location?: { name?: string };
  host?: { id?: number };
  hostId?: number;
}

interface PartyMemberApiResponse {
  userId: number;
  status: string;
  user?: {
    nickname?: string;
    profileImage?: string;
  };
}

async function getSettlementData(
  partyId: number,
  token: string,
  unknownNickname: string
) {
  try {
    const [settlementRes, partyRes, membersRes] = await Promise.all([
      fetch(`${API_CONFIG.INTERNAL_BASE_URL}/settlements/party/${partyId}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      }),
      fetch(`${API_CONFIG.INTERNAL_BASE_URL}/parties/${partyId}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      }),
      fetch(`${API_CONFIG.INTERNAL_BASE_URL}/party-members/${partyId}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      }),
    ]);

    const accessDenied = settlementRes.status === 403 || membersRes.status === 403;

    let settlement: SettlementData = null;
    if (settlementRes.ok) {
      const text = await settlementRes.text();
      if (text && text !== "null") {
        try {
          settlement = JSON.parse(text) as NonNullable<SettlementData>;
        } catch {}
      }
    }

    let party: PartyApiResponse | null = null;
    if (partyRes.ok) {
      party = (await partyRes.json()) as PartyApiResponse;
    } else {
      console.error("Party API 실패:", partyRes.status, await partyRes.text().catch(() => ""));
    }

    let membersData: PartyMemberApiResponse[] = [];
    if (membersRes.ok) {
      membersData = (await membersRes.json()) as PartyMemberApiResponse[];
    } else {
      console.error("Members API 실패:", membersRes.status, await membersRes.text().catch(() => ""));
    }

    const formattedMembers: Member[] = Array.isArray(membersData)
      ? membersData
          .filter((member) => member.status === "APPROVED")
          .map((member) => ({
            id: member.userId,
            nickname: member.user?.nickname || unknownNickname,
            profileImage: member.user?.profileImage,
          }))
      : [];

    return {
      settlement,
      party: (party
        ? {
            id: party.id,
            title: party.title || "",
            meetDate: party.meetingDate || "",
            storeName: party.location?.name || party.storeName || "",
            hostId: party.host?.id || party.hostId,
          }
        : null) as PartyInfo,
      members: formattedMembers,
      accessDenied,
    };
  } catch (error) {
    console.error("정산 데이터 페칭 실패:", error);
    return { settlement: null, party: null, members: [], accessDenied: false };
  }
}

async function getUserProfile(token: string): Promise<CurrentUser | null> {
  try {
    const res = await fetch(`${API_CONFIG.INTERNAL_BASE_URL}/users/profile`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as CurrentUser;
  } catch {
    return null;
  }
}

async function getPayments(
  settlementId: number,
  token: string
): Promise<Payment[]> {
  try {
    const res = await fetch(
      `${API_CONFIG.INTERNAL_BASE_URL}/settlements/${settlementId}/payments`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      }
    );
    if (!res.ok) return [];
    return (await res.json()) as Payment[];
  } catch {
    return [];
  }
}

export default async function SettlementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const partyId = parseInt(id, 10);

  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;
  const lang = (cookieStore.get("language")?.value as Language) || Language.korean;
  const validLang = Object.values(Language).includes(lang) ? lang : Language.korean;
  const texts = menu[validLang];

  if (!token) {
    redirect(`/login?callbackUrl=/settlement/${id}`);
  }

  if (isNaN(partyId)) {
    return <div className="p-8 text-center text-gray-500">{texts.settlement.invalidPartyId}</div>;
  }

  const userProfile = await getUserProfile(token);
  if (!userProfile) {
    redirect(`/login?callbackUrl=/settlement/${id}`);
  }

  const { settlement, party, members, accessDenied } = await getSettlementData(
    partyId,
    token,
    texts.chat.unknownNickname
  );

  if (accessDenied) {
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

  let payments: Payment[] = [];
  if (settlement?.id) {
    payments = await getPayments(settlement.id, token);
  }

  return (
    <main className="w-full min-h-screen bg-white">
      <SettlementClient
        partyId={partyId}
        initialSettlement={settlement}
        partyInfo={party}
        members={members}
        currentUser={userProfile}
        initialPayments={payments}
      />
    </main>
  );
}
