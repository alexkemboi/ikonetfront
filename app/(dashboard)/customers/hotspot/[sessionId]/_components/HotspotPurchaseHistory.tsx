"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { getHotspotPurchaseHistory, type HotspotPurchase } from "@/actions/subscriberTime";
import { cn } from "@/lib/utils";

const DATE = new Intl.DateTimeFormat("en-KE", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
const TH = "px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground";

/** Past purchases of a walk-in customer, found by phone number, newest first. */
export function HotspotPurchaseHistory({ phone, currentSessionId }: { phone: string; currentSessionId: number }) {
  const [rows, setRows] = useState<HotspotPurchase[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    getHotspotPurchaseHistory(phone).then((res) => {
      if (!live) return;
      if (res.success) setRows(res.data ?? []);
      else setError(res.message ?? "Could not load the history");
    });
    return () => {
      live = false;
    };
  }, [phone]);

  if (error) return <p role="alert" className="text-sm text-destructive">{error}</p>;
  if (!rows) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading purchases…
      </p>
    );
  }
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">No earlier purchases for this number.</p>;

  const total = rows.reduce((sum, r) => sum + (r.amountPaid ?? 0), 0);

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className={TH}>Bought</th>
              <th className={TH}>Package</th>
              <th className={TH}>Paid with</th>
              <th className={TH}>Status</th>
              <th className={cn(TH, "text-right")}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.sessionId} className={cn("border-b border-border last:border-0", row.sessionId === currentSessionId && "bg-accent/40")}>
                <td className="px-4 py-3 tabular-nums text-foreground">{row.createdAt ? DATE.format(new Date(row.createdAt)) : "—"}</td>
                <td className="px-4 py-3 text-foreground">
                  {row.packageName || "Package"}
                  {row.sessionId === currentSessionId && <span className="ml-2 text-xs text-muted-foreground">(this one)</span>}
                </td>
                <td className="px-4 py-3 tabular-nums text-muted-foreground">
                  {row.mpesaReference ? `M-Pesa ${row.mpesaReference}` : row.voucherCode ? `Voucher ${row.voucherCode}` : "—"}
                </td>
                <td className="px-4 py-3 capitalize text-muted-foreground">{(row.sessionStatus ?? "—").toLowerCase()}</td>
                <td className="px-4 py-3 text-right tabular-nums text-foreground">
                  {row.amountPaid != null ? `KES ${row.amountPaid.toLocaleString()}` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
        {rows.length} latest purchase{rows.length === 1 ? "" : "s"} · KES {total.toLocaleString()} in all
      </div>
    </div>
  );
}
