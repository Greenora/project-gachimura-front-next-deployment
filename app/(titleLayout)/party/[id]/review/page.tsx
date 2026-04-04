import { ReactNode } from "react";
import ReviewPageContent from "./ReviewPageContent";

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<ReactNode> {
  const { id } = await params;
  const partyId = parseInt(id, 10);

  return <ReviewPageContent partyId={partyId} />;
}
