import PartyForm from "@/components/createParty/PartyForm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
export default async function CreateParty() {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;

  if (!token) {
    redirect("/login");
  }

  return (
    <main className="w-full h-full min-h-screen py-12 bg-white flex justify-center">
      <div className="w-full max-w-3xl px-6">
        <PartyForm />
      </div>
    </main>
  );
}
