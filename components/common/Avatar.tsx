// components/common/Avatar.tsx
"use client";

import Image from "next/image";

interface AvatarProps {
  nickname: string;
  avatarUrl?: string | null;
  size?: number;
}

const getAvatarColor = (nickname: string) => {
  const colors = ["#B8C9A3", "#A3C9B8", "#C9B8A3", "#A3B8C9", "#C9A3B8", "#B8A3C9"];
  let hash = 0;
  for (let i = 0; i < nickname.length; i++) {
    hash = nickname.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export default function Avatar({ nickname, avatarUrl, size = 40 }: AvatarProps) {
  const initial = nickname.charAt(0).toUpperCase();

  return (
    <div
      className="rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-white font-bold relative"
      style={{
        width: size,
        height: size,
        backgroundColor: avatarUrl ? undefined : getAvatarColor(nickname),
        fontSize: size * 0.4,
      }}
    >
      {avatarUrl ? (
        <Image src={avatarUrl} alt={nickname} fill className="object-cover" />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  );
}