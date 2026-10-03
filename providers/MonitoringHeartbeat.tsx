"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export const SESSION_HEARTBEAT_INTERVAL_MS = 5 * 60_000;
export const LIVE_DATA_REFRESH_INTERVAL_MS = 60_000;

/**
 * Single session timer. On each visible tick it POSTs `/api/auth/session` via
 * `update()`, which re-runs the jwt callback and persists a rotated access JWT
 * cookie. Replaces SessionProvider's refetchInterval (one source of truth).
 */
export function SessionHeartbeat({
  intervalMs = SESSION_HEARTBEAT_INTERVAL_MS,
}: {
  intervalMs?: number;
}) {
  const { update } = useSession();
  const inFlightRef = useRef(false);
  const updateRef = useRef(update);

  // `useSession().update` changes identity whenever the session/loading state
  // changes. Keep it in a ref so the timer below depends only on intervalMs and
  // is never torn down and re-anchored by a tick's own session update.
  useEffect(() => {
    updateRef.current = update;
  }, [update]);

  useEffect(() => {
    let active = true;

    async function tick() {
      if (document.visibilityState !== "visible") return;
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      try {
        await updateRef.current();
      } catch {
        // Transient failure: the jwt callback keeps the still-valid token and
        // the next tick retries. Nothing to surface here.
      } finally {
        inFlightRef.current = false;
      }
    }

    function onVisibilityChange() {
      if (document.visibilityState === "visible") void tick();
    }

    const timer = setInterval(() => {
      if (active) void tick();
    }, intervalMs);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      active = false;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [intervalMs]);

  return null;
}

/**
 * Periodic re-render of the current route's Server Components so on-screen data
 * stays fresh. Scoped to routes that mount it (the overview) to avoid costly
 * refreshes elsewhere. No-op while the document is hidden.
 */
export function LiveDataRefresh({
  intervalMs = LIVE_DATA_REFRESH_INTERVAL_MS,
}: {
  intervalMs?: number;
}) {
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, intervalMs);
    return () => clearInterval(timer);
  }, [router, intervalMs]);

  return null;
}
