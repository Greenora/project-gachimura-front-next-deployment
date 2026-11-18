"use client";

import { useEffect } from "react";

export function useVisiblePolling(refresh: (signal: AbortSignal) => Promise<void>, enabled = true, request = 0) {
  useEffect(() => {
    if (!enabled) return;

    const controller = new AbortController();
    let pending = false;
    const update = async () => {
      if (document.visibilityState === "hidden" || pending || controller.signal.aborted) return;
      pending = true;
      try {
        await refresh(controller.signal);
      } catch {
        // Keep the last result and retry when visible again or at the next interval.
      } finally {
        pending = false;
      }
    };

    void update();
    // Membership requests have no socket event, so refresh while the screen is visible.
    const interval = window.setInterval(update, 10000);
    window.addEventListener("focus", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      controller.abort();
      window.clearInterval(interval);
      window.removeEventListener("focus", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, [refresh, enabled, request]);
}
