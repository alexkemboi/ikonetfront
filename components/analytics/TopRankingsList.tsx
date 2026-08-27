import React from "react";
import type { TopPackageItem, TopCustomerItem } from "@/lib/types/analytics";

interface Props {
 packages: TopPackageItem[];
 customers: TopCustomerItem[];
}

export function TopRankingsList({ packages, customers }: Props) {
 return (
 <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
 <div className="rounded-2xl border border-border bg-card p-6 shadow-xl">
 <div className="flex items-center justify-between border-b border-border pb-4">
 <h2 className="text-base font-semibold text-foreground">Top packages · Monthly</h2>
 <button className="rounded-lg bg-secondary/80 px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-zinc-700">
 View top 50
 </button>
 </div>

 <div className="mt-6 space-y-4 font-mono text-xs">
 {packages.map((pkg) => (
 <div key={pkg.id}>
 <div className="flex items-center justify-between mb-1.5">
 <span className="text-foreground font-semibold truncate max-w-[200px]">
 {pkg.name}
 </span>
 <span className="text-amber-400 font-bold">
 Ksh {pkg.revenue.toLocaleString()}{" "}
 <span className="text-muted-foreground font-normal font-sans">
 · {pkg.subscriberCount} subs
 </span>
 </span>
 </div>
 <div className="h-1.5 w-full rounded-full bg-secondary">
 <div
 className="h-full rounded-full bg-amber-500"
 style={{ width: `${Math.max(0, Math.min(100, pkg.sharePercent))}%` }}
 />
 </div>
 </div>
 ))}
 </div>
 </div>

 <div className="rounded-2xl border border-border bg-card p-6 shadow-xl">
 <div className="flex items-center justify-between border-b border-border pb-4">
 <div>
 <h2 className="text-base font-semibold text-foreground">Top customers · Monthly</h2>
 <p className="text-[11px] text-muted-foreground">
 Highest-paying subscribers — your value rank list
 </p>
 </div>
 <button className="rounded-lg bg-secondary/80 px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-zinc-700">
 View top 50
 </button>
 </div>

 <div className="mt-6 space-y-4 font-mono text-xs">
 {customers.map((c) => (
 <div key={c.subscriberCode}>
 <div className="flex items-center justify-between mb-1.5">
 <span className="text-foreground font-semibold">
 #{c.rank} {c.subscriberCode}
 </span>
 <span className="text-amber-400 font-bold">
 Ksh {c.totalSpent.toLocaleString()}{" "}
 <span className="text-muted-foreground font-normal font-sans">
 · {c.paymentsCount} payments
 </span>
 </span>
 </div>
 <div className="h-1.5 w-full rounded-full bg-secondary">
 <div
 className="h-full rounded-full bg-amber-500"
 style={{ width: `${Math.max(0, Math.min(100, c.sharePercent))}%` }}
 />
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 );
}
