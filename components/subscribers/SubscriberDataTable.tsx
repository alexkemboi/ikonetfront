"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
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

  function navigate(next: { page?: number; statusFilter?: string; search?: string }) {
    const params = new URLSearchParams();
    const nextFilter = next.statusFilter ?? statusFilter;
    const nextSearch = next.search ?? search;
    const nextPage = next.page ?? 0;
    if (nextPage > 0) params.set("page", String(nextPage));
    if (nextFilter !== "ALL") params.set("statusFilter", nextFilter);
    if (nextSearch) params.set("search", nextSearch);
    router.push(`/customers${params.size ? `?${params.toString()}` : ""}`);
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter account status">
          {FILTERS.map(({ value, label }) => {
            const count = value === "ALL" ? kpis.allUsersCount : kpis.statusCounts[value.toLowerCase() as keyof typeof kpis.statusCounts];
            return (
              <button key={value} type="button" onClick={() => navigate({ statusFilter: value })}
                className={cn("rounded-md px-3 py-1.5 text-xs font-medium", statusFilter === value ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")}>
                {label} <span className="ml-1 tabular-nums">{count}</span>
              </button>
            );
          })}
        </div>
        <form className="relative" onSubmit={(event) => { event.preventDefault(); navigate({ search: searchInput.trim() }); }}>
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search name, code, phone..."
            className="h-9 w-64 rounded-md border border-border bg-background pl-8 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        </form>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px] text-left">
          <thead><tr className="border-b border-border text-[11px] uppercase text-muted-foreground">
            <th className="px-4 py-3">Subscriber</th><th className="px-4 py-3">Phone &amp; email</th><th className="px-4 py-3">Plan</th>
            <th className="px-4 py-3">Expiry</th><th className="px-4 py-3">Account</th><th className="px-4 py-3">Connection</th><th className="px-4 py-3">NAS</th>
          </tr></thead>
          <tbody>
            {pageData.content.length === 0 ? <tr><td colSpan={7} className="px-4 py-14 text-center text-sm text-muted-foreground">No subscribers match this query.</td></tr> :
              pageData.content.map((subscriber: SubscriberItem) => <tr key={subscriber.id} className="border-b border-border hover:bg-muted/40">
                <td className="px-4 py-3"><p className="text-sm font-medium">{subscriber.fullName}</p><p className="text-xs text-muted-foreground">{subscriber.code}{subscriber.macAddress ? ` · ${subscriber.macAddress}` : ""}</p></td>
                <td className="px-4 py-3"><p className="text-sm">{subscriber.phone}</p><p className="max-w-[180px] truncate text-xs text-muted-foreground">{subscriber.email || "—"}</p></td>
                <td className="px-4 py-3"><p className="text-sm">{subscriber.planName}</p><p className="text-xs text-muted-foreground">{[subscriber.planSpeed, subscriber.planPrice == null ? null : `KES ${subscriber.planPrice}`].filter(Boolean).join(" · ") || "—"}</p></td>
                <td className="px-4 py-3"><span className={subscriber.isExpiringToday ? "font-medium text-amber-700" : "text-muted-foreground"}>{subscriber.expiryText || "—"}</span></td>
                <td className="px-4 py-3"><span className={cn("rounded-full px-2 py-1 text-xs", accountColors[subscriber.status])}>{subscriber.status}</span></td>
                <td className="px-4 py-3"><span className={subscriber.isOnline ? "text-emerald-700" : "text-muted-foreground"}>{subscriber.isOnline ? "Online" : "Offline"}</span><p className="text-xs text-muted-foreground">{subscriber.lastSeenAt ? `Last seen ${new Date(subscriber.lastSeenAt).toLocaleString()}` : "Never connected"}</p></td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{subscriber.nasName || "—"}</td>
              </tr>)}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
        <span>Showing {pageData.totalElements === 0 ? 0 : pageData.number * pageData.size + 1}-{Math.min((pageData.number + 1) * pageData.size, pageData.totalElements)} of {pageData.totalElements} rows · KPIs cover matching search across all pages</span>
        <div className="flex items-center gap-2">
          <button type="button" disabled={pageData.number <= 0} onClick={() => navigate({ page: pageData.number - 1 })} className="rounded border px-2 py-1 disabled:opacity-40">Previous</button>
          <span>{pageData.number + 1} / {Math.max(1, pageData.totalPages)}</span>
          <button type="button" disabled={pageData.number + 1 >= pageData.totalPages} onClick={() => navigate({ page: pageData.number + 1 })} className="rounded border px-2 py-1 disabled:opacity-40">Next</button>
        </div>
      </div>
    </div>
  );
}
