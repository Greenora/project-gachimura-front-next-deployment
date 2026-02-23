import { cookies } from "next/headers";
import { Language } from "@/app/common/types";
import { API_CONFIG } from "@/config/api";
import UserProfileView from "@/components/user/UserProfileView";

async function getUser(id: string) {
  try {
    const res = await fetch(`${API_CONFIG.INTERNAL_BASE_URL}/users/${id}`, {
      next: { revalidate: 0 },
    });
    if (!res.ok) {
      console.error(`User fetch failed: ${res.status}`);
      return null;
    }
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
}

async function getParties(id: string) {
  try {
    const res = await fetch(`${API_CONFIG.INTERNAL_BASE_URL}/parties/user/${id}`, {
      next: { revalidate: 0 },
    });
    if (!res.ok) {
      console.error(`Parties fetch failed: ${res.status}`);
      return [];
    }
    const text = await res.text();
    return text ? JSON.parse(text) : [];
  } catch (error) {
    console.error("Error fetching parties:", error);
    return [];
  }
}

export default async function UserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const lang = (cookieStore.get("language")?.value as Language) || Language.korean;
  const validLang = Object.values(Language).includes(lang) ? lang : Language.korean;

  const [user, parties] = await Promise.all([
    getUser(id),
    getParties(id)
  ]);

  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
        <div className="text-6xl mb-6">🔍</div>
        <h1 className="text-2xl font-bold text-gray-900">사용자를 찾을 수 없습니다.</h1>
        <p className="mt-2 text-gray-500">존재하지 않거나 삭제된 유저입니다.</p>
      </div>
    );
  }

  return <UserProfileView user={user} parties={parties} lang={validLang} />;
}
