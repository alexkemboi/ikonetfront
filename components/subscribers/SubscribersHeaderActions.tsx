"use client";

import { useState } from "react";
import Link from "next/link";
import { Download, HandCoins, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OutageCompensationModal } from "@/components/subscribers/OutageCompensationModal";
import type { SubscriberItem } from "@/lib/types/subscribers";

function exportCsv(subscribers: SubscriberItem[]) {
 const headers = [
 "Code",
 "Full Name",
 "Phone",
 "Email",
 "Type",
 "Plan",
 "Status",
 "MAC",
 "IP",
 "Expiry",
 ];
 const rows = subscribers.map((s) => [
 s.code,
 s.fullName,
 s.phone,
 s.email ?? "",
 s.type,
 s.planName,
 s.status,
 s.macAddress ?? "",
 s.ipAddress ?? "",
 s.expiryText,
 ]);
 const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
 const csv = [headers, ...rows]
 .map((row) => row.map((cell) => escape(String(cell))).join(","))
 .join("\n");

 const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
 const url = URL.createObjectURL(blob);
 const anchor = document.createElement("a");
 anchor.href = url;
 anchor.download = `subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
 document.body.appendChild(anchor);
 anchor.click();
 document.body.removeChild(anchor);
 URL.revokeObjectURL(url);
}

export function SubscribersHeaderActions({
 subscribers,
}: {
 subscribers: SubscriberItem[];
}) {
 const [compensateOpen, setCompensateOpen] = useState(false);

 return (
 <div className="flex flex-wrap items-center gap-2">
 <Link
 href="/customers/new"
 className="inline-flex h-9 items-center gap-2 rounded-md bg-zinc-100 px-4 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-200"
 >
 <Plus className="h-4 w-4" />
 New Customer
 </Link>
 <Button
 variant="outline"
 size="sm"
 onClick={() => exportCsv(subscribers)}
 className="gap-1.5 border-border bg-muted text-xs text-muted-foreground hover:text-accent-foreground"
 >
 <Download className="h-3.5 w-3.5" />
 Export CSV
 </Button>
 <Button
 variant="outline"
 size="sm"
 onClick={() => setCompensateOpen(true)}
 className="gap-1.5 border-amber-500/30 bg-amber-500/5 text-xs text-amber-300 hover:bg-amber-500/10 hover:text-amber-200"
 >
 <HandCoins className="h-3.5 w-3.5" />
 Compensate
 </Button>

 <OutageCompensationModal
 isOpen={compensateOpen}
 onClose={() => setCompensateOpen(false)}
 />
 </div>
 );
}