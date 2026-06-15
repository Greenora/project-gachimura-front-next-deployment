import PartyForm from "@/components/createParty/PartyForm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { API_CONFIG } from "@/config/api";

async function getUserProfile(token: string) {
  try {
    const res = await fetch(`${API_CONFIG.INTERNAL_BASE_URL}/users/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    return null;
  }
}

export default async function CreateParty() {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;

  if (!token) {
    redirect("/login");
  }

  const userProfile = await getUserProfile(token);
  if (!userProfile) {
    redirect("/login");
  }

  if (!userProfile.accountNumber) {
    redirect(`/user/${userProfile.id}?error=accountNumber`);
  }

  return (
    <main className="w-full h-full min-h-screen py-12 bg-white flex justify-center">
      <div className="w-full max-w-3xl px-6">
        <PartyForm />
      </div>
    </main>
  );
}