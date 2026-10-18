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
      <div className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 sm:bottom-10 sm:right-10 z-40" role="complementary" aria-label={texts.main.quickActionsAria}>
        <CreatePartyButton variant="floating" />
      </div>
    );
  }

  if (isCommunity) {
    return (
      <div className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 sm:bottom-10 sm:right-10 z-40" role="complementary" aria-label={texts.main.quickActionsAria}>
        <WritePostButton variant="floating" />
      </div>
    );
  }

  return null;
}
