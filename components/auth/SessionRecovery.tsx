"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { clientFetch } from "@/app/hooks/useClientFetch";

// Server Components cannot set refreshed cookies; recover through the browser.
export default function SessionRecovery() {
  const router = useRouter();

  useEffect(() => {
    let active = true;
    clientFetch("/auth/refresh", {
      method: "POST",
      redirectOnUnauthorized: false,
    }).then(() => {
      if (active) router.refresh();
    }).catch(() => {
      if (active) router.replace("/login");
    });
    return () => { active = false; };
  }, [router]);

  return <div role="status" aria-label="Loading" className="p-8 text-center">…</div>;
}
