"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search, Download, Printer, MoreHorizontal } from "lucide-react";
import {
 VoucherItem,
 VoucherStatus,
} from "@/lib/types/vouchers";

interface Props {
 vouchers: VoucherItem[];
}

const STATUS_PILLS: Record<VoucherStatus, string> = {
 UNUSED: "bg-emerald-500/15 text-emerald-400",
 USED: "bg-amber-500/15 text-amber-400",
 EXPIRED: "bg-zinc-800 text-muted-foreground",
 VOID: "bg-red-500/15 text-red-400",
};

const TABS: Array<"ALL" | VoucherStatus> = [
 "ALL",
 "UNUSED",
 "USED",
 "EXPIRED",
 "VOID",
];

export function VoucherDataTable({ vouchers }: Props) {
 const [tab, setTab] = useState<"ALL" | VoucherStatus>("UNUSED");
 const [search, setSearch] = useState("");

 const filtered = vouchers.filter((v) => {
 if (tab !== "ALL" && v.status !== tab) return false;
 if (search.trim()) {
 const q = search.toLowerCase();
 return (
 v.code.toLowerCase().includes(q) ||
 (v.packageName ?? "").toLowerCase().includes(q) ||
 (v.batchNumber ?? "").toLowerCase().includes(q)
 );
 }
 return true;
 });

 function exportCsv() {
 const header = [
 "Code",
 "Batch",
 "Package",
 "Status",
 "Expires",
 "Created",
 "Redeemed",
 ];
 const rows = filtered
 .filter((v) => !v.isFallback)
 .map((v) => [
 v.code,
 v.batchNumber ?? "",
 v.packageName ?? "",
 v.status,
 v.expiresText ?? "",
 v.createdAt ?? "",
 v.redeemedByPhone ?? v.redeemedByMac ?? "",
 ]);
 const csv = [header, ...rows]
 .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
 .join("\n");
 const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
 const url = URL.createObjectURL(blob);
 const a = document.createElement("a");
 a.href = url;
 a.download = `vouchers-${tab.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`;
 document.body.appendChild(a);
 a.click();
 document.body.removeChild(a);
 URL.revokeObjectURL(url);
 }

 return (
 <div className="rounded-2xl border border-border bg-card p-6 shadow-xl">
 {/* Top Filter Strip */}
 <div className="flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
 {/* Status Tabs */}
 <div className="flex flex-wrap items-center gap-1 rounded-full border border-border bg-muted p-1">
 {TABS.map((s) => (
 <button
 key={s}
 onClick={() => setTab(s)}
 className={`rounded-full px-3.5 py-1 text-xs font-medium transition ${
 tab === s ? "bg-zinc-800 text-foreground" : "text-muted-foreground hover:text-accent-foreground"
 }`}
 >
 {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}{" "}
 <span className="font-mono text-muted-foreground">
 {s === "ALL" ? vouchers.length : vouchers.filter((v) => v.status === s).length}
 </span>
 </button>
 ))}
 </div>

 {/* Actions */}
 <div className="flex items-center gap-2">
 <div className="relative">
 <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
 <input
 type="text"
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 placeholder="Search code, package, batch..."
 className="h-9 w-64 rounded-lg border border-border bg-muted pl-9 pr-4 text-xs text-foreground placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
 />
 </div>
 <button
 onClick={exportCsv}
 className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-accent"
 title="Export filtered rows to CSV"
 >
 <Download className="h-3.5 w-3.5" /> CSV
 </button>
 <Link
 href="/finance/vouchers/print"
 className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-accent"
 >
 <Printer className="h-3.5 w-3.5" /> Print Sheet
 </Link>
 </div>
 </div>

 {/* Table */}
 <div className="mt-4 overflow-x-auto">
 <table className="w-full text-left text-xs">
 <thead>
 <tr className="border-b border-border text-[11px] font-mono tracking-wider text-muted-foreground uppercase">
 <th className="px-3 py-3">CODE</th>
 <th className="px-3 py-3">PACKAGE</th>
 <th className="px-3 py-3">STATUS</th>
 <th className="px-3 py-3">EXPIRES</th>
 <th className="px-3 py-3">CREATED</th>
 <th className="px-3 py-3">REDEEMED</th>
 <th className="px-3 py-3 text-right" />
 </tr>
 </thead>
 <tbody className="divide-y divide-zinc-800/50">
 {filtered.length === 0 ? (
 <tr>
 <td colSpan={7} className="py-12 text-center font-mono text-muted-foreground">
 No vouchers match this filter.
 </td>
 </tr>
 ) : (
 filtered.map((v) => (
 <tr key={v.id} className="transition hover:bg-zinc-800/30">
 <td className="px-3 py-3.5 font-mono font-semibold tracking-wider text-amber-400">
 {v.code}
 </td>
 <td className="px-3 py-3.5 font-sans">
 <div className="font-semibold text-foreground">
 {v.packageName || "—"}
 </div>
 <div className="font-mono text-[11px] text-muted-foreground">
 {v.planSpeed || "—"}
 {v.durationText ? ` · ${v.durationText}` : ""}
 {v.planPrice ? ` · ${v.planPrice}` : ""}
 </div>
 </td>
 <td className="px-3 py-3.5">
 <div className="flex items-center gap-1.5">
 <span
 className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${STATUS_PILLS[v.status]}`}
 >
 {v.status}
 </span>
 {v.isFallback && (
 <span className="inline-flex items-center rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-medium uppercase text-muted-foreground">
 demo
 </span>
 )}
 </div>
 </td>
 <td className="px-3 py-3.5 font-mono text-muted-foreground">
 {v.expiresText || "—"}
 </td>
 <td className="px-3 py-3.5 font-mono text-muted-foreground">
 {v.createdAt || "—"}
 </td>
 <td className="px-3 py-3.5 font-mono text-muted-foreground">
 {v.redeemedByPhone ?? v.redeemedByMac ?? "—"}
 </td>
 <td className="px-3 py-3.5 text-right">
 <button className="text-muted-foreground hover:text-accent-foreground">
 <MoreHorizontal className="h-4 w-4" />
 </button>
 </td>
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>
 </div>
 );
}