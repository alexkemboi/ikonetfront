import { getIpMappingsResult } from "@/actions/network";
import type { IpMappingResponse } from "@/lib/types/api";
import { getPermissionForRoute } from "@/lib/data/nav";
import { redirect } from "next/navigation";
import { Wifi } from "lucide-react";
import { IpMappingsTable } from "./_components/IpMappingsTable";

export const dynamic = "force-dynamic";

export const metadata = { title: "IP Mappings — IBS" };

export default async function IpMappingsPage() {
  const pagePerms = await getPermissionForRoute("/network/ip-mappings");
  if (!pagePerms.canView) redirect("/dashboard");

  const { items: mappings, error } = await getIpMappingsResult();

  const onlineCount = mappings.filter((mapping: IpMappingResponse) => mapping.status === "ONLINE").length;
  const expiredCount = mappings.filter((mapping: IpMappingResponse) => mapping.status === "EXPIRED").length;
  const lostCount = mappings.filter((mapping: IpMappingResponse) => mapping.status === "LOST").length;

  return (
    <div className="min-h-screen p-4 text-foreground sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-[11px] font-sans tabular-nums tracking-wider text-muted-foreground uppercase">
              Network — IP Mappings
            </p>
            <h1 className="text-3xl font-sans font-normal text-foreground">
              Active Session Bindings.
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Latest {mappings.length} bindings · {onlineCount} online · {lostCount} lost contact · {expiredCount} ended — each tied to its customer, payment and router
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
            IP mappings could not be loaded: {error}
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-lg">
            <span className="text-[11px] font-sans tabular-nums tracking-wider text-muted-foreground uppercase">
              Online Sessions
            </span>
            <div className="mt-2 flex items-center gap-2">
              <Wifi className="h-4 w-4 text-emerald-400" />
              <span className="text-2xl font-sans tabular-nums font-bold text-emerald-400">{onlineCount}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">live RADIUS sessions</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-lg">
            <span className="text-[11px] font-sans tabular-nums tracking-wider text-muted-foreground uppercase">
              Expired Sessions
            </span>
            <div className="mt-2 flex items-center gap-2">
              <Wifi className="h-4 w-4 text-amber-500" />
              <span className="text-2xl font-sans tabular-nums font-bold text-amber-500">{expiredCount}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">no longer active</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-lg">
            <span className="text-[11px] font-sans tabular-nums tracking-wider text-muted-foreground uppercase">
              Total Mappings
            </span>
            <div className="mt-2 text-2xl font-sans tabular-nums font-bold text-foreground">{mappings.length}</div>
            <p className="mt-1 text-xs text-muted-foreground">observed session bindings</p>
          </div>
        </div>

        {/* Mappings Table */}
        {mappings.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-12 text-center shadow-lg">
            <div className="flex flex-col items-center gap-3">
              <Wifi className="h-12 w-12 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No active IP mappings at this moment.</p>
            </div>
          </div>
        ) : (
          <IpMappingsTable mappings={mappings} />
        )}

        {/* Info Box */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-lg">
          <p className="text-[11px] font-sans tabular-nums tracking-wider text-muted-foreground uppercase">
            Data Source
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            IP mapping data is sourced from RADIUS accounting logs (radacct table) enriched with
            hotspot_session billing context and network_device router metadata. There may be a
            delay between an actual session event and its appearance here, depending on how
            frequently RADIUS writes accounting records to the database.
          </p>
        </div>
      </div>
    </div>
  );
}
