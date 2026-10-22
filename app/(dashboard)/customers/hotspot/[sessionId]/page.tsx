import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getHotspotSessionTime } from "@/actions/subscriberTime";
import { getHotspotLiveSession } from "@/actions/sessions";
import { getCurrentUserPermissions, NO_PERMISSIONS } from "@/lib/data/nav";
import { HotspotCustomerClient } from "./_components/HotspotCustomerClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Hotspot customer — Beesmart Billing",
  description: "One hotspot customer: their package, connection and purchases, and what customer care can do for them.",
};

/** Matches the hotspot list, so both show the same picture. */
const REFRESH_INTERVAL_SECONDS = 30;

/**
 * One hotspot customer, by the paid session the directory lists them under. A hotspot customer
 * has no account: the session is the record, and the phone number that paid is the name.
 */
export default async function HotspotCustomerPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const permissions = await getCurrentUserPermissions();
  const pagePerms = permissions["/customers/all"] ?? NO_PERMISSIONS;
  if (!pagePerms.canView) redirect("/dashboard");

  const sessionId = Number((await params).sessionId);
  if (!Number.isInteger(sessionId) || sessionId <= 0) notFound();

  const [time, live] = await Promise.all([getHotspotSessionTime(sessionId), getHotspotLiveSession(sessionId)]);

  return (
    <div className="min-h-screen p-4 text-foreground sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <Link
          href="/customers/all?view=hotspot"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Hotspot customers
        </Link>

        {time.success ? (
          <HotspotCustomerClient
            sessionId={sessionId}
            initialTime={time.data}
            initialLive={live.session}
            liveError={live.error}
            refreshIntervalSeconds={REFRESH_INTERVAL_SECONDS}
          />
        ) : (
          <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-5 text-sm">
            <p className="font-medium">This customer could not be opened.</p>
            <p className="mt-1 text-muted-foreground">
              {time.message} A package that has ended or was disconnected is no longer managed here; its purchase stays in
              the payment history.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
