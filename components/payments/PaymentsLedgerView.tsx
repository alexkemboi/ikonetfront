import React from "react";
import type { PaymentLedgerKpis, PaymentLedgerItem } from "@/lib/types/payments";
import { PaymentsKpiCards } from "@/components/payments/PaymentsKpiCards";
import { PaymentsDataTable } from "@/components/payments/PaymentsDataTable";

interface Props {
  kpis: PaymentLedgerKpis;
  payments: PaymentLedgerItem[];
}

export function PaymentsLedgerView({ kpis, payments }: Props) {
  return (
    <div className="min-h-screen bg-[#0d0d0d] p-4 text-zinc-100 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <span className="text-[11px] font-mono tracking-wider text-zinc-500 uppercase">
              BILLING — LEDGER
            </span>
            <h1 className="text-3xl font-serif font-semibold text-white">Payments ledger.</h1>
            <p className="mt-1 text-xs text-zinc-400">
              Every transaction on the network, confirmed and pending.{" "}
              {kpis.totalRecordedCount.toLocaleString()} recorded.
            </p>
          </div>

          <button className="rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-semibold text-black hover:bg-amber-400 transition shadow-lg shadow-amber-500/20">
            + Record payment
          </button>
        </div>

        <PaymentsKpiCards kpis={kpis} />
        <PaymentsDataTable payments={payments} />
      </div>
    </div>
  );
}
