"use client";

import { motion } from "framer-motion";

interface FeatureItemProps {
  title: string;
  description: string;
  image?: string;
  reverse?: boolean;
}

export default function FeatureItem({
  title,
  description,
  image,
  reverse = false,
}: FeatureItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 100 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className={`flex flex-col ${reverse ? "md:flex-row-reverse" : "md:flex-row"
        } items-center gap-12`}
    >
      <div className="flex-1 space-y-4">
        <h3 className="text-3xl font-bold">{title}</h3>
        <p className="text-slate-600 text-lg leading-relaxed">{description}</p>
      </div>
      <div className="flex-1 w-full aspect-video bg-slate-200 rounded-3xl shadow-2xl overflow-hidden relative">
        {/* 임시 박스 - 실제 이미지로 교체 시 <Image /> 사용 */}
        <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-bold">
          {image ? (
            <span className="text-sm">{image}</span>
          ) : (
            "UI Preview Image"
          )}
        </div>
      </div>
    </motion.div>
  );
}
