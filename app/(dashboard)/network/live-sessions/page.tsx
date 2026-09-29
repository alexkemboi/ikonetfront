import { getLiveSessionsData } from "@/actions/sessions";
import { getPermissionForRoute } from "@/lib/data/nav";
import { redirect } from "next/navigation";
import { LiveSessionHeaderCards } from "@/components/sessions/LiveSessionHeaderCards";
import { LiveSessionDataTable } from "@/components/sessions/LiveSessionDataTable";

export const dynamic = "force-dynamic";

export const metadata = { title: "Live Sessions — IBS" };

export default async function LiveSessionsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
 const pagePerms = await getPermissionForRoute("/network/live-sessions");
 if (!pagePerms.canView) redirect("/dashboard");

 const params = await searchParams;
 const page = Math.max(0, Number(params.page ?? 0) || 0);
 const result = await getLiveSessionsData(page, 50);
 if (!result.success && result.status === 401) redirect("/signout?reason=session-expired");

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
 {result.success ? `${result.kpis?.currentlyConnected ?? 0} active sessions · refreshes every ${result.refreshIntervalSeconds}s` : "Live session data is unavailable."}
 </p>
 </div>

 {result.success && result.kpis && result.sessions ? (
	 <>
		 <LiveSessionHeaderCards kpis={result.kpis} />
		 <LiveSessionDataTable
			 sessions={result.sessions.content}
			 page={result.sessions.number}
			 totalPages={result.sessions.totalPages}
			 totalElements={result.sessions.totalElements}
			 size={result.sessions.size}
			 refreshIntervalSeconds={result.refreshIntervalSeconds}
		 />
	 </>
 ) : (
	 <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-5 text-sm">
		 <p className="font-medium">Live sessions are unavailable. The displayed count is not zero.</p>
		 <p className="mt-1 text-muted-foreground">{result.message ?? "LIVE_SESSIONS_UNAVAILABLE"}{result.requestId ? ` · Ref: ${result.requestId}` : ""}</p>
	 </div>
 )}
 </div>
 </div>
 );
}