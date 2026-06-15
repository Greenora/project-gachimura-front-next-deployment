"use client";

import { usePathname } from "next/navigation";
import WritePostButton from "@/components/main/WritePostButton";
import CreatePartyButton from "@/components/main/CreatePartyButton";
import { useLanguage } from "@/app/hooks/LanguageContext";

export default function BottomRightQuickAction() {
  const pathname = usePathname();
  const { texts } = useLanguage();

  const isHome = pathname.startsWith("/home");
  const isCommunity = pathname.startsWith("/community");

  if (isHome) {
    return (
      <div className="fixed bottom-10 right-10 z-[100]" role="complementary" aria-label={texts.main.quickActionsAria}>
        <CreatePartyButton variant="floating" />
      </div>
    );
  }

  if (isCommunity) {
    return (
      <div className="fixed bottom-10 right-10 z-[100]" role="complementary" aria-label={texts.main.quickActionsAria}>
        <WritePostButton variant="floating" />
      </div>
    );
  }

  return null;
}
