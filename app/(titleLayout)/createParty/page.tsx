import PartyForm from "@/components/createParty/PartyForm";

export default function CreateParty() {
  return (
    <main className="w-full h-full px-47 py-8 bg-white">
      <h2 className="text-2xl font-bold text-center mb-10 text-gray-800">모임 등록</h2>
      
      <PartyForm />
      
    </main>
  );
}