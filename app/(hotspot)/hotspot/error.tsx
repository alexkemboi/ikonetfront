"use client";

import { useEffect } from "react";
import { Wifi } from "lucide-react";
import { reportPortalErrorAction } from "@/actions/portalErrors";
import { DEFAULT_PORTAL_BRAND } from "@/lib/brand";
import HotspotBrandHero from "./_components/HotspotBrandHero";

/**
 * The portal crashed while drawing (seen on phones whose built-in browser is older than the
 * one the app is built for): keep the same split layout as the working page — the branding a
 * customer already trusted never disappears — and show the recovery message where the package
 * flow would be. The fetch that may have failed is the per-company branding, so this renders
 * only the static defaults, not `portalContext`.
 */
export default function HotspotError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    void reportPortalErrorAction({
      message: error?.message,
      digest: error?.digest,
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      page: typeof window !== "undefined" ? window.location.href : undefined,
    }).catch(() => undefined);
  }, [error]);

  return (
    <main className="min-h-screen flex bg-background">
      <HotspotBrandHero brand={DEFAULT_PORTAL_BRAND} />

      <div className="w-full lg:w-1/2 flex flex-col px-4 sm:px-6 lg:px-12 py-8 lg:py-12">
        {/* Same mobile-only brand row the working page shows above the package flow */}
        <div className="mb-4 flex items-center gap-2 lg:hidden">
          <div className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary">
            <Wifi className="size-4 text-primary-foreground" aria-hidden="true" />
          </div>
          <h1 className="truncate text-lg font-normal text-foreground">{DEFAULT_PORTAL_BRAND}</h1>
        </div>

        <div className="flex-1 w-full max-w-2xl flex flex-col items-center justify-center text-center space-y-4">
          <h2 className="text-xl font-medium text-foreground">This page did not load properly</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            If you have already paid, do not pay again. Try again, or reload the page.
          </p>
          <div className="flex gap-2 w-full max-w-xs">
            <button type="button" onClick={() => reset()} className="flex-1 rounded-lg border border-border px-4 py-2 text-sm">
              Try again
            </button>
            <button type="button" onClick={() => window.location.reload()} className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground">
              Reload
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
