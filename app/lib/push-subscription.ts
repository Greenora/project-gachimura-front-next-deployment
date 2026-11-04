import { clientFetch } from "@/app/hooks/useClientFetch";

export function withPushTimeout<T>(operation: Promise<T>, timeoutMs = 8000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("PUSH_TIMEOUT")), timeoutMs);
    operation.then(resolve, reject).finally(() => clearTimeout(timer));
  });
}

export function vapidPublicKeyBytes(value: string): Uint8Array<ArrayBuffer> {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const decoded = atob(normalized + "=".repeat((4 - normalized.length % 4) % 4));
  const bytes = Uint8Array.from(decoded, character => character.charCodeAt(0));
  if (bytes.length !== 65 || bytes[0] !== 4) throw new Error("PUSH_KEY_INVALID");
  return bytes;
}

export async function clearPushSubscription(): Promise<void> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  const registration = await withPushTimeout(navigator.serviceWorker.getRegistration("/"), 2500);
  if (!registration?.pushManager) return;
  const subscription = await withPushTimeout(registration.pushManager.getSubscription(), 2500);
  const notifications = typeof registration.getNotifications === "function"
    ? await withPushTimeout(registration.getNotifications(), 2500).catch(() => [])
    : [];
  notifications.forEach(notification => notification.close());
  if (!subscription) return;

  // Revoke browser delivery even when the API is unreachable during logout.
  let locallyRevoked = false;
  try {
    locallyRevoked = await withPushTimeout(subscription.unsubscribe(), 2500);
  } catch {
    // Server removal below can still stop future delivery.
  }
  try {
    await withPushTimeout(clientFetch("/push/subscriptions", {
      method: "DELETE",
      body: { endpoint: subscription.endpoint },
      redirectOnUnauthorized: false,
    }), 2500);
  } catch {
    if (!locallyRevoked) throw new Error("PUSH_UNSUBSCRIBE_FAILED");
  }
}
