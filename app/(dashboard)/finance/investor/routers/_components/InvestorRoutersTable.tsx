"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import type { InvestorRouterListItem } from "@/lib/types/investor";

interface Props {
  routers: InvestorRouterListItem[];
}

const formatDateTime = (value: string | null): string =>
  value
    ? new Date(value).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

export function InvestorRoutersTable({ routers }: Props) {
  const columns = useMemo<ColumnDef<InvestorRouterListItem>[]>(
    () => [
      {
        id: "router",
        header: "Router",
        accessorFn: (r) => r.routerName || `Router ${r.routerId}`,
        // routerId here is network_device.id, the id the investor router page takes
        cell: ({ row }) => (
          <Link
            href={`/finance/investor/routers/${row.original.routerId}`}
            className="font-medium hover:text-primary hover:underline underline-offset-2"
          >
            {row.original.routerName || `Router ${row.original.routerId}`}
          </Link>
        ),
      },
      { accessorKey: "model", header: "Model", cell: ({ row }) => row.original.model || "—" },
      {
        accessorKey: "ipAddress",
        header: "IP",
        cell: ({ row }) => <span className="font-sans tabular-nums text-xs">{row.original.ipAddress || "—"}</span>,
      },
      { accessorKey: "stationName", header: "Station", cell: ({ row }) => row.original.stationName || "—" },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={row.original.status ? "default" : "destructive"}>
            {row.original.status ? "Online" : "Offline"}
          </Badge>
        ),
      },
      {
        id: "lastOnline",
        header: "Last online",
        accessorFn: (r) => r.lastOnline ?? "",
        cell: ({ row }) => formatDateTime(row.original.lastOnline),
      },
      { accessorKey: "uptime", header: "Uptime", cell: ({ row }) => row.original.uptime || "—" },
      {
        id: "snapshot",
        header: "Snapshot",
        cell: ({ row }) => {
          const traits = row.original.snapshotTraits;
          return traits
            ? `CPU ${traits.cpuUsage}% · ${traits.activePppoeSessions} PPPoE · ${traits.activeHotspotSessions} hotspot`
            : "No telemetry";
        },
      },
    ],
    []
  );

  return <DataTable columns={columns} data={routers} searchPlaceholder="Search routers…" />;
}
