"use client";

import { usePathname } from "next/navigation";
import WritePostButton from "@/components/main/WritePostButton";
import { useLanguage } from "@/app/hooks/LanguageContext";

export default function BottomRightQuickAction() {
  const pathname = usePathname();
  const { texts } = useLanguage();

  const isHome = pathname.startsWith("/home");

  if (!isHome) {
    return null;
  }

  return (
    <div className="fixed bottom-10 right-10 z-[100]" role="complementary" aria-label={texts.main.quickActionsAria}>
      <WritePostButton variant="floating" />
    </div>
  );
}
