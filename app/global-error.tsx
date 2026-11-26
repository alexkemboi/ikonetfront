"use client";

import { useEffect, useSyncExternalStore } from "react";
import Image from "next/image";
import { AlertTriangle, RotateCw, Home } from "lucide-react";
import { reportAppErrorAction } from "@/actions/portalErrors";
import { brandFor, type SiteBrand } from "@/lib/siteBrand";

const noSubscription = () => () => {};
import "./globals.css";

/**
 * Next.js only mounts this in place of the root layout, so it needs its own <html>/<body> and
 * must not assume any provider (theme, auth, redux) ran — this is what replaces the blank
 * "Application error: a client-side exception has occurred" page everywhere a closer
 * route-level error.tsx doesn't already catch the crash.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    void reportAppErrorAction({
      message: error?.message,
      digest: error?.digest,
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      page: typeof window !== "undefined" ? window.location.href : undefined,
    }).catch(() => undefined);
  }, [error]);

  // no providers here (this replaces the root layout): the brand comes from the address itself
  const brand = useSyncExternalStore(noSubscription, (): SiteBrand | null => brandFor(window.location.host), () => null);

  return (
    <html lang="en">
      <body className="antialiased">
        <main className="min-h-screen flex items-center justify-center bg-[#F5F5F5] p-6">
          <div className="w-full max-w-sm text-center space-y-5">
            <div className="flex items-center justify-center gap-3">
              {brand && <Image src={brand.logo} alt={brand.legalName} width={40} height={40} className="rounded-lg" />}
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFF3E0]">
                <AlertTriangle className="h-5 w-5 text-[#FF9800]" />
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-medium text-[#333333]">Something went wrong</h1>
              <p className="text-sm text-[#555555]">
                {brand ? brand.legalName : "The app"} ran into an unexpected error. Your data is safe — try again, or
                go back to the dashboard.
              </p>
              {error?.digest ? (
                <p className="text-xs text-[#555555]/70 font-mono">Reference: {error.digest}</p>
              ) : null}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => reset()}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-[#EEEEEE] bg-white px-4 py-2 text-sm font-medium text-[#333333] hover:bg-[#F5F5F5]"
              >
                <RotateCw className="h-4 w-4" />
                Try again
              </button>
              <a
                href="/"
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-[#103766] px-4 py-2 text-sm font-medium text-white hover:bg-[#1a4f8a]"
              >
                <Home className="h-4 w-4" />
                Go home
              </a>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
