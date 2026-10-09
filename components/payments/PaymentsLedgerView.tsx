"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { PaymentLedgerKpis, PaymentLedgerItem } from "@/lib/types/payments";
import { PaymentsKpiCards } from "@/components/payments/PaymentsKpiCards";
import { PaymentsDataTable } from "@/components/payments/PaymentsDataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { recordManualPayment } from "@/actions/payments";
import { withStepUp } from "@/lib/stepUp";
import RowHighlightWatcher from "@/components/network/RowHighlightWatcher";
import { RefundsCard } from "@/components/payments/RefundsCard";
import type { RefundItem } from "@/lib/types/refund";

interface Props {
  kpis: PaymentLedgerKpis;
  payments: PaymentLedgerItem[];
  source: "GL" | "GATEWAY" | "RECEIVED";
  /** False for the customer care desk (staff): read-only view. */
  canRecordPayment?: boolean;
  canIssueVoucher?: boolean;
  /** Raise a refund against a payment. */
  canRefund?: boolean;
  /** Confirm a refund was paid back (posts it to the ledger). */
  canProcessRefund?: boolean;
  refunds?: RefundItem[];
}

export function PaymentsLedgerView({
  kpis,
  payments,
  source,
  canRecordPayment = true,
  canIssueVoucher = true,
  canRefund = false,
  canProcessRefund = false,
  refunds = [],
}: Props) {
  const router = useRouter();
  const [recordOpen, setRecordOpen] = useState(false);
  const [customerIdxno, setCustomerIdxno] = useState("");
  const [amount, setAmount] = useState("");
  const [channel, setChannel] = useState<"CASH" | "BANK_TRANSFER">("CASH");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleRecord() {
    const idx = Number(customerIdxno.trim());
    const amt = Number(amount);
    if (!Number.isInteger(idx) || idx <= 0) {
      toast.error("Enter a valid customer idxno.");
      return;
    }
    if (!Number.isFinite(amt) || amt <= 0) {
      toast.error("Enter a valid positive amount.");
      return;
    }
    setSaving(true);
    try {
      const res = await withStepUp(
        (token) => recordManualPayment({
          customerIdxno: idx,
          amount: Math.round(amt * 100) / 100,
          channel,
          notes: notes.trim() || undefined,
        }, token),
        "Recording a manual payment requires re-authentication."
      );
      if (res.success && res.data) {
        toast.success(`Payment ${res.data.referenceNumber} recorded (${channel}).`);
        setRecordOpen(false);
        setCustomerIdxno("");
        setAmount("");
        setNotes("");
        router.refresh();
      } else {
        toast.error(res.message);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen p-4 text-foreground sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <span className="text-[11px] font-sans tabular-nums tracking-wider text-muted-foreground uppercase">
              BILLING — LEDGER
            </span>
            <h1 className="text-3xl font-sans font-normal text-foreground">
              Payments ledger.
            </h1>
            {kpis.totalRecordedCount === 0 ? (
              <p className="mt-1 text-xs text-muted-foreground">
                No confirmed M-Pesa payments are posted to Account 1110 yet.
                Confirmed gateway payments will appear here automatically.
              </p>
            ) : source === "GATEWAY" && payments.length > 0 ? (
              <Badge variant="outline" className="mt-1.5 text-amber-600">
                Showing confirmed gateway payments — GL 1110 backfill pending
              </Badge>
            ) : source === "RECEIVED" ? (
              <p className="mt-1 text-xs text-muted-foreground">
                {kpis.totalRecordedCount.toLocaleString()} confirmed M-Pesa payments, each
                traced to the payer and whether they got connected.
                {kpis.notConnectedCount
                  ? ` ${kpis.notConnectedCount} paid but never connected — issue a voucher from the row.`
                  : ""}
              </p>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">
                Postings against Account 1110 (M-Pesa Clearing), confirmed from the
                general ledger. {kpis.totalRecordedCount.toLocaleString()} recorded.
              </p>
            )}
          </div>

          {canRecordPayment && (
          <button
            onClick={() => setRecordOpen(true)}
            className="rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-semibold text-black hover:bg-amber-400 transition shadow-lg shadow-amber-500/20"
          >
            + Record payment
          </button>
          )}
        </div>

        <PaymentsKpiCards kpis={kpis} />
        <PaymentsDataTable payments={payments} canIssueVoucher={canIssueVoucher} canRefund={canRefund} />
        <RefundsCard refunds={refunds} canProcess={canProcessRefund} />
      </div>
      <RowHighlightWatcher />

      {/* Manual cash/bank payment capture for PPPoE customers */}
      <Dialog open={recordOpen} onOpenChange={setRecordOpen}>
        <DialogContent className="bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-foreground">Record a payment</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Capture a cash or bank payment for a PPPoE customer. This posts a
              real ledger entry (Dr 1130 Till / 1120 Bank, Cr 4200 Revenue).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 font-sans tabular-nums text-xs">
            <div className="space-y-1.5">
              <label className="text-muted-foreground">Customer idxno</label>
              <Input
                type="number"
                value={customerIdxno}
                onChange={(e) => setCustomerIdxno(e.target.value)}
                placeholder="e.g. 42"
                className="border-border bg-muted text-foreground placeholder:text-zinc-600"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-muted-foreground">Amount (KES)</label>
              <Input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 1500"
                className="border-border bg-muted text-foreground placeholder:text-zinc-600"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-muted-foreground">Channel</label>
              <Select value={channel} onValueChange={(v) => setChannel(v as "CASH" | "BANK_TRANSFER")}>
                <SelectTrigger className="border-border bg-muted text-foreground">
                  <SelectValue placeholder="Channel" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border text-foreground">
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Bank transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-muted-foreground">Notes (optional)</label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. office walk-in"
                className="border-border bg-muted text-foreground placeholder:text-zinc-600"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRecordOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button
              onClick={handleRecord}
              disabled={saving}
              className="bg-amber-500 text-black hover:bg-amber-400"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Record payment"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}