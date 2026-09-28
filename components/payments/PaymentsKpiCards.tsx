import React from "react";
import type { PaymentLedgerKpis } from "@/lib/types/payments";

interface Props {
 kpis: PaymentLedgerKpis;
}

export function PaymentsKpiCards({ kpis }: Props) {
 return (
 <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
 <div className="rounded-2xl border border-border bg-card p-5 shadow-lg">
 <span className="text-[11px] font-sans tabular-nums tracking-wider text-muted-foreground uppercase">
 TODAY
 </span>
 <div className="mt-2 text-3xl font-sans tabular-nums font-bold text-foreground">
 Ksh {kpis.todayAmount.toLocaleString()}
 </div>
 <p className="mt-1 text-xs text-muted-foreground">confirmed only</p>
 </div>

 <div className="rounded-2xl border border-border bg-card p-5 shadow-lg">
 <span className="text-[11px] font-sans tabular-nums tracking-wider text-muted-foreground uppercase">
 THIS WEEK
 </span>
 <div className="mt-2 text-3xl font-sans tabular-nums font-bold text-foreground">
 Ksh {kpis.thisWeekAmount.toLocaleString()}
 </div>
 <p className="mt-1 text-xs text-muted-foreground">since Monday</p>
 </div>

 <div className="rounded-2xl border border-border bg-card p-5 shadow-lg">
 <span className="text-[11px] font-sans tabular-nums tracking-wider text-muted-foreground uppercase">
 MOBILE MONEY
 </span>
 <div className="mt-2 text-3xl font-sans tabular-nums font-bold text-amber-500">
 Ksh {kpis.mobileMoneyMonthAmount.toLocaleString()}
 </div>
 <p className="mt-1 text-xs text-muted-foreground">this month</p>
 </div>

 {kpis.notConnectedCount !== undefined ? (
 <div className="rounded-2xl border border-border bg-card p-5 shadow-lg">
 <span className="text-[11px] font-sans tabular-nums tracking-wider text-muted-foreground uppercase">
 PAID, NOT CONNECTED
 </span>
 <div
 className={`mt-2 text-3xl font-sans tabular-nums font-bold ${
 kpis.notConnectedCount > 0 ? "text-rose-400" : "text-foreground"
 }`}
 >
 {kpis.notConnectedCount.toLocaleString()}
 </div>
 <p className="mt-1 text-xs text-muted-foreground">
 {kpis.notConnectedCount > 0
 ? "customers to compensate"
 : "every payer got connected"}
 {kpis.compensatedCount ? ` · ${kpis.compensatedCount} compensated` : ""}
 </p>
 </div>
 ) : (
 <div className="rounded-2xl border border-border bg-card p-5 shadow-lg">
 <span className="text-[11px] font-sans tabular-nums tracking-wider text-muted-foreground uppercase">
 VOUCHER
 </span>
 <div className="mt-2 text-3xl font-sans tabular-nums font-bold text-foreground">
 Ksh {kpis.voucherMonthAmount.toLocaleString()}
 </div>
 <p className="mt-1 text-xs text-muted-foreground">this month</p>
 </div>
 )}
 </div>
 );
}
