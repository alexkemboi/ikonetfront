import Link from "next/link";
import { Plus, ExternalLink, Search } from "lucide-react";
import { getNasRoutersData } from "@/actions/provisioning";
import { getPermissionForRoute } from "@/lib/data/nav";
import { redirect } from "next/navigation";
import RowHighlightWatcher from "@/components/network/RowHighlightWatcher";
import { RouterTunnelCell } from "@/components/network/RouterTunnelCell";
import { RouterActionsDropdown } from "@/components/network/RouterActionsDropdown";

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
 <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
 <div className="flex items-center gap-1 rounded-full bg-muted p-1 border border-border">
 <button className="rounded-full bg-secondary px-4 py-1.5 text-xs font-medium text-foreground">
 All <span className="font-sans tabular-nums text-muted-foreground">{routers.length}</span>
 </button>
 <button className="rounded-full px-4 py-1.5 text-xs font-medium text-muted-foreground hover:text-accent-foreground">
 Online <span className="font-sans tabular-nums text-muted-foreground">{kpis.onlineCount}</span>
 </button>
 <button className="rounded-full px-4 py-1.5 text-xs font-medium text-muted-foreground hover:text-accent-foreground">
 Offline <span className="font-sans tabular-nums text-muted-foreground">{kpis.offlineCount}</span>
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
  <tr className="text-[11px] font-sans tabular-nums tracking-wider text-muted-foreground uppercase">
  <th className="py-4 px-6 font-semibold">Router / Model</th>
  <th className="py-4 px-6 font-semibold">IP (Tunnel)</th>
  <th className="py-4 px-6 font-semibold">Status</th>
  <th className="py-4 px-6 font-semibold">CPU Load</th>
  <th className="py-4 px-6 font-semibold">RAM Usage</th>
  <th className="py-4 px-6 font-semibold">Sessions</th>
  <th className="py-4 px-6 font-semibold">Uptime</th>
  <th className="py-4 px-6 font-semibold">WinBox Tunnel</th>
  <th className="py-4 px-6 font-semibold">Web Console</th>
  <th className="py-4 px-6 font-semibold text-right">Actions</th>
  </tr>
  </thead>
  <tbody className="divide-y divide-border font-sans tabular-nums">
  {routers.map((r) => {
  const cpu = Number.isFinite(Number(r.cpuUsage)) ? Number(r.cpuUsage) : null;
  const freeMemMB = r.freeMemory ? Math.round(r.freeMemory / (1024 * 1024)) : null;
  return (
  <tr key={`${r.routerId ?? "no-router"}-${r.deviceId ?? "no-device"}-${r.name}`} data-row-id={`${r.routerId ?? "no-router"}-${r.deviceId ?? "no-device"}`} className="hover:bg-zinc-800/30 transition">
  <td className="py-4 px-6 font-sans">
  <div className="font-semibold text-foreground">{r.name}</div>
  <div className="text-[11px] text-muted-foreground font-sans tabular-nums">{r.model}</div>
  </td>
  <td className="py-4 px-6">
  <span className="text-foreground font-sans tabular-nums text-xs">{r.managementIp}</span>
  </td>
  <td className="py-4 px-6">
  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
    r.status === "ONLINE" ? "bg-emerald-500/15 text-emerald-700" :
    r.status === "DEGRADED" ? "bg-amber-500/15 text-amber-800" :
    r.status === "NOT_PROVISIONED" ? "bg-zinc-100 text-zinc-700" : "bg-red-500/10 text-red-700"
  }`}>
    <span className={`h-1.5 w-1.5 rounded-full ${r.status === "ONLINE" ? "bg-emerald-500" : r.status === "DEGRADED" ? "bg-amber-500" : r.status === "NOT_PROVISIONED" ? "bg-zinc-500" : "bg-red-500"}`} />
    {r.status.replaceAll("_", " ")}
  </span>
  </td>
  <td className="py-4 px-6">
  {cpu != null ? (
  <div className="flex items-center gap-2">
  <span className="text-xs font-sans tabular-nums text-foreground">{cpu}%</span>
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
  <td className="py-4 px-6 text-xs font-sans tabular-nums text-foreground">
  {freeMemMB != null ? `${freeMemMB} MB free` : "—"}
  </td>
  <td className="py-4 px-6 font-sans tabular-nums font-bold text-foreground">{r.activeSessions ?? "—"}</td>
  <td className="py-4 px-6 text-xs text-muted-foreground font-sans tabular-nums">
  {r.uptime || r.lastOnlineText || "—"}
  </td>
  {pagePerms.canEdit ? (
  <RouterTunnelCell
  deviceId={r.deviceId}
  winboxTunnelAddress={r.winboxTunnelAddress}
  winboxTunnelPort={r.winboxTunnelPort}
  webConsoleUrl={r.webConsoleUrl}
  tunnelExpiresAt={r.tunnelExpiresAt}
  canEdit={pagePerms.canEdit}
  />
  ) : (
  <>
  <td className="py-4 px-6">
  {r.winboxTunnelAddress ? (
  <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-[11px] font-sans tabular-nums text-teal-400">
  :{(r.winboxTunnelPort ?? r.winboxTunnelAddress.split(":")[1]) ?? "—"}
  </span>
  ) : (
  <span className="text-[11px] text-muted-foreground">—</span>
  )}
  </td>
  <td className="py-4 px-6">
  {r.webConsoleUrl ? (
  <span className="text-[11px] text-muted-foreground">Available</span>
  ) : (
  <span className="text-[11px] text-muted-foreground">—</span>
  )}
  </td>
  </>
  )}
  <td className="py-4 px-6 text-right">
  <RouterActionsDropdown
  router={{
  id: r.id,
  deviceId: r.deviceId,
  routerId: r.routerId,
  name: r.name,
  model: r.model,
  status: r.status,
  managementIp: r.managementIp,
  winboxTunnelAddress: r.winboxTunnelAddress,
  webConsoleUrl: r.webConsoleUrl,
  tunnelExpiresAt: r.tunnelExpiresAt,
  links: r.links,
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
  <RowHighlightWatcher />
  </div>
  );
}