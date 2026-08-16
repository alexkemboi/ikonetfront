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
    <div className="min-h-screen bg-[#0d0d0d] p-4 text-zinc-100 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header & Link Button */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <span className="text-[11px] font-mono tracking-wider text-zinc-500 uppercase">
              NETWORK — ROUTERS
            </span>
            <h1 className="text-3xl font-serif font-semibold text-white">NAS & routers.</h1>
            <p className="mt-1 text-xs text-zinc-400">
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
          <div className="rounded-2xl border border-[#262626] bg-[#161616] p-5 shadow-lg">
            <span className="text-[11px] font-mono tracking-wider text-zinc-400 uppercase">ROUTERS</span>
            <div className="mt-2 text-3xl font-mono font-bold text-white">{kpis.totalRoutersCount}</div>
            <p className="mt-1 text-xs text-zinc-400">registered NAS devices</p>
          </div>

          <div className="rounded-2xl border border-[#262626] bg-[#161616] p-5 shadow-lg">
            <span className="text-[11px] font-mono tracking-wider text-zinc-400 uppercase">ONLINE</span>
            <div className="mt-2 text-3xl font-mono font-bold text-emerald-400">{kpis.onlineCount}</div>
            <p className="mt-1 text-xs text-zinc-400">reachable via monitoring</p>
          </div>

          <div className="rounded-2xl border border-[#262626] bg-[#161616] p-5 shadow-lg">
            <span className="text-[11px] font-mono tracking-wider text-zinc-400 uppercase">OFFLINE</span>
            <div className="mt-2 text-3xl font-mono font-bold text-zinc-500">{kpis.offlineCount}</div>
            <p className="mt-1 text-xs text-zinc-400">not responding</p>
          </div>

          <div className="rounded-2xl border border-[#262626] bg-[#161616] p-5 shadow-lg">
            <span className="text-[11px] font-mono tracking-wider text-zinc-400 uppercase">LIVE SESSIONS</span>
            <div className="mt-2 text-3xl font-mono font-bold text-amber-500">{kpis.liveSessionsCount}</div>
            <p className="mt-1 text-xs text-zinc-400">subscribers online now</p>
          </div>
        </div>

        {/* Routers Table */}
        <div className="rounded-2xl border border-[#262626] bg-[#161616] p-6 shadow-xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#262626] pb-4">
            <div className="flex items-center gap-1 rounded-full bg-[#121212] p-1 border border-[#262626]">
              <button className="rounded-full bg-zinc-800 px-4 py-1.5 text-xs font-medium text-white">
                All <span className="font-mono text-zinc-500">{routers.length}</span>
              </button>
              <button className="rounded-full px-4 py-1.5 text-xs font-medium text-zinc-400 hover:text-white">
                Online <span className="font-mono text-zinc-500">{kpis.onlineCount}</span>
              </button>
              <button className="rounded-full px-4 py-1.5 text-xs font-medium text-zinc-400 hover:text-white">
                Offline <span className="font-mono text-zinc-500">{kpis.offlineCount}</span>
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search name, model, or shortname..."
                className="h-9 w-64 rounded-lg border border-[#262626] bg-[#121212] pl-9 pr-4 text-xs text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#262626] text-[11px] font-mono tracking-wider text-zinc-400 uppercase">
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
                      <div className="font-semibold text-white">{r.name}</div>
                      <div className="text-[11px] text-zinc-400 font-mono">{r.model}</div>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400">
                        {r.status === "ONLINE" ? "Online" : "Offline"}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-white font-bold">{r.activeSessions}</td>
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
                    <td className="py-3.5 px-3 text-zinc-400">{r.lastOnlineText}</td>
                    <td className="py-3.5 px-3 text-right">
                      <button className="text-zinc-500 hover:text-white">
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