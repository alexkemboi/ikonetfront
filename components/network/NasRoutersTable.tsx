"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { NasRouterItem } from "@/lib/types/provisioning";
import { isRouterOnline } from "@/lib/utils/router-status";
import { RouterActionsDropdown } from "@/components/network/RouterActionsDropdown";
import { RouterTunnelCell } from "@/components/network/RouterTunnelCell";

type StatusFilter = "all" | "online" | "offline";

/**
 * NAS & Routers table with working status tabs and search. The page stays a
 * server component that loads the (company-scoped) inventory; filtering is
 * client-side over that list.
 */
export function NasRoutersTable({
  routers,
  canEdit,
  loadError,
}: {
  routers: NasRouterItem[];
  canEdit: boolean;
  loadError?: string;
}) {
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");

  const onlineCount = useMemo(() => routers.filter(isRouterOnline).length, [routers]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return routers.filter((r) => {
      const online = isRouterOnline(r);
      if (filter === "online" && !online) return false;
      if (filter === "offline" && online) return false;
      if (!q) return true;
      return [r.name, r.model, r.managementIp].some((v) => v?.toLowerCase().includes(q));
    });
  }, [routers, filter, query]);

  const tabs: { key: StatusFilter; label: string; count: number }[] = [
    { key: "all", label: "All", count: routers.length },
    { key: "online", label: "Online", count: onlineCount },
    { key: "offline", label: "Offline", count: routers.length - onlineCount },
  ];

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div className="flex items-center gap-1 rounded-full bg-muted p-1 border border-border" role="tablist">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={filter === t.key}
              onClick={() => setFilter(t.key)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${
                filter === t.key
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-accent-foreground"
              }`}
            >
              {t.label} <span className="font-sans tabular-nums text-muted-foreground">{t.count}</span>
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, model, or IP..."
            aria-label="Search routers"
            className="h-9 w-full sm:w-64 rounded-lg border border-border bg-muted pl-9 pr-4 text-xs text-foreground placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
          />
        </div>
      </div>

      {loadError ? (
        <p className="mt-4 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-xs text-destructive">
          {loadError}
        </p>
      ) : routers.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
          No routers are registered for this company yet. Use “Link MikroTik (ZTP)” to add one.
        </p>
      ) : visible.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
          No routers match this filter.
        </p>
      ) : (
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
              {visible.map((r) => {
                const cpu = Number.isFinite(Number(r.cpuUsage)) ? Number(r.cpuUsage) : null;
                const freeMemMB = r.freeMemory ? Math.round(r.freeMemory / (1024 * 1024)) : null;
                return (
                  <tr key={r.id} data-row-id={String(r.id)} className="hover:bg-zinc-800/30 transition">
                    <td className="py-4 px-6 font-sans">
                      <div className="font-semibold text-foreground">{r.name}</div>
                      <div className="text-[11px] text-muted-foreground font-sans tabular-nums">{r.model}</div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-foreground font-sans tabular-nums text-xs">{r.managementIp}</span>
                    </td>
                    <td className="py-4 px-6">
                      {isRouterOnline(r) ? (
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
                    <td className="py-4 px-6 font-sans tabular-nums font-bold text-foreground">{r.activeSessions}</td>
                    <td className="py-4 px-6 text-xs text-muted-foreground font-sans tabular-nums">
                      {r.uptime || r.lastOnlineText || "—"}
                    </td>
                    {canEdit ? (
                      <RouterTunnelCell
                        deviceId={r.deviceId}
                        winboxTunnelAddress={r.winboxTunnelAddress}
                        winboxTunnelPort={r.winboxTunnelPort}
                        webConsoleUrl={r.webConsoleUrl}
                        tunnelExpiresAt={r.tunnelExpiresAt}
                        canEdit={canEdit}
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
                          <span className="text-[11px] text-muted-foreground">
                            {r.webConsoleUrl ? "Available" : "—"}
                          </span>
                        </td>
                      </>
                    )}
                    <td className="py-4 px-6 text-right">
                      <RouterActionsDropdown
                        router={{
                          id: r.id,
                          routerId: r.routerId,
                          name: r.name,
                          model: r.model,
                          status: r.status,
                          managementIp: r.managementIp,
                          winboxTunnelAddress: r.winboxTunnelAddress,
                          webConsoleUrl: r.webConsoleUrl,
                          tunnelExpiresAt: r.tunnelExpiresAt,
                        }}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
