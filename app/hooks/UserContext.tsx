"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { clientFetch, USER_CHANGED_EVENT } from "./useClientFetch";

export interface UserProfile {
  id: number;
  nickname: string;
  nickname_jp?: string | null;
  profileImage?: string | null;
  treeScore?: string | number;
  reviewsCount?: number;
  accountCountry?: "KR" | "JP" | null;
  bankCode?: string | null;
  bankName?: string | null;
  bankBranchName?: string | null;
  bankBranchCode?: string | null;
  accountType?: "FUTSU" | "TOZA" | null;
  accountNumber?: string | null;
  accountHolder?: string | null;
}

const UserContext = createContext<{ user: UserProfile | null; loading: boolean } | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const requestVersion = useRef(0);

  useEffect(() => {
    const onUserChanged = (event: Event) => {
      requestVersion.current++;
      setUser((event as CustomEvent<UserProfile | null>).detail);
      setLoading(false);
    };
    window.addEventListener(USER_CHANGED_EVENT, onUserChanged);
    return () => window.removeEventListener(USER_CHANGED_EVENT, onUserChanged);
  }, []);

  useEffect(() => {
    const version = ++requestVersion.current;
    let active = true;
    clientFetch<UserProfile>("/users/profile", { redirectOnUnauthorized: false })
      .then(profile => {
        if (active && version === requestVersion.current) setUser(profile);
      })
      .catch(() => {
        // Authentication failures clear the session through USER_CHANGED_EVENT.
      })
      .finally(() => {
        if (active && version === requestVersion.current) setLoading(false);
      });
    return () => { active = false; };
  }, [pathname]);

  return <UserContext.Provider value={{ user, loading }}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within UserProvider");
  return context;
}
