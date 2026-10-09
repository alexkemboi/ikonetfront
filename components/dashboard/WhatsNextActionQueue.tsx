import React from "react";
import Link from "next/link";
import { RefreshCw, Zap, ArrowUpRight, ChevronRight, ReceiptText } from "lucide-react";
import { WhatsNextItem } from "@/lib/types/dashboard";

interface Props {
 items: WhatsNextItem[];
}

export function WhatsNextActionQueue({ items }: Props) {
 const urgentCount = items.filter((i) => i.isUrgent).length;

 return (
 <div className="rounded-2xl border border-border bg-card p-6 shadow-xl">
 <div className="flex items-center justify-between border-b border-border pb-4">
 <h2 className="text-lg font-normal text-foreground">What&apos;s next?</h2>
 {urgentCount > 0 && (
 <span className="rounded-full bg-rose-500/15 px-2.5 py-0.5 text-xs font-sans tabular-nums font-bold text-rose-400">
 {urgentCount} urgent
 </span>
 )}
 </div>

 <div className="mt-4 space-y-3">
 {items.length === 0 && (
 <p className="py-2 text-sm text-muted-foreground">Nothing needs your attention right now.</p>
 )}
 {items.map((item) => (
 <Link
 key={item.id}
 href={item.actionUrl}
 className="group flex items-center justify-between rounded-xl border border-border bg-muted p-4 transition hover:border-accent hover:bg-accent"
 >
 <div className="flex items-start gap-3">
 <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800/80 text-amber-400 group-hover:bg-amber-500/20">
 {item.type === "EXPIRY" && <RefreshCw className="h-4 w-4" />}
 {item.type === "SMS_CREDIT" && <Zap className="h-4 w-4 text-amber-400" />}
 {item.type === "UNRECONCILED_PAYMENT" && <ArrowUpRight className="h-4 w-4 text-emerald-400" />}
 {item.type === "SYSTEM_FEE" && <ReceiptText className="h-4 w-4" />}
 </div>

 <div>
 <div className="flex items-center gap-2">
 <span className="text-sm font-semibold text-foreground">{item.title}</span>
 {item.isUrgent && (
 <span className="rounded bg-rose-500/20 px-1.5 py-0.5 text-[10px] font-sans tabular-nums font-bold text-rose-400 uppercase">
 URGENT
 </span>
 )}
 </div>
 <p className="mt-0.5 text-xs text-muted-foreground">{item.description}</p>
 </div>
 </div>

 <ChevronRight className="h-5 w-5 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-white" />
 </Link>
 ))}
 </div>
 </div>
 );
}