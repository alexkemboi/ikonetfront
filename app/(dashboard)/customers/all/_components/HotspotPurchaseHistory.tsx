"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { getHotspotPurchaseHistory, type HotspotPurchase } from "@/actions/subscriberTime";

const DATE = new Intl.DateTimeFormat("en-KE", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

/** Past purchases of a walk-in customer, found by phone number, newest first. */
export default function HotspotPurchaseHistory({ phone }: { phone: string }) {
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

  return (
    <section className="space-y-2 border-t border-border pt-4">
      <h3 className="text-sm font-medium">Purchase history</h3>
      {error && <p className="text-xs text-destructive">{error}</p>}
      {!rows && !error && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-label="Loading history" />}
      {rows && rows.length === 0 && <p className="text-xs text-muted-foreground">No earlier purchases for {phone}.</p>}
      {rows && rows.length > 0 && (
        <ul className="max-h-56 divide-y divide-border overflow-y-auto rounded-md border border-border text-xs">
          {rows.map((row) => (
            <li key={row.sessionId} className="flex items-start justify-between gap-3 px-3 py-2">
              <div className="min-w-0">
                <p className="font-medium text-foreground truncate">{row.packageName || "Package"}</p>
                <p className="text-muted-foreground">
                  {row.createdAt ? DATE.format(new Date(row.createdAt)) : "—"}
                  {row.mpesaReference ? ` · ${row.mpesaReference}` : row.voucherCode ? ` · voucher ${row.voucherCode}` : ""}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="tabular-nums text-foreground">{row.amountPaid != null ? `KES ${row.amountPaid}` : "—"}</p>
                <p className="text-muted-foreground capitalize">{(row.sessionStatus ?? "").toLowerCase()}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
