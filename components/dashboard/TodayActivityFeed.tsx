import React from "react";

interface Props {
 eventsCount: number;
 payments: {
 id: string;
 amount: number;
 account: string;
 timeAgo: string;
 }[];
}

export function TodayActivityFeed({ eventsCount, payments }: Props) {
 return (
 <div className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-xl">
 <div className="flex items-center justify-between border-b border-border pb-4">
 <div>
 <h2 className="text-lg font-normal text-foreground">Today</h2>
 <p className="text-xs text-muted-foreground">Payments &amp; signups · this shift</p>
 </div>
 <div className="flex items-center gap-2">
 <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-500/15 px-2 py-0.5 text-[10px] font-sans tabular-nums font-bold tracking-wider text-amber-400 uppercase">
 <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
 LIVE
 </span>
 <span className="rounded-full bg-secondary px-2.5 py-0.5 font-sans tabular-nums text-xs font-semibold text-muted-foreground">
 {eventsCount} events
 </span>
 </div>
 </div>

 <div className="mt-4 divide-y divide-border">
 {payments.map((payment) => {
 const accent = payment.amount >= 15 ? "bg-emerald-500" : "bg-amber-500";
 return (
 <div
 key={payment.id}
 className="flex items-center justify-between gap-3 py-3 rounded-lg px-2 hover:bg-zinc-800/30 transition"
 >
 <div className="flex items-center gap-3">
 <span className={`h-8 w-1 rounded-full ${accent}`} />
 <div>
 <div className="font-sans tabular-nums text-sm font-semibold text-foreground">
 Ksh {payment.amount}
 </div>
 <div className="font-sans tabular-nums text-xs text-amber-400">
 {payment.account}
 </div>
 </div>
 </div>
 <span className="font-sans tabular-nums text-[11px] text-muted-foreground">
 {payment.timeAgo}
 </span>
 </div>
 );
 })}
 </div>
 </div>
 );
}