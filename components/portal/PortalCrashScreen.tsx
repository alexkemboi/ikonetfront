"use client";

import { useEffect } from "react";
import { reportPortalErrorAction } from "@/actions/portalErrors";

/**
 * Shared crash screen for the public payment flows (hotspot buy, PPPoE renew): a customer who
 * has already paid must not be tempted to pay again, so the copy leads with that instead of a
 * generic error message. Reported server-side because a phone's sign-in window has no console.
 */
export function PortalCrashScreen({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    void reportPortalErrorAction({
      message: error?.message,
      digest: error?.digest,
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      page: typeof window !== "undefined" ? window.location.href : undefined,
    }).catch(() => undefined);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-sm w-full space-y-4 text-center">
        <h1 className="text-xl font-medium text-foreground">This page did not load properly</h1>
        <p className="text-sm text-muted-foreground">
          If you have already paid, do not pay again. Try again, or reload the page.
        </p>
        <div className="flex gap-2">
          <button type="button" onClick={() => reset()} className="flex-1 rounded-lg border border-border px-4 py-2 text-sm">
            Try again
          </button>
          <button type="button" onClick={() => window.location.reload()} className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground">
            Reload
          </button>
        </div>
      </div>
    </main>
  );
}
