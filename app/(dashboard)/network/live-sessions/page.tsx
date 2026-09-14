import { getLiveSessionsData } from "@/actions/sessions";
import { getPermissionForRoute } from "@/lib/data/nav";
import { redirect } from "next/navigation";
import { LiveSessionHeaderCards } from "@/components/sessions/LiveSessionHeaderCards";
import { LiveSessionDataTable } from "@/components/sessions/LiveSessionDataTable";

export const dynamic = "force-dynamic";

export const metadata = { title: "Live Sessions — IBS" };

export default async function LiveSessionsPage() {
 const pagePerms = await getPermissionForRoute("/network/live-sessions");
 if (!pagePerms.canView) redirect("/dashboard");

 const { kpis, sessions } = await getLiveSessionsData();

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
 {kpis.currentlyConnectedCount} active sessions · one-click RFC 5176
 disconnect per subscriber
 </p>
 </div>

 <LiveSessionHeaderCards kpis={kpis} />
 <LiveSessionDataTable sessions={sessions} />
 </div>
 </div>
 );
}