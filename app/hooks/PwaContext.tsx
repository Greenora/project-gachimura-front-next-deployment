"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { clientFetch } from "./useClientFetch";
import { useUser } from "./UserContext";
import { clearPushSubscription, vapidPublicKeyBytes, withPushTimeout } from "@/app/lib/push-subscription";

type PushStatus = "loading" | "unsupported" | "install" | "unavailable" | "denied" | "enabled" | "disabled";
interface InstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
interface PushConfig { enabled: boolean; publicKey: string | null }
interface PwaState {
  installed: boolean;
  isIOS: boolean;
  status: PushStatus;
  failed: boolean;
  install: () => Promise<boolean>;
  enablePush: () => Promise<void>;
  disablePush: () => Promise<void>;
  refresh: () => Promise<void>;
}

const PwaContext = createContext<PwaState | undefined>(undefined);
let registrationPromise: Promise<ServiceWorkerRegistration> | undefined;
let installedFromEvent = false;
const subscribeDevice = () => () => {};
const serverDevice = () => false;
const iosDevice = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const installedDevice = () => installedFromEvent || window.matchMedia("(display-mode: standalone)").matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
function subscribeInstalled(update: () => void) {
  const displayMode = window.matchMedia("(display-mode: standalone)");
  const installed = () => { installedFromEvent = true; update(); };
  window.addEventListener("appinstalled", installed);
  displayMode.addEventListener("change", update);
  return () => { window.removeEventListener("appinstalled", installed); displayMode.removeEventListener("change", update); };
}

function registerWorker(): Promise<ServiceWorkerRegistration> {
  registrationPromise ??= withPushTimeout(navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" })
    .then(() => navigator.serviceWorker.ready))
    .catch(error => { registrationPromise = undefined; throw error; });
  return registrationPromise;
}

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const { user, loading } = useUser();
  const installed = useSyncExternalStore(subscribeInstalled, installedDevice, serverDevice);
  const isIOS = useSyncExternalStore(subscribeDevice, iosDevice, serverDevice);
  const supported = useSyncExternalStore(subscribeDevice, () => window.isSecureContext && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window, serverDevice);
  const [pushStatus, setStatus] = useState<PushStatus>("loading");
  const status = isIOS && !installed ? "install" : !supported ? "unsupported" : pushStatus;
  const [failed, setFailed] = useState(false);
  const installPrompt = useRef<InstallPrompt | null>(null);
  const config = useRef<PushConfig | null>(null);
  const owner = useRef<number | null | undefined>(undefined);
  const epoch = useRef<object>({});
  const busy = useRef(false);

  useEffect(() => {
    const beforeInstall = (event: Event) => { event.preventDefault(); installPrompt.current = event as InstallPrompt; };
    const appInstalled = () => { installPrompt.current = null; };
    window.addEventListener("beforeinstallprompt", beforeInstall);
    window.addEventListener("appinstalled", appInstalled);
    if (window.isSecureContext && "serviceWorker" in navigator) void registerWorker().catch(() => undefined);
    return () => {
      window.removeEventListener("beforeinstallprompt", beforeInstall);
      window.removeEventListener("appinstalled", appInstalled);
    };
  }, []);

  const refresh = useCallback(async () => {
    if (loading || busy.current) return;
    const version = {};
    epoch.current = version;
    const currentOwner = user?.id ?? null;
    const changedOwner = owner.current !== undefined && owner.current !== currentOwner;
    owner.current = currentOwner;
    const current = () => version === epoch.current;
    if (changedOwner) config.current = null;
    try {
      if (!currentOwner || changedOwner) await withPushTimeout(clearPushSubscription());
      if (!current()) return;
      if (!currentOwner) { config.current = null; setStatus("disabled"); return; }
      if (!supported || (isIOS && !installed)) return;
      const result = await withPushTimeout(clientFetch<PushConfig>("/push/config", { redirectOnUnauthorized: false }));
      if (!current()) return;
      setFailed(false);
      if (Notification.permission === "denied") { setStatus("denied"); return; }
      config.current = result;
      if (!result?.enabled || !result.publicKey) { setStatus("unavailable"); return; }
      const registration = await withPushTimeout(registerWorker());
      const subscription = await withPushTimeout(registration.pushManager.getSubscription());
      if (!current()) return;
      if (subscription) {
        await withPushTimeout(clientFetch("/push/subscriptions", {
          method: "POST",
          body: { endpoint: subscription.endpoint, keys: subscription.toJSON().keys },
          redirectOnUnauthorized: false,
        }));
      }
      if (current()) setStatus(subscription ? "enabled" : "disabled");
    } catch {
      if (current()) { setStatus("unavailable"); setFailed(true); }
    }
  }, [loading, user?.id, isIOS, installed, supported]);

  useEffect(() => {
    // Account changes invalidate pending permission and subscription operations.
    epoch.current = {};
    busy.current = false;
    let active = true;
    if (window.isSecureContext && "serviceWorker" in navigator) {
      void registerWorker().then(() => { if (active) void refresh(); }).catch(() => {
        if (active) { setStatus("unavailable"); setFailed(true); }
      });
    }
    window.addEventListener("focus", refresh);
    return () => { active = false; epoch.current = {}; window.removeEventListener("focus", refresh); };
  }, [refresh]);

  const enablePush = useCallback(async () => {
    if (!user || busy.current || !config.current?.enabled || !config.current.publicKey) return;
    busy.current = true;
    const version = {};
    epoch.current = version;
    const current = () => version === epoch.current;
    let active = true;
    let subscription: PushSubscription | null = null;
    setFailed(false);
    setStatus("loading");
    try {
      // Request permission before awaiting anything so the click gesture is retained.
      const permission = await Notification.requestPermission();
      if (!current()) return;
      if (permission !== "granted") { setStatus(permission === "denied" ? "denied" : "disabled"); return; }
      const registration = await withPushTimeout(registerWorker());
      if (!current()) return;
      const created = await withPushTimeout(registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKeyBytes(config.current.publicKey),
      }).then(async value => {
        if (!active || !current()) { await value.unsubscribe(); throw new Error("PUSH_SESSION_CHANGED"); }
        return value;
      }));
      subscription = created;
      if (!current()) { await created.unsubscribe(); return; }
      await withPushTimeout(clientFetch("/push/subscriptions", {
        method: "POST",
        body: { endpoint: created.endpoint, keys: created.toJSON().keys },
        redirectOnUnauthorized: false,
      }));
      if (!current()) { await created.unsubscribe(); return; }
      setStatus("enabled");
    } catch {
      await subscription?.unsubscribe().catch(() => undefined);
      if (current()) { setStatus("disabled"); setFailed(true); }
    } finally {
      active = false;
      if (current()) busy.current = false;
    }
  }, [user]);

  const disablePush = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    const version = {};
    epoch.current = version;
    setStatus("loading");
    setFailed(false);
    try {
      await withPushTimeout(clearPushSubscription());
      if (version === epoch.current) setStatus("disabled");
    } catch {
      if (version === epoch.current) { setStatus("enabled"); setFailed(true); }
    } finally {
      if (version === epoch.current) busy.current = false;
    }
  }, []);

  const install = useCallback(async () => {
    const prompt = installPrompt.current;
    if (!prompt) return false;
    installPrompt.current = null;
    try { await prompt.prompt(); await prompt.userChoice; return true; } catch { return false; }
  }, []);

  return <PwaContext.Provider value={{ installed, isIOS, status, failed, install, enablePush, disablePush, refresh }}>{children}</PwaContext.Provider>;
}

export function usePwa() {
  const context = useContext(PwaContext);
  if (!context) throw new Error("usePwa must be used within PwaProvider");
  return context;
}
