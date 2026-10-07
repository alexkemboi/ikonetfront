"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import type {
  InvestorAgreement,
  InvestorBillingSnapshot,
  RouterAttributionItem,
} from "@/lib/types/investor";

const formatKES = (value: number): string =>
  new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(
    Number.isFinite(value) ? value : 0
  );

const formatDate = (value: string | null): string =>
  value ? new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export function RouterAttributionTable({ rows }: { rows: RouterAttributionItem[] }) {
  const columns = useMemo<ColumnDef<RouterAttributionItem>[]>(
    () => [
      {
        id: "router",
        header: "Router",
        accessorFn: (r) => r.routerName || r.routerId,
        cell: ({ row }) => row.original.routerName || row.original.routerId,
      },
      { accessorKey: "stationName", header: "Station", cell: ({ row }) => row.original.stationName || "—" },
      {
        accessorKey: "hotspotRevenue",
        header: "Hotspot Revenue",
        cell: ({ row }) => formatKES(row.original.hotspotRevenue),
      },
      { accessorKey: "pppoeSubscribers", header: "PPPoE Subscribers" },
      {
        accessorKey: "totalAttributedRevenue",
        header: "Attributed Revenue",
        cell: ({ row }) => <span className="font-medium">{formatKES(row.original.totalAttributedRevenue)}</span>,
      },
    ],
    []
  );

  return <DataTable columns={columns} data={rows} searchPlaceholder="Search routers…" />;
}

export function BillingSnapshotsTable({ rows }: { rows: InvestorBillingSnapshot[] }) {
  const columns = useMemo<ColumnDef<InvestorBillingSnapshot>[]>(
    () => [
      { accessorKey: "snapshotNumber", header: "#" },
      { accessorKey: "periodYearMonth", header: "Period" },
      {
        accessorKey: "totalMaintenanceDue",
        header: "Maintenance Due",
        cell: ({ row }) => formatKES(row.original.totalMaintenanceDue),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.status;
          return (
            <Badge variant={status === "PAID" ? "default" : status === "FINALIZED" ? "secondary" : "outline"}>
              {status}
            </Badge>
          );
        },
      },
    ],
    []
  );

  return <DataTable columns={columns} data={rows} searchPlaceholder="Search snapshots…" />;
}

export function AgreementsTable({ rows }: { rows: InvestorAgreement[] }) {
  const columns = useMemo<ColumnDef<InvestorAgreement>[]>(
    () => [
      { accessorKey: "name", header: "Name" },
      { accessorKey: "agreementCode", header: "Code" },
      {
        id: "effective",
        header: "Effective",
        accessorFn: (a) => `${a.effectiveStartDate} ${a.effectiveEndDate ?? ""}`,
        cell: ({ row }) =>
          `${formatDate(row.original.effectiveStartDate)} → ${formatDate(row.original.effectiveEndDate)}`,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={row.original.status === "ACTIVE" ? "default" : "outline"}>{row.original.status}</Badge>
        ),
      },
    ],
    []
  );

  return <DataTable columns={columns} data={rows} searchPlaceholder="Search agreements…" />;
}
