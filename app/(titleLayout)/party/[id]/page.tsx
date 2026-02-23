import PartyDetailClient from "@/components/party/PartyDetailClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PartyDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <PartyDetailClient partyId={id} />;
}