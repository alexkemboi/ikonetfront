import React from "react";
import Link from "next/link";
import { Plus, Search, ExternalLink } from "lucide-react";
import { getNasRoutersData } from "@/actions/provisioning";
import { getPermissionForRoute } from "@/lib/data/nav";
import { redirect } from "next/navigation";
import { RouterActionsDropdown } from "@/components/network/RouterActionsDropdown";

export const metadata = {
 title: "NAS & Routers — IBS",
};

export const dynamic = "force-dynamic";

export default async function NasRoutersPage() {
 const pagePerms = await getPermissionForRoute("/network/routers");
 if (!pagePerms.canView) redirect("/dashboard");

 const { kpis, routers } = await getNasRoutersData();

 return (
 <div className="min-h-screen p-4 text-foreground sm:p-6 lg:p-8">
 <div className="mx-auto max-w-7xl space-y-6">
 {/* Header & Link Button */}
 <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
 <div>
 <span className="text-[11px] font-mono tracking-wider text-muted-foreground uppercase">
 NETWORK — ROUTERS
 </span>
 <h1 className="text-3xl font-serif font-semibold text-foreground">NAS & routers.</h1>
 <p className="mt-1 text-xs text-muted-foreground">
 Link a router, paste the script, go live with PPPoE or Hotspot.
 </p>
 </div>

<div className="flex flex-wrap items-center gap-3">
  {/* Option A: Direct API Link — pre-assigned IP / LAN reached router */}
  <Link
    href="/network/routers/onboard"
    className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-muted transition"
  >
    <ExternalLink className="h-4 w-4" /> Direct API Link
  </Link>

  {/* Option B: Zero-Touch Provisioning (ZTP one-liner) */}
  <Link
    href="/network/routers/setup"
    className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-semibold text-black hover:bg-amber-400 transition shadow-lg shadow-amber-500/20"
  >
    <Plus className="h-4 w-4 stroke-[3]" /> Link MikroTik (ZTP)
  </Link>
  </div>
 </div>

 {/* KPI Cards */}
 <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
 <div className="rounded-2xl border border-border bg-card p-5 shadow-lg">
 <span className="text-[11px] font-mono tracking-wider text-muted-foreground uppercase">ROUTERS</span>
 <div className="mt-2 text-3xl font-mono font-bold text-foreground">{kpis.totalRoutersCount}</div>
 <p className="mt-1 text-xs text-muted-foreground">registered NAS devices</p>
 </div>

 <div className="rounded-2xl border border-border bg-card p-5 shadow-lg">
 <span className="text-[11px] font-mono tracking-wider text-muted-foreground uppercase">ONLINE</span>
 <div className="mt-2 text-3xl font-mono font-bold text-emerald-400">{kpis.onlineCount}</div>
 <p className="mt-1 text-xs text-muted-foreground">reachable via monitoring</p>
 </div>

 <div className="rounded-2xl border border-border bg-card p-5 shadow-lg">
 <span className="text-[11px] font-mono tracking-wider text-muted-foreground uppercase">OFFLINE</span>
 <div className="mt-2 text-3xl font-mono font-bold text-muted-foreground">{kpis.offlineCount}</div>
 <p className="mt-1 text-xs text-muted-foreground">not responding</p>
 </div>

 <div className="rounded-2xl border border-border bg-card p-5 shadow-lg">
 <span className="text-[11px] font-mono tracking-wider text-muted-foreground uppercase">LIVE SESSIONS</span>
 <div className="mt-2 text-3xl font-mono font-bold text-amber-500">{kpis.liveSessionsCount}</div>
 <p className="mt-1 text-xs text-muted-foreground">subscribers online now</p>
 </div>
 </div>

 {/* Routers Table */}
 <div className="rounded-2xl border border-border bg-card p-6 shadow-xl">
 <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
 <div className="flex items-center gap-1 rounded-full bg-muted p-1 border border-border">
 <button className="rounded-full bg-secondary px-4 py-1.5 text-xs font-medium text-foreground">
 All <span className="font-mono text-muted-foreground">{routers.length}</span>
 </button>
 <button className="rounded-full px-4 py-1.5 text-xs font-medium text-muted-foreground hover:text-accent-foreground">
 Online <span className="font-mono text-muted-foreground">{kpis.onlineCount}</span>
 </button>
 <button className="rounded-full px-4 py-1.5 text-xs font-medium text-muted-foreground hover:text-accent-foreground">
 Offline <span className="font-mono text-muted-foreground">{kpis.offlineCount}</span>
 </button>
 </div>

 <div className="relative">
 <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
 <input
 type="text"
 placeholder="Search name, model, or shortname..."
 className="h-9 w-64 rounded-lg border border-border bg-muted pl-9 pr-4 text-xs text-foreground placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
 />
 </div>
 </div>

<div className="mt-4 overflow-x-auto rounded-2xl border border-border">
  <table className="w-full text-left text-xs">
  <thead className="border-b border-border bg-muted/40">
  <tr className="text-[11px] font-mono tracking-wider text-muted-foreground uppercase">
  <th className="py-4 px-6 font-semibold">Router / Model</th>
  <th className="py-4 px-6 font-semibold">IP (Tunnel)</th>
  <th className="py-4 px-6 font-semibold">Status</th>
  <th className="py-4 px-6 font-semibold">CPU Load</th>
  <th className="py-4 px-6 font-semibold">RAM Usage</th>
  <th className="py-4 px-6 font-semibold">Sessions</th>
  <th className="py-4 px-6 font-semibold">Uptime</th>
  <th className="py-4 px-6 font-semibold text-right">Actions</th>
  </tr>
  </thead>
  <tbody className="divide-y divide-border font-mono">
  {routers.map((r) => {
  const cpu = Number.isFinite(Number(r.cpuUsage)) ? Number(r.cpuUsage) : null;
  const freeMemMB = r.freeMemory ? Math.round(r.freeMemory / (1024 * 1024)) : null;
  return (
  <tr key={r.id} className="hover:bg-zinc-800/30 transition">
  <td className="py-4 px-6 font-sans">
  <div className="font-semibold text-foreground">{r.name}</div>
  <div className="text-[11px] text-muted-foreground font-mono">{r.model}</div>
  </td>
  <td className="py-4 px-6">
  <span className="text-foreground font-mono text-xs">{r.managementIp}</span>
  {r.winboxTunnelAddress ? (
  <div className="text-[11px] text-teal-400/80 font-mono mt-0.5">{r.winboxTunnelAddress}</div>
  ) : null}
  </td>
  <td className="py-4 px-6">
  {r.status === "ONLINE" ? (
  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400">
  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
  Online
  </span>
  ) : (
  <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
  <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
  Offline
  </span>
  )}
  </td>
  <td className="py-4 px-6">
  {cpu != null ? (
  <div className="flex items-center gap-2">
  <span className="text-xs font-mono text-foreground">{cpu}%</span>
  <div className="w-16 bg-muted h-1.5 rounded-full overflow-hidden">
  <div
  className="bg-emerald-500 h-full transition-all"
  style={{ width: `${Math.min(Math.max(cpu, 4), 100)}%` }}
  />
  </div>
  </div>
  ) : (
  <span className="text-muted-foreground">—</span>
  )}
  </td>
  <td className="py-4 px-6 text-xs font-mono text-foreground">
  {freeMemMB != null ? `${freeMemMB} MB free` : "—"}
  </td>
  <td className="py-4 px-6 font-mono font-bold text-foreground">{r.activeSessions}</td>
  <td className="py-4 px-6 text-xs text-muted-foreground font-mono">
  {r.uptime || r.lastOnlineText || "—"}
  </td>
  <td className="py-4 px-6 text-right">
  <RouterActionsDropdown
  router={{
  id: r.id,
  name: r.name,
  model: r.model,
  status: r.status,
  managementIp: r.managementIp,
  winboxTunnelAddress: r.winboxTunnelAddress,
  }}
  onRouterDeleted={() => {
  // force-dynamic RSC page — a full refresh re-fetches inventory.
  window.location.reload();
  }}
  />
  </td>
  </tr>
  );
  })}
  </tbody>
  </table>
  </div>
  </div>
  </div>
  </div>
  );
}