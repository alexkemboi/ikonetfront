import React from "react";
import { ChevronRight } from "lucide-react";
import { RenewalDueItem } from "@/lib/types/dashboard";

interface Props {
 items: RenewalDueItem[];
}

/** Today in Nairobi as YYYY-MM-DD, the calendar the backend's expiry dates use. */
function nairobiToday(now: Date): string {
 return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Nairobi" }).format(now);
}

/** "Ends tonight", "Ends tomorrow", "Ends in 2 days"; the subscription runs to the end of its expiry date. */
export function renewalCountdown(expiryDate: string | null | undefined, now: Date = new Date()): string {
 if (!expiryDate || !/^\d{4}-\d{2}-\d{2}$/.test(expiryDate)) return "";
 const days = Math.round(
  (Date.parse(`${expiryDate}T00:00:00Z`) - Date.parse(`${nairobiToday(now)}T00:00:00Z`)) / 86_400_000
 );
 if (days < 0) return "Ended";
 if (days === 0) return "Ends tonight";
 if (days === 1) return "Ends tomorrow";
 return `Ends in ${days} days`;
}

export function RenewalsDueCard({ items }: Props) {
 const now = new Date();
 return (
 <div className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-xl">
 <div className="flex items-baseline justify-between border-b border-border pb-4">
 <div>
 <h2 className="text-lg font-normal text-foreground">Renewals due</h2>
 <p className="text-xs text-muted-foreground">Next 48 hours · {items.length} subscribers</p>
 </div>
 </div>

 <div className="mt-4 divide-y divide-border">
 {items.map((item, index) => {
  // every field may be missing: one bad row must not take the whole overview down
  const name = item.accountUsername?.trim() || "Unknown account";
  const detail = [item.phoneMasked, item.amount != null ? `Ksh ${item.amount.toLocaleString()}` : null]
   .filter(Boolean)
   .join(" · ");
  return (
 <div
 key={`${item.accountUsername ?? "account"}-${item.expiryDate ?? ""}-${index}`}
 className="flex items-center justify-between py-3 hover:bg-zinc-800/30 transition rounded-lg px-2"
 >
 {/* Avatar & Subscriber Info */}
 <div className="flex items-center gap-3">
 <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary font-sans tabular-nums text-xs font-semibold text-rose-300">
 {name.charAt(0).toUpperCase()}
 </div>
 <div>
 <div className="font-sans tabular-nums text-sm font-semibold text-foreground">
 {name}
 </div>
 <div className="font-sans tabular-nums text-xs text-muted-foreground">
 {detail}
 </div>
 </div>
 </div>

 {/* Countdown Badge */}
 <div className="flex items-center gap-2">
 <span className="font-sans tabular-nums text-xs font-medium text-rose-400">
 {renewalCountdown(item.expiryDate, now)}
 </span>
 <ChevronRight className="h-4 w-4 text-muted-foreground" />
 </div>
 </div>
  );
 })}
 </div>
 </div>
 );
}
