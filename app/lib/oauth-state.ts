type OAuthProvider = "kakao" | "line";

const MAX_STATE_AGE_MS = 10 * 60 * 1000;

export function createOAuthState(provider: OAuthProvider): string {
  if (!globalThis.crypto?.getRandomValues) throw new Error("OAUTH_UNAVAILABLE");
  const bytes = new Uint8Array(32);
  globalThis.crypto.getRandomValues(bytes);
  const state = Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
  sessionStorage.setItem(`${provider}_auth_state`, JSON.stringify({ state, createdAt: Date.now() }));
  return state;
}

export function consumeOAuthState(provider: OAuthProvider, received: string | null): boolean {
  try {
    const key = `${provider}_auth_state`;
    const serialized = sessionStorage.getItem(key);
    // Consume even a rejected callback so the same authorization attempt cannot be replayed.
    sessionStorage.removeItem(key);
    if (!globalThis.crypto?.getRandomValues || !received || !serialized) return false;
    const pending = JSON.parse(serialized) as { state?: unknown; createdAt?: unknown } | null;
    if (!pending || typeof pending.state !== "string" || !/^[a-f0-9]{64}$/.test(pending.state)
      || typeof pending.createdAt !== "number" || !Number.isFinite(pending.createdAt)) return false;
    const age = Date.now() - pending.createdAt;
    return age >= 0 && age <= MAX_STATE_AGE_MS && received === pending.state;
  } catch {
    return false;
  }
}
