"use client";

import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/app/hooks/LanguageContext";

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export default function Logo({ className = "", showText = true }: LogoProps) {
  const { texts } = useLanguage();

  return (
    <Link href="/" className={`flex items-center gap-1 group ${className}`}>
      <div className="relative w-12 h-12 transition-transform group-hover:rotate-12">
        <Image
          src="/images/gachimura_logo.png"
          alt="가치무라 로고"
          fill
          className="object-contain"
        />
      </div>
      {showText && (
        <span className="text-[22px] font-black text-[#33612E] tracking-tight">
          {texts.home.gachimura}
        </span>
      )}
    </Link>
  );
}
