import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import { LanguageProvider } from "@/app/hooks/LanguageContext";
import { cookies } from "next/headers";
import { menu } from "@/app/constants/menu";
import { Language } from "@/app/common/types";
import Script from "next/script"; 
import { Toaster } from "react-hot-toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "GACHIMURA",
    template: "%s | GACHIMURA",
  },
  description: "함께 장보고 생활비 아끼자! 알뜰한 사람들의 소통 플랫폼, 가치무라",
  openGraph: {
    title: "GACHIMURA",
    description: "함께 장보고 생활비 아끼자! 알뜰한 사람들의 소통 플랫폼, 가치무라",
    locale: "ko_KR",
    type: "website",
  },
  icons: {
    icon: "/images/gachimura_logo.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("language")?.value as Language) || Language.korean;
  const validLang = Object.values(Language).includes(lang) ? lang : Language.korean;
  const texts = menu[validLang];

  return (
    <html lang={validLang}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans`}>
        <LanguageProvider texts={texts} lang={validLang}>
          <Toaster position="top-center" reverseOrder={false} />
          <div className="absolute top-4 right-4 z-50">
            <LanguageSwitcher />
          </div>
          {children}
        </LanguageProvider>

        <Script
          src="https://developers.kakao.com/sdk/js/kakao.min.js"
          strategy="beforeInteractive" 
        />
        
      </body>
    </html>
  );
}