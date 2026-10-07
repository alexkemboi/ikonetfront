import Link from "next/link";
import { Plus, ExternalLink } from "lucide-react";
import { getNasRoutersData } from "@/actions/provisioning";
import { getPermissionForRoute } from "@/lib/data/nav";
import { redirect } from "next/navigation";
import RowHighlightWatcher from "@/components/network/RowHighlightWatcher";
import { Button } from "@/components/ui/button";
import { NasRoutersTable } from "./_components/NasRoutersTable";

export const metadata = {
 title: "NAS & Routers — IBS",
};

export const dynamic = "force-dynamic";

export default async function NasRoutersPage() {
 const pagePerms = await getPermissionForRoute("/network/routers");
 if (!pagePerms.canView) redirect("/dashboard");

const result = await getNasRoutersData();
  if (result.error) {
   return <div className="min-h-screen p-4 sm:p-6 lg:p-8"><div role="alert" className="mx-auto max-w-7xl rounded-lg border border-destructive/30 bg-destructive/5 p-5 text-sm"><h1 className="font-medium">Router data unavailable</h1><p className="mt-1 text-muted-foreground">{result.error}</p></div></div>;
  }
 const { kpis, routers } = result;

 return (
 <div className="min-h-screen p-4 text-foreground sm:p-6 lg:p-8">
 <div className="mx-auto max-w-7xl space-y-6">
 {/* Header & Link Button */}
 <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
 <div>
 <span className="text-[11px] font-sans tabular-nums tracking-wider text-muted-foreground uppercase">
 NETWORK — ROUTERS
 </span>
 <h1 className="text-3xl font-sans font-normal text-foreground">NAS & routers.</h1>
 <p className="mt-1 text-xs text-muted-foreground">
 Link a router, paste the script, go live with PPPoE or Hotspot.
 </p>
 </div>

<div className="flex flex-wrap items-center gap-3">
  {/* Option A: Direct API Link — pre-assigned IP / LAN reached router */}
  <Button variant="secondary" size="sm" asChild>
    <Link href="/network/routers/onboard">
      <ExternalLink className="h-4 w-4" /> Direct API Link
    </Link>
  </Button>

  {/* Option B: Zero-Touch Provisioning (ZTP one-liner) */}
  <Button size="sm" asChild>
    <Link href="/network/routers/setup">
      <Plus className="h-4 w-4 stroke-[3]" /> Link MikroTik (ZTP)
    </Link>
  </Button>
  </div>
 </div>

 {/* KPI Cards */}
 <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
 <div className="rounded-2xl border border-border bg-card p-5 shadow-lg">
 <span className="text-[11px] font-sans tabular-nums tracking-wider text-muted-foreground uppercase">ROUTERS</span>
 <div className="mt-2 text-3xl font-sans tabular-nums font-bold text-foreground">{kpis.totalRoutersCount}</div>
 <p className="mt-1 text-xs text-muted-foreground">registered NAS devices</p>
 </div>

 <div className="rounded-2xl border border-border bg-card p-5 shadow-lg">
 <span className="text-[11px] font-sans tabular-nums tracking-wider text-muted-foreground uppercase">ONLINE</span>
 <div className="mt-2 text-3xl font-sans tabular-nums font-bold text-emerald-400">{kpis.onlineCount}</div>
 <p className="mt-1 text-xs text-muted-foreground">reachable via monitoring</p>
 </div>

 <div className="rounded-2xl border border-border bg-card p-5 shadow-lg">
 <span className="text-[11px] font-sans tabular-nums tracking-wider text-muted-foreground uppercase">OFFLINE</span>
 <div className="mt-2 text-3xl font-sans tabular-nums font-bold text-muted-foreground">{kpis.offlineCount}</div>
 <p className="mt-1 text-xs text-muted-foreground">not responding</p>
 </div>

 <div className="rounded-2xl border border-border bg-card p-5 shadow-lg">
 <span className="text-[11px] font-sans tabular-nums tracking-wider text-muted-foreground uppercase">LIVE SESSIONS</span>
 <div className="mt-2 text-3xl font-sans tabular-nums font-bold text-amber-500">{kpis.liveSessionsCount}</div>
 <p className="mt-1 text-xs text-muted-foreground">subscribers online now</p>
 </div>
 </div>

 {/* Routers Table */}
 <div className="rounded-2xl border border-border bg-card p-6 shadow-xl">
 <NasRoutersTable routers={routers} canEdit={pagePerms.canEdit} />
 </div>
 </div>
  <RowHighlightWatcher />
  </div>
  );
}