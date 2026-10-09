"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { processRefund } from "@/actions/refunds";
import type { RefundItem } from "@/lib/types/refund";

const STATUS_CLASS: Record<string, string> = {
  PENDING: "bg-amber-500/15 text-amber-500",
  APPROVED: "bg-amber-500/15 text-amber-500",
  PROCESSED: "bg-emerald-500/15 text-emerald-500",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Waiting to be paid back",
  APPROVED: "Waiting to be paid back",
  PROCESSED: "Paid back",
};

const when = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";

/**
 * Refunds of the company. A refund waits here until someone confirms the customer
 * has been paid back; only then does it reduce income in the ledger.
 */
export function RefundsCard({ refunds, canProcess }: { refunds: RefundItem[]; canProcess: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  if (refunds.length === 0) return null;

  const confirmPaidBack = (refund: RefundItem) => {
    const ok = window.confirm(
      `Confirm that KES ${refund.amount} has been paid back to the customer? This reduces income in the ledger and cannot be undone.`
    );
    if (!ok) return;
    setBusyId(refund.id);
    startTransition(async () => {
      const res = await processRefund(refund.id);
      setBusyId(null);
      if (!res.success) {
        toast.error(res.message);
        return;
      }
      toast.success("Refund marked as paid back and posted to the ledger.");
      router.refresh();
    });
  };

  return (
    <section aria-label="Refunds" className="rounded-2xl border border-border bg-card p-5 shadow-lg">
      <h2 className="text-lg font-normal text-foreground">Refunds</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Raising a refund does not send money. Pay the customer back, then confirm it here: only then is income reduced.
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-muted-foreground">
            <tr>
              <th className="py-2 pr-4 font-medium">Raised</th>
              <th className="py-2 pr-4 font-medium">Service</th>
              <th className="py-2 pr-4 text-right font-medium">Amount</th>
              <th className="py-2 pr-4 font-medium">Reason</th>
              <th className="py-2 pr-4 font-medium">By</th>
              <th className="py-2 pr-4 font-medium">Status</th>
              {canProcess && <th className="py-2 text-right font-medium">Action</th>}
            </tr>
          </thead>
          <tbody>
            {refunds.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="py-2 pr-4">{when(r.createdAt)}</td>
                <td className="py-2 pr-4">{r.serviceType ?? "—"}</td>
                <td className="py-2 pr-4 text-right font-sans tabular-nums">KES {r.amount}</td>
                <td className="py-2 pr-4">{r.reason}</td>
                <td className="py-2 pr-4 text-muted-foreground">{r.requestedBy ?? "—"}</td>
                <td className="py-2 pr-4">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_CLASS[r.status] ?? ""}`}>
                    {STATUS_LABEL[r.status] ?? r.status}
                  </span>
                  {r.status === "PROCESSED" && (
                    <span className="ml-2 text-xs text-muted-foreground">{when(r.processedAt)}</span>
                  )}
                </td>
                {canProcess && (
                  <td className="py-2 text-right">
                    {r.status !== "PROCESSED" && (
                      <Button size="sm" variant="secondary" disabled={pending} onClick={() => confirmPaidBack(r)}>
                        {busyId === r.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Confirm paid back
                      </Button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
