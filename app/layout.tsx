import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/app/hooks/LanguageContext";
import { cookies } from "next/headers";
import { menu } from "@/app/constants/menu";
import { Language } from "@/app/common/types";
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
    //suppressHydrationWarning: 브라우저 환경 간섭 제거
    <html lang={validLang} suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light" />
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src="https://developers.kakao.com/sdk/js/kakao.min.js"></script>
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_JS_KEY}&libraries=services&autoload=false`}></script>
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans`}>
        <LanguageProvider texts={texts} lang={validLang}>
          <Toaster position="top-center" reverseOrder={false} />
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}