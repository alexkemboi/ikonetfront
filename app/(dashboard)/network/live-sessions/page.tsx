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

 const { kpis, sessions, error } = await getLiveSessionsData();

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
 {kpis.currentlyConnectedCount} online
 {kpis.paidNotConnected > 0 ? ` · ${kpis.paidNotConnected} paid but not connected` : ""}
 {" · "}each session traced to its customer, payment and router
 </p>
 </div>

 {error && (
 <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
 Live sessions could not be loaded: {error}
 </div>
 )}

 <LiveSessionHeaderCards kpis={kpis} />
 <LiveSessionDataTable sessions={sessions} />
 </div>
 </div>
 );
}