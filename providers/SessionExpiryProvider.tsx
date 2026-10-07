"use client";

import { createContext, useContext, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";

type SessionExpiryContextValue = {
  expiresAt: number | null;
};

const SessionExpiryContext = createContext<SessionExpiryContextValue>({ expiresAt: null });

export function useSessionExpiry(): SessionExpiryContextValue {
  return useContext(SessionExpiryContext);
}

const LOGIN_EXPIRED_URL = "/login?error=RefreshAccessTokenError";

/**
 * Proactively signs the user out the moment the backend access token's own
 * `expiresAt` passes, instead of waiting for a RefreshAccessTokenError to
 * surface on the next SessionProvider poll — `setInterval`/`setTimeout` are
 * throttled or frozen in a backgrounded tab, so the `visibilitychange` check
 * is the real safety net: it re-checks expiry the instant the tab is seen
 * again, even if the scheduled timer never fired while hidden.
 */
export default function SessionExpiryProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const expiresAt = session?.user?.expiresAt ?? null;
  const signedOutRef = useRef(false);

  useEffect(() => {
    if (!expiresAt) return;
    const expiryMs = expiresAt;
    signedOutRef.current = false;

    function expireNow() {
      if (signedOutRef.current) return;
      signedOutRef.current = true;
      signOut({ callbackUrl: LOGIN_EXPIRED_URL });
    }

    if (Date.now() >= expiryMs) {
      expireNow();
      return;
    }

    const timer = setTimeout(expireNow, expiryMs - Date.now());

    function handleVisibilityChange() {
      if (document.visibilityState === "visible" && Date.now() >= expiryMs) {
        expireNow();
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [expiresAt]);

  return (
    <SessionExpiryContext.Provider value={{ expiresAt }}>
      {children}
    </SessionExpiryContext.Provider>
  );
}
