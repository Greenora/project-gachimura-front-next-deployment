import PartyForm from "@/components/createParty/PartyForm";

export default function CreateParty() {
  return (
    <main className="w-full h-full min-h-screen py-12 bg-white flex justify-center">
      <div className="w-full max-w-3xl px-6">
        <PartyForm />
      </div>
      
    </main>
  );
}