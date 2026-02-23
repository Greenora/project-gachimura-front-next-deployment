"use client";

import Logo from "./Logo";
import Link from "next/link";
import { useLanguage } from "@/app/hooks/LanguageContext";

export default function Footer() {
  const { texts } = useLanguage();

  return (
    <footer className="bg-white border-t border-gray-100 pt-16 pb-8 px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between gap-12 mb-16">
          {/* 로고 및 소셜 */}
          <div className="space-y-6">
            <Logo showText={true} />
            <div className="flex items-center gap-4">
              <a href="#" className="text-gray-400 hover:text-gray-900 transition-colors">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-900 transition-colors">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
            </div>
          </div>

          {/* 링크 그룹 */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-12">
            <div className="space-y-4">
              <h4 className="text-[15px] font-black text-gray-900">{texts.footer.team}</h4>
              <ul className="space-y-2.5 text-[14px] text-gray-500 font-medium">
                <li><Link href="#" className="hover:text-green-700">{texts.footer.teamIntro}</Link></li>
                <li><Link href="#" className="hover:text-green-700">{texts.footer.teamGithub}</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="text-[15px] font-black text-gray-900">{texts.footer.service}</h4>
              <ul className="space-y-2.5 text-[14px] text-gray-500 font-medium">
                <li><Link href="#" className="hover:text-green-700">{texts.footer.serviceIntro}</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="text-[15px] font-black text-gray-900">{texts.footer.feedback}</h4>
              <ul className="space-y-2.5 text-[14px] text-gray-500 font-medium">
                <li><Link href="#" className="hover:text-green-700">{texts.footer.inquiry}</Link></li>
                <li><Link href="#" className="hover:text-green-700">{texts.footer.survey}</Link></li>
              </ul>
            </div>
          </div>
        </div>

        {/* 하단 저작권 */}
        <div className="border-t border-gray-50 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[12px] font-bold text-gray-400">
            {texts.footer.rights}
          </p>
        </div>
      </div>
    </footer>
  );
}
