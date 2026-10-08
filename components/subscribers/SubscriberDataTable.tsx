"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import { DataTable } from "@/components/shared/data-table";
import { DataTableFilterPill } from "@/components/shared/data-table-filter-pill";
import type { SubscriberAccountStatus, SubscriberItem, SubscriberKpis, SubscriberRowsPage } from "@/lib/types/subscribers";

const FILTERS: Array<{ value: "ALL" | SubscriberAccountStatus; label: string }> = [
  { value: "ALL", label: "All" },
  { value: "ACTIVE", label: "Active" },
  { value: "GRACE", label: "Grace" },
  { value: "EXPIRED", label: "Expired" },
  { value: "SUSPENDED", label: "Suspended" },
];

const accountColors: Record<SubscriberAccountStatus, string> = {
  ACTIVE: "text-emerald-700 bg-emerald-50",
  GRACE: "text-amber-800 bg-amber-50",
  EXPIRED: "text-zinc-700 bg-zinc-100",
  SUSPENDED: "text-red-700 bg-red-50",
};

export function SubscriberDataTable({
  pageData,
  kpis,
  statusFilter,
  search,
}: {
  pageData: SubscriberRowsPage;
  kpis: SubscriberKpis;
  statusFilter: "ALL" | SubscriberAccountStatus;
  search: string;
}) {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState(search);

  function navigate(next: { page?: number; statusFilter?: string; search?: string; size?: number }) {
    const params = new URLSearchParams();
    const nextFilter = next.statusFilter ?? statusFilter;
    const nextSearch = next.search ?? search;
    const nextPage = next.page ?? 0;
    if (nextPage > 0) params.set("page", String(nextPage));
    if (nextFilter !== "ALL") params.set("statusFilter", nextFilter);
    if (nextSearch) params.set("search", nextSearch);
    if (next.size && next.size !== pageData.size) params.set("size", String(next.size));
    router.push(`/customers${params.size ? `?${params.toString()}` : ""}`);
  }

  const columns: ColumnDef<SubscriberItem>[] = [
    {
      id: "subscriber",
      header: "Subscriber",
      cell: ({ row }) => {
        const s = row.original;
        return (
          <div>
            <p className="text-sm font-medium">{s.fullName}</p>
            <p className="text-xs text-muted-foreground">
              {s.code}
              {s.macAddress ? ` · ${s.macAddress}` : ""}
            </p>
          </div>
        );
      },
    },
    {
      id: "contact",
      header: "Phone & email",
      cell: ({ row }) => (
        <div>
          <p className="text-sm">{row.original.phone}</p>
          <p className="max-w-[180px] truncate text-xs text-muted-foreground">{row.original.email || "—"}</p>
        </div>
      ),
    },
    {
      id: "plan",
      header: "Plan",
      cell: ({ row }) => {
        const s = row.original;
        return (
          <div>
            <p className="text-sm">{s.planName}</p>
            <p className="text-xs text-muted-foreground">
              {[s.planSpeed, s.planPrice == null ? null : `KES ${s.planPrice}`].filter(Boolean).join(" · ") || "—"}
            </p>
          </div>
        );
      },
    },
    {
      id: "expiry",
      header: "Expiry",
      cell: ({ row }) => (
        <span className={row.original.isExpiringToday ? "font-medium text-amber-700" : "text-muted-foreground"}>
          {row.original.expiryText || "—"}
        </span>
      ),
    },
    {
      id: "account",
      header: "Account",
      cell: ({ row }) => (
        <span className={cn("rounded-full px-2 py-1 text-xs", accountColors[row.original.status])}>{row.original.status}</span>
      ),
    },
    {
      id: "connection",
      header: "Connection",
      cell: ({ row }) => {
        const s = row.original;
        return (
          <div>
            <span className={s.isOnline ? "text-emerald-700" : "text-muted-foreground"}>{s.isOnline ? "Online" : "Offline"}</span>
            <p className="text-xs text-muted-foreground">{s.lastSeenAt ? `Last seen ${new Date(s.lastSeenAt).toLocaleString()}` : "Never connected"}</p>
          </div>
        );
      },
    },
    { id: "nas", header: "NAS", cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.nasName || "—"}</span> },
  ];

  return (
    <DataTable
      columns={columns}
      data={pageData.content}
      manualPagination
      pageCount={pageData.totalPages}
      pageIndex={pageData.number}
      pageSize={pageData.size}
      totalRows={pageData.totalElements}
      onPaginationChange={(pageIndex, pageSize) => navigate({ page: pageIndex, size: pageSize })}
      hideSearch
      filters={
        <>
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter account status">
            {FILTERS.map(({ value, label }) => {
              const count = value === "ALL" ? kpis.allUsersCount : kpis.statusCounts[value.toLowerCase() as keyof typeof kpis.statusCounts];
              return (
                <DataTableFilterPill key={value} active={statusFilter === value} onClick={() => navigate({ statusFilter: value })}>
                  {label} <span className="ml-1 tabular-nums">{count}</span>
                </DataTableFilterPill>
              );
            })}
          </div>
          <form
            className="relative"
            onSubmit={(event) => {
              event.preventDefault();
              navigate({ search: searchInput.trim() });
            }}
          >
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search name, code, phone..."
              className="h-8 w-64 rounded-md border border-border bg-background pl-8 pr-3 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </form>
        </>
      }
    />
  );
}
