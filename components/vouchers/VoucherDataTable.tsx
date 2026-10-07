"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Download, Printer, Search } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/data-table";
import { DataTableFilterPill } from "@/components/shared/data-table-filter-pill";
import type { VoucherItem, VoucherStatus } from "@/lib/types/vouchers";

const states: Array<"ALL" | VoucherStatus> = ["ALL", "UNUSED", "USED", "EXPIRED", "VOID", "PENDING", "FAILED"];
const sources = ["ALL", "MINTED", "PURCHASED"] as const;
const statusStyles: Record<VoucherStatus, string> = { UNUSED: "bg-emerald-100 text-emerald-800", USED: "bg-amber-100 text-amber-900", EXPIRED: "bg-zinc-100 text-zinc-700", VOID: "bg-red-100 text-red-800", PENDING: "bg-sky-100 text-sky-800", FAILED: "bg-red-100 text-red-800" };

export function VoucherDataTable({ vouchers, page, totalPages, totalElements, size, state, search, source }: { vouchers: VoucherItem[]; page: number; totalPages: number; totalElements: number; size: number; state: "ALL" | VoucherStatus; search: string; source: "ALL" | "MINTED" | "PURCHASED" }) {
  const router = useRouter();
  function update(values: Record<string, string | null>) {
    const params = new URLSearchParams(window.location.search);
    for (const [key, value] of Object.entries(values)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    router.push(`/finance/vouchers${params.size ? `?${params}` : ""}`);
  }
  function exportCsv() {
    const rows = [["Code", "Batch", "Package", "State", "Expires", "Created", "Redeemed"], ...vouchers.map((v) => [v.code, v.voucherBatchId ?? "", v.packageName ?? "", v.status, v.expiresText ?? "", v.createdAt ?? "", v.redeemedByPhone ?? v.redeemedByMac ?? ""])];
    const csv = rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `vouchers-${state.toLowerCase()}.csv`; a.click(); URL.revokeObjectURL(url);
  }

  const columns: ColumnDef<VoucherItem>[] = [
    { accessorKey: "code", header: "Code", cell: ({ row }) => <span className="font-mono font-medium">{row.original.code}</span> },
    {
      id: "package",
      header: "Package",
      cell: ({ row }) => {
        const v = row.original;
        return (
          <>
            {v.packageName ?? "—"}
            <p className="text-xs text-muted-foreground">
              {v.packageSpeed ?? v.planSpeed ?? ""}
              {v.packageValidityLabel ? ` · ${v.packageValidityLabel}` : v.durationText ? ` · ${v.durationText}` : ""}
            </p>
          </>
        );
      },
    },
    {
      accessorKey: "status",
      header: "State",
      cell: ({ row }) => <span className={`rounded-full px-2 py-1 text-xs ${statusStyles[row.original.status]}`}>{row.original.status}</span>,
    },
    {
      id: "expires",
      header: "Expires",
      cell: ({ row }) => (row.original.expiryStartsOnFirstUse ? "Starts on first use" : row.original.expiresText ?? "—"),
    },
    { accessorKey: "createdAt", header: "Created", cell: ({ row }) => row.original.createdAt ?? "—" },
    {
      id: "redeemedBy",
      header: "Redeemed by",
      cell: ({ row }) => row.original.redeemedByPhone ?? row.original.redeemedByMac ?? "—",
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={vouchers}
      manualPagination
      pageCount={totalPages}
      pageIndex={page}
      pageSize={size}
      totalRows={totalElements}
      onPaginationChange={(pageIndex, pageSize) => update({ page: String(pageIndex), size: String(pageSize) })}
      filters={
        <>
          <form
            className="relative"
            onSubmit={(e) => {
              e.preventDefault();
              update({ search: (e.currentTarget.elements.namedItem("search") as HTMLInputElement).value || null, page: null });
            }}
          >
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <input name="search" defaultValue={search} placeholder="Search voucher, phone, batch..." className="h-8 w-64 rounded-md border bg-background pl-8 pr-3 text-xs" />
          </form>
          <div className="flex flex-wrap gap-1">
            {states.map((item) => (
              <DataTableFilterPill key={item} active={state === item} onClick={() => update({ voucherState: item === "ALL" ? null : item, page: null })}>
                {item === "ALL" ? "All" : item}
              </DataTableFilterPill>
            ))}
          </div>
          <div className="flex flex-wrap gap-1">
            {sources.map((item) => (
              <DataTableFilterPill key={item} active={source === item} onClick={() => update({ source: item === "ALL" ? null : item, page: null })}>
                {item === "ALL" ? "All sources" : item}
              </DataTableFilterPill>
            ))}
          </div>
        </>
      }
      toolbar={
        <>
          <Button type="button" variant="secondary" size="sm" onClick={exportCsv}>
            <Download className="size-3.5" />
            CSV
          </Button>
          <Button asChild variant="secondary" size="sm">
            <Link href="/finance/vouchers/print">
              <Printer className="size-3.5" />
              Print
            </Link>
          </Button>
        </>
      }
    />
  );
}
