import React from "react";
import type { Metadata } from "next";
import { getInvoicesLedgerData } from "@/actions/payments";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
 title: "Invoice Ledger | IBS Platform",
 description: "Subscriber invoice lifecycle and receivables",
};

export default async function InvoicesLedgerPage() {
 const { kpis, invoices } = await getInvoicesLedgerData();

 return (
 <div className="min-h-screen p-4 text-foreground sm:p-6 lg:p-8">
 <div className="mx-auto max-w-7xl space-y-6">
 <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
 <div>
 <span className="text-[11px] font-sans tabular-nums tracking-wider text-muted-foreground uppercase">
 BILLING — INVOICES
 </span>
 <h1 className="text-3xl font-sans font-normal text-foreground">Invoice ledger.</h1>
 <p className="mt-1 text-xs text-muted-foreground">
 {kpis.allInvoicesCount} paid · {kpis.pendingCount} pending · Ksh{" "}
 {kpis.pendingAmount} outstanding.
 </p>
 </div>

 <button className="rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-semibold text-black hover:bg-amber-400 transition shadow-lg shadow-amber-500/20">
 + Create invoice
 </button>
 </div>

 <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
 <div className="rounded-2xl border border-border bg-card p-5 shadow-lg">
 <span className="text-[11px] font-sans tabular-nums tracking-wider text-muted-foreground uppercase">
 ALL INVOICES
 </span>
 <div className="mt-2 text-3xl font-sans tabular-nums font-bold text-foreground">
 {kpis.allInvoicesCount}
 </div>
 <p className="mt-1 text-xs text-muted-foreground">total raised</p>
 </div>

 <div className="rounded-2xl border border-border bg-card p-5 shadow-lg">
 <span className="text-[11px] font-sans tabular-nums tracking-wider text-muted-foreground uppercase">
 PENDING
 </span>
 <div className="mt-2 text-3xl font-sans tabular-nums font-bold text-foreground">
 Ksh {kpis.pendingAmount}
 </div>
 <p className="mt-1 text-xs text-muted-foreground">{kpis.pendingCount} unpaid</p>
 </div>

 <div className="rounded-2xl border border-border bg-card p-5 shadow-lg">
 <span className="text-[11px] font-sans tabular-nums tracking-wider text-muted-foreground uppercase">
 OVERDUE
 </span>
 <div className="mt-2 text-3xl font-sans tabular-nums font-bold text-rose-400">
 {kpis.overdueCount}
 </div>
 <p className="mt-1 text-xs text-muted-foreground">past due date</p>
 </div>

 <div className="rounded-2xl border border-border bg-card p-5 shadow-lg">
 <span className="text-[11px] font-sans tabular-nums tracking-wider text-muted-foreground uppercase">
 COLLECTED
 </span>
 <div className="mt-2 text-3xl font-sans tabular-nums font-bold text-emerald-400">
 Ksh {kpis.collectedAmount}
 </div>
 <p className="mt-1 text-xs text-muted-foreground">0 settled</p>
 </div>
 </div>

 {invoices.length === 0 ? (
 <div className="rounded-2xl border border-border bg-card p-12 text-center shadow-xl">
 <p className="text-sm text-muted-foreground">
 No invoices yet.{" "}
 <span className="text-amber-500 font-semibold cursor-pointer">
 Create the first one.
 </span>
 </p>
 </div>
 ) : (
 <div className="rounded-2xl border border-border bg-card shadow-xl">
 <div className="overflow-x-auto">
 <table className="w-full text-left text-xs font-sans tabular-nums min-w-[720px]">
 <thead>
 <tr className="border-b border-border text-[11px] tracking-wider text-muted-foreground uppercase">
 <th className="py-3 px-3">NUMBER</th>
 <th className="py-3 px-3">CUSTOMER</th>
 <th className="py-3 px-3">AMOUNT</th>
 <th className="py-3 px-3">OUTSTANDING</th>
 <th className="py-3 px-3">STATUS</th>
 <th className="py-3 px-3">DUE DATE</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-zinc-800/50">
 {invoices.map((inv) => (
 <tr key={inv.id} className="hover:bg-zinc-800/30 transition">
 <td className="py-3.5 px-3 font-semibold text-foreground">
 {inv.invoiceNumber}
 </td>
 <td className="py-3.5 px-3 text-muted-foreground">
 <div className="text-foreground font-sans">{inv.customerName}</div>
 <div className="text-[11px] text-muted-foreground">{inv.customerPhone}</div>
 </td>
 <td className="py-3.5 px-3 font-bold text-foreground">
 Ksh {inv.amount.toLocaleString()}
 </td>
 <td className="py-3.5 px-3 text-amber-400">
 Ksh {inv.outstanding.toLocaleString()}
 </td>
 <td className="py-3.5 px-3">
 <span
 className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
 inv.status === "PAID"
 ? "bg-emerald-500/15 text-emerald-400"
 : inv.status === "OVERDUE"
 ? "bg-rose-500/15 text-rose-400"
 : "bg-amber-500/15 text-amber-400"
 }`}
 >
 {inv.status}
 </span>
 </td>
 <td className="py-3.5 px-3 text-muted-foreground">{inv.dueDate}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 )}
 </div>
 </div>
 );
}
