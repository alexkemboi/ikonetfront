"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import type { PaymentLedgerKpis, PaymentLedgerItem } from "@/lib/types/payments";
import { PaymentsKpiCards } from "@/components/payments/PaymentsKpiCards";
import { PaymentsDataTable } from "@/components/payments/PaymentsDataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  kpis: PaymentLedgerKpis;
  payments: PaymentLedgerItem[];
  source: "GL" | "GATEWAY";
}

export function PaymentsLedgerView({ kpis, payments, source }: Props) {
  const router = useRouter();
  const [recordOpen, setRecordOpen] = useState(false);

  return (
    <div className="min-h-screen p-4 text-foreground sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <span className="text-[11px] font-mono tracking-wider text-muted-foreground uppercase">
              BILLING — LEDGER
            </span>
            <h1 className="text-3xl font-serif font-semibold text-foreground">
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
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">
                Postings against Account 1110 (M-Pesa Clearing), confirmed from the
                general ledger. {kpis.totalRecordedCount.toLocaleString()} recorded.
              </p>
            )}
          </div>

          <button
            onClick={() => setRecordOpen(true)}
            className="rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-semibold text-black hover:bg-amber-400 transition shadow-lg shadow-amber-500/20"
          >
            + Record payment
          </button>
        </div>

        <PaymentsKpiCards kpis={kpis} />
        <PaymentsDataTable payments={payments} />
      </div>

      {/* Manual payment capture is NOT part of the current API contract — the
          dialog never fabricates a ledger entry; it explains the gap and routes
          operators to expenses instead. */}
      <Dialog open={recordOpen} onOpenChange={setRecordOpen}>
        <DialogContent className="bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-foreground">Record a payment</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Manual M-Pesa capture is not available yet.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 font-mono text-xs text-muted-foreground">
            <p>
              Paying in a mobile-money movement by hand needs a backend
              payment-recording endpoint, which is not part of the current API
              contract. This ledger is populated automatically from M-Pesa
              confirmation callbacks — every confirmed payment lands here as an
              Account 1110 posting.
            </p>
            <p>
              To capture an outgoing cash movement instead, record an operating
              expense on the Expenses page.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRecordOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setRecordOpen(false);
                router.push("/finance/expenses");
              }}
              className="bg-amber-500 text-black hover:bg-amber-400"
            >
              Record operating expense instead
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}