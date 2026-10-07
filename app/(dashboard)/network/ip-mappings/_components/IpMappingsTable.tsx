"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import type { IpMappingResponse } from "@/lib/types/api";
import { DataTable } from "@/components/shared/data-table";
import { DataTableFilterPill } from "@/components/shared/data-table-filter-pill";

type StatusFilter = "ALL" | "ONLINE" | "LOST" | "EXPIRED";

function formatExpiryCountdown(expiresAt?: string): string {
  if (!expiresAt) return "—";
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diffMs = expiry.getTime() - now.getTime();
  if (diffMs <= 0) return "Ended";
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins}m left`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h left`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d left`;
}

/** 254725134318 → 0725 134 318 */
function formatPhone(phone?: string): string | undefined {
  if (!phone) return undefined;
  const digits = phone.replace(/\D/g, "");
  const local = digits.startsWith("254") && digits.length === 12 ? `0${digits.slice(3)}` : digits;
  return local.length === 10 ? `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}` : phone;
}

function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function IpMappingsTable({ mappings }: { mappings: IpMappingResponse[] }) {
  const [status, setStatus] = useState<StatusFilter>("ALL");

  const counts = useMemo(
    () => ({
      ALL: mappings.length,
      ONLINE: mappings.filter((m) => m.status === "ONLINE").length,
      LOST: mappings.filter((m) => m.status === "LOST").length,
      EXPIRED: mappings.filter((m) => m.status === "EXPIRED").length,
    }),
    [mappings]
  );

  const visible = useMemo(
    () => (status === "ALL" ? mappings : mappings.filter((m) => m.status === status)),
    [mappings, status]
  );

  const columns: ColumnDef<IpMappingResponse>[] = [
    {
      id: "ip",
      header: "IP Address",
      accessorFn: (m) => m.ipAddress,
      cell: ({ row }) => <span className="font-sans tabular-nums text-sm font-medium">{row.original.ipAddress}</span>,
    },
    {
      id: "mac",
      header: "MAC Address",
      accessorFn: (m) => m.macAddress,
      cell: ({ row }) => <span className="font-sans tabular-nums text-sm">{row.original.macAddress}</span>,
    },
    {
      id: "subscriber",
      header: "Subscriber / Phone",
      accessorFn: (m) => [formatPhone(m.subscriberPhone), m.subscriberName, m.username, m.packageName].filter(Boolean).join(" "),
      cell: ({ row }) => {
        const m = row.original;
        return (
          <div>
            <div className="font-medium text-foreground">{formatPhone(m.subscriberPhone) || m.subscriberName || m.username || "—"}</div>
            <div className="text-xs text-muted-foreground">
              {m.packageName ? m.packageName : m.serviceType === "PPPOE" ? `PPPoE · ${m.username}` : "Not linked to a purchase"}
            </div>
          </div>
        );
      },
    },
    {
      id: "router",
      header: "Router",
      accessorFn: (m) => [m.routerName, m.stationName, m.nasIp].filter(Boolean).join(" "),
      cell: ({ row }) => (
        <div>
          <div className="text-foreground">{row.original.routerName || "—"}</div>
          <div className="text-xs text-muted-foreground">{row.original.stationName || row.original.nasIp || "—"}</div>
        </div>
      ),
    },
    {
      id: "receipt",
      header: "Receipt / Voucher",
      accessorFn: (m) => [m.mpesaReceipt, m.voucher].filter(Boolean).join(" "),
      cell: ({ row }) => {
        const m = row.original;
        return m.mpesaReceipt || m.voucher ? (
          <>
            {m.mpesaReceipt && <div className="font-mono text-xs font-semibold text-emerald-400">{m.mpesaReceipt}</div>}
            {m.voucher && <div className="font-mono text-xs text-muted-foreground">Voucher: {m.voucher}</div>}
          </>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    },
    {
      id: "traffic",
      header: "Traffic",
      cell: ({ row }) => (
        <div className="whitespace-nowrap font-sans tabular-nums text-sm">
          <div className="text-foreground">{formatBytes(row.original.bytesOut)} ↓</div>
          <div className="text-xs text-muted-foreground">{formatBytes(row.original.bytesIn)} ↑</div>
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => {
        const m = row.original;
        return (
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${
              m.status === "ONLINE"
                ? "bg-success/10 text-success border-success/20"
                : m.status === "LOST"
                  ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                  : "bg-destructive/10 text-destructive border-destructive/20"
            }`}
            title={m.status === "LOST" ? "The router stopped reporting this session without ending it — router or CPE lost power/link." : undefined}
          >
            {m.status === "LOST" ? "LOST CONTACT" : m.status === "EXPIRED" ? "ENDED" : m.status || "—"}
          </span>
        );
      },
    },
    {
      id: "remaining",
      header: () => <span className="block text-right">Remaining</span>,
      cell: ({ row }) => <span className="block text-right text-sm text-muted-foreground">{formatExpiryCountdown(row.original.expiresAt)}</span>,
    },
    {
      id: "lastSeen",
      header: () => <span className="block text-right">Last Seen</span>,
      cell: ({ row }) => (
        <span className="block text-right text-sm text-muted-foreground">
          {row.original.lastSeen
            ? new Date(row.original.lastSeen).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
            : "—"}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={visible}
      searchPlaceholder="Search IP, MAC, subscriber, router…"
      filters={
        <div className="flex items-center gap-1.5">
          <DataTableFilterPill active={status === "ALL"} onClick={() => setStatus("ALL")}>
            All <span className="ml-1 font-sans tabular-nums">{counts.ALL}</span>
          </DataTableFilterPill>
          <DataTableFilterPill active={status === "ONLINE"} onClick={() => setStatus("ONLINE")}>
            Online <span className="ml-1 font-sans tabular-nums">{counts.ONLINE}</span>
          </DataTableFilterPill>
          <DataTableFilterPill active={status === "LOST"} onClick={() => setStatus("LOST")}>
            Lost contact <span className="ml-1 font-sans tabular-nums">{counts.LOST}</span>
          </DataTableFilterPill>
          <DataTableFilterPill active={status === "EXPIRED"} onClick={() => setStatus("EXPIRED")}>
            Ended <span className="ml-1 font-sans tabular-nums">{counts.EXPIRED}</span>
          </DataTableFilterPill>
        </div>
      }
    />
  );
}
