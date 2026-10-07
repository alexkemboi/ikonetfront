import React from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getEquipmentData } from "@/actions/equipment";
import { EquipmentKpiCards } from "@/components/equipment/EquipmentKpiCards";
import { EquipmentDataTable } from "@/components/equipment/EquipmentDataTable";
import { getPermissionForRoute } from "@/lib/data/nav";
import { redirect } from "next/navigation";

export const metadata = {
 title: "Equipment Inventory — IBS",
};

export const dynamic = "force-dynamic";

export default async function EquipmentHubPage({ searchParams }: { searchParams: Promise<{ page?: string; status?: string; type?: string; search?: string; dataQuality?: string; size?: string }> }) {
 const pagePerms = await getPermissionForRoute("/network/equipment");
 if (!pagePerms.canView) redirect("/dashboard");

 const params = await searchParams;
 const page = Math.max(0, Number(params?.page ?? 0) || 0);
 const size = [10, 20, 25, 30, 40, 50].includes(Number(params?.size)) ? Number(params.size) : 50;
 const status = params?.status as import("@/lib/types/equipment").EquipmentStatus | undefined;
 const allowedTypes = ["ROUTER", "SWITCH", "CPE_MODEM", "ONU", "ANTENNA", "SMART_TV", "WIFI_AP", "CABLE"];
 const type = allowedTypes.includes(params?.type ?? "") ? params.type as import("@/lib/types/equipment").EquipmentType : undefined;
 const allowedQualityFilters = ["VERIFIED", "PLACEHOLDER", "MISSING", "NEEDS_CORRECTION"];
 const dataQuality = allowedQualityFilters.includes(params?.dataQuality ?? "") ? params.dataQuality : undefined;
 const result = await getEquipmentData({ page, size, status, type, search: params?.search, dataQuality });

 return (
 <div className="min-h-screen p-4 text-foreground sm:p-6 lg:p-8">
 <div className="mx-auto max-w-7xl space-y-6">
 <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
 <div>
 <span className="text-[11px] font-sans tabular-nums tracking-wider text-muted-foreground uppercase">
 NETWORK — EQUIPMENT
 </span>
 <h1 className="text-3xl font-sans font-normal text-foreground">Hardware inventory.</h1>
 <p className="mt-1 text-xs text-muted-foreground">
 Track every router, modem, and cable from stockroom to subscriber to bin.
 </p>
 </div>

 <Link
 href="/network/equipment/new"
 className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-semibold text-black hover:bg-amber-400 transition shadow-lg shadow-amber-500/20"
 >
 <Plus className="h-4 w-4 stroke-[3]" /> Add equipment
 </Link>
 </div>

 {/* KPI Cards */}
 {result.success && result.kpis && result.items ? <EquipmentKpiCards kpis={result.kpis} /> : <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">Equipment data unavailable{result.requestId ? ` · Ref: ${result.requestId}` : ""}</div>}

 {/* Main Grid */}
 {result.success && result.items && <EquipmentDataTable pageData={result.items} canEdit={pagePerms.canEdit} />}
 </div>
 </div>
 );
}