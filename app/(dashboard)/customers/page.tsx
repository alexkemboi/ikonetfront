import { TriangleAlert } from "lucide-react";
import { getSubscribersData } from "@/actions/subscribers";
import { getCurrentUserPermissions, NO_PERMISSIONS } from "@/lib/data/nav";
import { redirect } from "next/navigation";
import { SubscribersHeaderActions } from "@/components/subscribers/SubscribersHeaderActions";
import { SubscriberKpiCards } from "@/components/subscribers/SubscriberKpiCards";
import { SubscriberDataTable } from "@/components/subscribers/SubscriberDataTable";

export const dynamic = "force-dynamic";

export const metadata = { title: "Subscribers — IBS" };

export default async function SubscribersPage({ searchParams }: { searchParams: Promise<{ page?: string; statusFilter?: string; search?: string }> }) {
 const permissions = await getCurrentUserPermissions();
 const pagePerms = permissions["/customers"] ?? NO_PERMISSIONS;
 if (!pagePerms.canView) redirect("/dashboard");

 const query = await searchParams;
 const page = Math.max(0, Number(query.page ?? 0) || 0);
 const validStatuses = ["ACTIVE", "GRACE", "EXPIRED", "SUSPENDED"] as const;
 const statusFilter = validStatuses.includes(query.statusFilter as typeof validStatuses[number]) ? query.statusFilter as typeof validStatuses[number] : "ALL";
 const result = await getSubscribersData({ page, size: 25, statusFilter, search: query.search });

 return (
 <div className="min-h-screen p-4 text-foreground sm:p-6 lg:p-8">
 <div className="mx-auto max-w-7xl space-y-6">
 {/* Header */}
 <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
 <div>
 <p className="text-[11px] font-sans tabular-nums uppercase tracking-widest text-muted-foreground">
 Customers — Subscribers
 </p>
 <h1 className="mt-1 text-3xl font-normal tracking-normal text-foreground">
 Your subscribers.
 </h1>
		  {result.success && result.kpis && <p className="mt-1 text-sm text-muted-foreground">
 {result.kpis.allUsersCount.toLocaleString()} accounts · {result.kpis.onlineCount} online right now · KPIs match search across all pages
 </p>}
 </div>
 {result.success && result.rows && <SubscribersHeaderActions subscribers={result.rows.content} />}
 </div>

 {/* At-risk callout */}
 {result.success && result.kpis && result.kpis.atRiskCount > 0 && (
 <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
 <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
 <p className="text-sm leading-relaxed text-amber-200/90">
 <span className="font-semibold text-amber-300">
 {result.kpis.atRiskCount}
 </span>{" "}
 subscriber{result.kpis.atRiskCount === 1 ? "" : "s"} at risk — no recent
 activity or no active subscription. Review them before service
 cuts off.
 </p>
 </div>
 )}

 {result.success && result.kpis && result.rows ? (
	 <>
		 <SubscriberKpiCards kpis={result.kpis} />
		 <SubscriberDataTable pageData={result.rows} kpis={result.kpis} statusFilter={statusFilter} search={query.search ?? ""} />
	 </>
 ) : (
	 <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-5 text-sm">
		 <p className="font-medium">Subscriber data is unavailable.</p>
		 <p className="mt-1 text-muted-foreground">{result.message ?? "DATA_SOURCE_UNAVAILABLE"}{result.requestId ? ` · Ref: ${result.requestId}` : ""}</p>
	 </div>
 )}
 </div>
 </div>
 );
}