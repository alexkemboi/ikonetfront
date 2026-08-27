import React from "react";
import type { PaymentLedgerKpis, PaymentLedgerItem } from "@/lib/types/payments";
import { PaymentsKpiCards } from "@/components/payments/PaymentsKpiCards";
import { PaymentsDataTable } from "@/components/payments/PaymentsDataTable";

interface Props {
 kpis: PaymentLedgerKpis;
 payments: PaymentLedgerItem[];
}

export function PaymentsLedgerView({ kpis, payments }: Props) {
 return (
 <div className="min-h-screen p-4 text-foreground sm:p-6 lg:p-8">
 <div className="mx-auto max-w-7xl space-y-6">
 <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
 <div>
 <span className="text-[11px] font-mono tracking-wider text-muted-foreground uppercase">
 BILLING — LEDGER
 </span>
 <h1 className="text-3xl font-serif font-semibold text-foreground">Payments ledger.</h1>
 <p className="mt-1 text-xs text-muted-foreground">
 Every transaction on the network, confirmed and pending.{" "}
 {kpis.totalRecordedCount.toLocaleString()} recorded.
 </p>
 </div>

 <button className="rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-semibold text-black hover:bg-amber-400 transition shadow-lg shadow-amber-500/20">
 + Record payment
 </button>
 </div>

 <PaymentsKpiCards kpis={kpis} />
 <PaymentsDataTable payments={payments} />
 </div>
 </div>
 );
}
