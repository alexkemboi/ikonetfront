import { getLiveSessionsData } from "@/actions/sessions";
import { getPermissionForRoute } from "@/lib/data/nav";
import { redirect } from "next/navigation";
import { LiveSessionHeaderCards } from "@/components/sessions/LiveSessionHeaderCards";
import { LiveSessionDataTable } from "@/components/sessions/LiveSessionDataTable";

export const dynamic = "force-dynamic";

export const metadata = { title: "Live Sessions — IBS" };

/** Client-side poll cadence for the live session table. */
const REFRESH_INTERVAL_SECONDS = 30;

export default async function LiveSessionsPage() {
  const pagePerms = await getPermissionForRoute("/network/live-sessions");
  if (!pagePerms.canView) redirect("/dashboard");

  const result = await getLiveSessionsData();

  return (
  <div className="min-h-screen p-4 text-foreground sm:p-6 lg:p-8">
  <div className="mx-auto max-w-7xl space-y-6">
  {/* Header */}
  <div>
  <p className="text-[11px] font-sans tabular-nums uppercase tracking-widest text-muted-foreground">
  Network — Live Sessions
  </p>
  <h1 className="mt-1 text-3xl font-normal tracking-normal text-foreground">
  Currently online.
  </h1>
 				<p className="mt-1 text-sm text-muted-foreground">
  {result.error ? "Live session data is unavailable." : `${result.kpis.currentlyConnected} active sessions · refreshes every ${REFRESH_INTERVAL_SECONDS}s`}
  </p>
  </div>

  {result.error ? (
 	 <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-5 text-sm">
 		 <p className="font-medium">Live sessions are unavailable. The displayed count is not zero.</p>
 		 <p className="mt-1 text-muted-foreground">{result.error}</p>
 	 </div>
  ) : (
 	 <>
 		 <LiveSessionHeaderCards kpis={result.kpis} />
 		 <LiveSessionDataTable
 			 sessions={result.sessions}
 			 refreshIntervalSeconds={REFRESH_INTERVAL_SECONDS}
 		 />
 	 </>
  )}
  </div>
  </div>
  );
}