"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import type { NasRouterItem } from "@/lib/types/provisioning";
import { isRouterOnline } from "@/lib/utils/router-status";
import { RouterActionsDropdown } from "@/components/network/RouterActionsDropdown";
import { RouterTunnelCell } from "@/components/network/RouterTunnelCell";
import { DataTable } from "@/components/shared/data-table";
import { DataTableFilterPill } from "@/components/shared/data-table-filter-pill";

type StatusFilter = "all" | "online" | "offline";

export function NasRoutersTable({
  routers,
  canEdit,
}: {
  routers: NasRouterItem[];
  canEdit: boolean;
}) {
  const [filter, setFilter] = useState<StatusFilter>("all");
  // Retired routers keep their record for history but are not part of the fleet.
  const [showRetired, setShowRetired] = useState(false);

  const retiredCount = useMemo(() => routers.filter((r) => r.retired).length, [routers]);
  const fleet = useMemo(
    () => (showRetired ? routers : routers.filter((r) => !r.retired)),
    [routers, showRetired]
  );
  const onlineCount = useMemo(() => fleet.filter(isRouterOnline).length, [fleet]);

  const visible = useMemo(() => {
    return fleet.filter((r) => {
      const online = isRouterOnline(r);
      if (filter === "online" && !online) return false;
      if (filter === "offline" && online) return false;
      return true;
    });
  }, [fleet, filter]);

  const columns: ColumnDef<NasRouterItem>[] = [
    {
      id: "router",
      header: "Router / Model",
      accessorFn: (r) => `${r.name} ${r.model} ${r.managementIp}`,
      cell: ({ row }) => {
        const routerId = Number(row.original.routerId);
        return (
          <div>
            {Number.isFinite(routerId) && routerId > 0 ? (
              <Link
                href={`/network/routers/${routerId}`}
                className="font-semibold text-foreground hover:text-primary hover:underline underline-offset-2"
              >
                {row.original.name}
              </Link>
            ) : (
              <div className="font-semibold text-foreground">{row.original.name}</div>
            )}
            <div className="text-[11px] text-muted-foreground font-sans tabular-nums">{row.original.model}</div>
          </div>
        );
      },
    },
    {
      id: "ip",
      header: "IP (Tunnel)",
      cell: ({ row }) => <span className="text-foreground font-sans tabular-nums text-xs">{row.original.managementIp}</span>,
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => {
        const r = row.original;
        return (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
              r.status === "ONLINE"
                ? "bg-emerald-500/15 text-emerald-700"
                : r.status === "DEGRADED"
                  ? "bg-amber-500/15 text-amber-800"
                  : r.status === "NOT_PROVISIONED"
                    ? "bg-zinc-100 text-zinc-700"
                    : "bg-red-500/10 text-red-700"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                r.status === "ONLINE"
                  ? "bg-emerald-500"
                  : r.status === "DEGRADED"
                    ? "bg-amber-500"
                    : r.status === "NOT_PROVISIONED"
                      ? "bg-zinc-500"
                      : "bg-red-500"
              }`}
            />
            {r.status.replaceAll("_", " ")}
          </span>
        );
      },
    },
    {
      id: "cpu",
      header: "CPU Load",
      cell: ({ row }) => {
        const cpu = Number.isFinite(Number(row.original.cpuUsage)) ? Number(row.original.cpuUsage) : null;
        return cpu != null ? (
          <div className="flex items-center gap-2">
            <span className="text-xs font-sans tabular-nums text-foreground">{cpu}%</span>
            <div className="w-16 bg-muted h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full transition-all" style={{ width: `${Math.min(Math.max(cpu, 4), 100)}%` }} />
            </div>
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    },
    {
      id: "ram",
      header: "RAM Usage",
      cell: ({ row }) => {
        const freeMemMB = row.original.freeMemory ? Math.round(row.original.freeMemory / (1024 * 1024)) : null;
        return <span className="text-xs font-sans tabular-nums text-foreground">{freeMemMB != null ? `${freeMemMB} MB free` : "—"}</span>;
      },
    },
    {
      id: "sessions",
      header: "Sessions",
      cell: ({ row }) => <span className="font-sans tabular-nums font-bold text-foreground">{row.original.activeSessions ?? "—"}</span>,
    },
    {
      id: "uptime",
      header: "Uptime",
      cell: ({ row }) => <span className="text-xs text-muted-foreground font-sans tabular-nums">{row.original.uptime || row.original.lastOnlineText || "—"}</span>,
    },
    {
      id: "tunnel",
      header: "Tunnel & Console",
      cell: ({ row }) => {
        const r = row.original;
        if (canEdit) {
          return (
            <RouterTunnelCell
              deviceId={r.deviceId}
              winboxTunnelAddress={r.winboxTunnelAddress}
              winboxTunnelPort={r.winboxTunnelPort}
              webConsoleUrl={r.webConsoleUrl}
              tunnelExpiresAt={r.tunnelExpiresAt}
              canEdit={canEdit}
            />
          );
        }
        return (
          <div className="flex items-center gap-4">
            {r.winboxTunnelAddress ? (
              <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-[11px] font-sans tabular-nums text-teal-400">
                :{(r.winboxTunnelPort ?? r.winboxTunnelAddress.split(":")[1]) ?? "—"}
              </span>
            ) : (
              <span className="text-[11px] text-muted-foreground">—</span>
            )}
            <span className="text-[11px] text-muted-foreground">{r.webConsoleUrl ? "Available" : "—"}</span>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: () => <span className="block text-right">Action</span>,
      cell: ({ row }) => {
        const r = row.original;
        return (
          <div className="text-right">
            <RouterActionsDropdown
              variant="row"
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
          </div>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={visible}
      searchPlaceholder="Search name, model, or IP…"
      filters={
        <div className="flex items-center gap-1.5">
          <DataTableFilterPill active={filter === "all"} onClick={() => setFilter("all")}>
            All <span className="ml-1 font-sans tabular-nums">{fleet.length}</span>
          </DataTableFilterPill>
          <DataTableFilterPill active={filter === "online"} onClick={() => setFilter("online")}>
            Online <span className="ml-1 font-sans tabular-nums">{onlineCount}</span>
          </DataTableFilterPill>
          <DataTableFilterPill active={filter === "offline"} onClick={() => setFilter("offline")}>
            Offline <span className="ml-1 font-sans tabular-nums">{fleet.length - onlineCount}</span>
          </DataTableFilterPill>
          {retiredCount > 0 && (
            <DataTableFilterPill active={showRetired} onClick={() => setShowRetired((v) => !v)}>
              Show retired <span className="ml-1 font-sans tabular-nums">{retiredCount}</span>
            </DataTableFilterPill>
          )}
        </div>
      }
    />
  );
}
