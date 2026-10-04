import Link from "next/link";
import { ShieldAlert } from "lucide-react";

import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata = { title: "No access — Beesmart" };

/**
 * Unguarded terminal page for the fail-closed nav.
 *
 * The dashboard dispatcher and every guarded page redirect here when the
 * caller has no viewable landing route (unknown role, unseeded catalog, or a
 * transient `/{role}/menus` failure). It deliberately does not read permissions
 * or redirect again, so it can never participate in a redirect loop.
 */
export default async function NoAccessPage() {
  const session = await auth();

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-8">
      <div className="max-w-md text-center space-y-4">
        <ShieldAlert className="mx-auto h-10 w-10 text-muted-foreground/40" />
        <h1 className="text-lg font-medium text-foreground">No access to this workspace</h1>
        <p className="text-sm text-muted-foreground">
          {session?.user
            ? "Your role has no viewable menu assigned, or permissions could not be loaded."
            : "You are not signed in."}
        </p>
        <p className="text-xs text-muted-foreground">
          If this is unexpected, ask an administrator to check your role&apos;s permissions, then try again.
        </p>
        <div className="flex items-center justify-center gap-3 pt-1">
          <Link
            href="/dashboard"
            className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            Retry
          </Link>
          <Link
            href="/login"
            className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign in again
          </Link>
        </div>
      </div>
    </div>
  );
}
