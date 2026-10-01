"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Download, Printer, Search } from "lucide-react";
import type { VoucherItem, VoucherStatus } from "@/lib/types/vouchers";

const states: Array<"ALL" | VoucherStatus> = ["ALL", "UNUSED", "USED", "EXPIRED", "VOID", "PENDING", "FAILED"];
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
  return <section className="overflow-hidden rounded-lg border border-border bg-card">
    <div className="flex flex-col gap-3 border-b p-4"><div className="flex flex-wrap gap-1">{states.map((item) => <button key={item} type="button" onClick={() => update({ voucherState: item === "ALL" ? null : item, page: null })} className={`rounded-md px-2 py-1.5 text-xs ${state === item ? "bg-foreground text-background" : "text-muted-foreground"}`}>{item === "ALL" ? "All" : item}</button>)}</div><div className="flex flex-wrap gap-1">{(["ALL", "MINTED", "PURCHASED"] as const).map((item) => <button key={item} type="button" onClick={() => update({ source: item === "ALL" ? null : item, page: null })} className={`rounded-md px-2 py-1 text-xs ${source === item ? "bg-muted text-foreground" : "text-muted-foreground"}`}>{item === "ALL" ? "All sources" : item}</button>)}</div><div className="flex flex-wrap items-center justify-between gap-2"><form className="relative" onSubmit={(e) => { e.preventDefault(); update({ search: (e.currentTarget.elements.namedItem("search") as HTMLInputElement).value || null, page: null }); }}><Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground"/><input name="search" defaultValue={search} placeholder="Search voucher, phone, batch..." className="h-9 w-64 rounded-md border bg-background pl-8 pr-3 text-sm"/></form><div className="flex gap-2"><button type="button" onClick={exportCsv} className="inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-xs"><Download className="size-3.5"/>CSV</button><Link href="/finance/vouchers/print" className="inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-xs"><Printer className="size-3.5"/>Print</Link></div></div></div>
    <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead><tr className="border-b text-[11px] uppercase text-muted-foreground"><th className="p-3">Code</th><th className="p-3">Package</th><th className="p-3">State</th><th className="p-3">Expires</th><th className="p-3">Created</th><th className="p-3">Redeemed by</th></tr></thead><tbody>{vouchers.length ? vouchers.map((v) => <tr key={v.id} className="border-b"><td className="p-3 font-mono font-medium">{v.code}</td><td className="p-3">{v.packageName ?? "—"}<p className="text-xs text-muted-foreground">{v.packageSpeed ?? v.planSpeed ?? ""}{v.packageValidityLabel ? ` · ${v.packageValidityLabel}` : v.durationText ? ` · ${v.durationText}` : ""}</p></td><td className="p-3"><span className={`rounded-full px-2 py-1 text-xs ${statusStyles[v.status]}`}>{v.status}</span></td><td className="p-3">{v.expiryStartsOnFirstUse ? "Starts on first use" : v.expiresText ?? "—"}</td><td className="p-3">{v.createdAt ?? "—"}</td><td className="p-3">{v.redeemedByPhone ?? v.redeemedByMac ?? "—"}</td></tr>) : <tr><td colSpan={6} className="p-12 text-center text-sm text-muted-foreground">No vouchers match this query.</td></tr>}</tbody></table></div>
    <div className="flex items-center justify-between border-t p-3 text-xs text-muted-foreground"><span>Showing {totalElements === 0 ? 0 : page * size + 1}-{Math.min((page + 1) * size, totalElements)} of {totalElements}</span><div className="flex items-center gap-2"><button type="button" disabled={page <= 0} onClick={() => update({ page: String(page - 1) })} className="rounded border px-2 py-1 disabled:opacity-40">Previous</button><span>{page + 1}/{Math.max(1, totalPages)}</span><button type="button" disabled={page + 1 >= totalPages} onClick={() => update({ page: String(page + 1) })} className="rounded border px-2 py-1 disabled:opacity-40">Next</button></div></div>
  </section>;
}
