import { getPermissionForRoute } from "@/lib/data/nav";
import { redirect } from "next/navigation";
import React from "react";
import type { Metadata } from "next";
import { getInvoicesLedgerData } from "@/actions/payments";
import { Button } from "@/components/ui/button";
import { InvoicesTable } from "./_components/InvoicesTable";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
 title: "Invoice Ledger | IBS Platform",
 description: "Subscriber invoice lifecycle and receivables",
};

export default async function InvoicesLedgerPage() {
  const pagePerms = await getPermissionForRoute("/finance/billing/invoices");
  if (!pagePerms.canView) redirect("/dashboard");

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

 <Button>+ Create invoice</Button>
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
 <InvoicesTable invoices={invoices} />
 )}
 </div>
 </div>
 );
}
