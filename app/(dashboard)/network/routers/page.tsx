import React from "react";
import Link from "next/link";
import { Plus, Search, ExternalLink, MoreHorizontal } from "lucide-react";
import { getNasRoutersData } from "@/actions/provisioning";
import { getPermissionForRoute } from "@/lib/data/nav";
import { redirect } from "next/navigation";

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

 <Link
 href="/network/routers/setup"
 className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-semibold text-black hover:bg-amber-400 transition shadow-lg shadow-amber-500/20"
 >
 <Plus className="h-4 w-4 stroke-[3]" /> Link MikroTik
 </Link>
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

 <div className="mt-4 overflow-x-auto">
 <table className="w-full text-left text-xs">
 <thead>
 <tr className="border-b border-border text-[11px] font-mono tracking-wider text-muted-foreground uppercase">
 <th className="py-3 px-3">ROUTER</th>
 <th className="py-3 px-3">STATUS</th>
 <th className="py-3 px-3">SESSIONS</th>
 <th className="py-3 px-3">WINBOX</th>
 <th className="py-3 px-3">LAST ONLINE</th>
 <th className="py-3 px-3 text-right" />
 </tr>
 </thead>
 <tbody className="divide-y divide-zinc-800/50 font-mono">
 {routers.map((r) => (
 <tr key={r.id} className="hover:bg-zinc-800/30 transition">
 <td className="py-3.5 px-3 font-sans">
 <div className="font-semibold text-foreground">{r.name}</div>
 <div className="text-[11px] text-muted-foreground font-mono">{r.model}</div>
 </td>
 <td className="py-3.5 px-3">
 <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400">
 {r.status === "ONLINE" ? "Online" : "Offline"}
 </span>
 </td>
 <td className="py-3.5 px-3 text-foreground font-bold">{r.activeSessions}</td>
 <td className="py-3.5 px-3">
 {r.winboxTunnelAddress ? (
 <a
 href={`#`}
 className="inline-flex items-center gap-1 text-teal-400 hover:underline"
 >
 {r.winboxTunnelAddress}
 <ExternalLink className="h-3 w-3" />
 </a>
 ) : (
 "—"
 )}
 </td>
 <td className="py-3.5 px-3 text-muted-foreground">{r.lastOnlineText}</td>
 <td className="py-3.5 px-3 text-right">
 <button className="text-muted-foreground hover:text-accent-foreground">
 <MoreHorizontal className="h-4 w-4" />
 </button>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 </div>
 );
}