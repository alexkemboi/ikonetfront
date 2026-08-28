import React from "react";
import { ChevronRight } from "lucide-react";
import { RenewalDueItem } from "@/lib/types/dashboard";

interface Props {
 items: RenewalDueItem[];
}

export function RenewalsDueCard({ items }: Props) {
 return (
 <div className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-xl">
 <div className="flex items-baseline justify-between border-b border-border pb-4">
 <div>
 <h2 className="text-lg font-semibold text-foreground">Renewals due</h2>
 <p className="text-xs text-muted-foreground">Next 48 hours · {items.length} subscribers</p>
 </div>
 </div>

 <div className="mt-4 divide-y divide-border">
 {items.map((item) => (
 <div
 key={item.id}
 className="flex items-center justify-between py-3 hover:bg-zinc-800/30 transition rounded-lg px-2"
 >
 {/* Avatar & Subscriber Info */}
 <div className="flex items-center gap-3">
 <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary font-mono text-xs font-semibold text-rose-300">
 {item.subscriberCode.charAt(0)}
 </div>
 <div>
 <div className="font-mono text-sm font-semibold text-foreground">
 {item.subscriberCode}
 </div>
 <div className="font-mono text-xs text-muted-foreground">
 {item.phoneMasked}
 </div>
 </div>
 </div>

 {/* Countdown Badge */}
 <div className="flex items-center gap-2">
 <span className="font-mono text-xs font-medium text-rose-400">
 {item.formattedCountdown}
 </span>
 <ChevronRight className="h-4 w-4 text-muted-foreground" />
 </div>
 </div>
 ))}
 </div>
 </div>
 );
}