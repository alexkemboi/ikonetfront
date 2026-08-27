import React from "react";
import type { PaymentLedgerKpis } from "@/lib/types/payments";

interface Props {
  kpis: PaymentLedgerKpis;
}

export function PaymentsKpiCards({ kpis }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <div className="rounded-2xl border border-[#262626] bg-[#161616] p-5 shadow-lg">
        <span className="text-[11px] font-mono tracking-wider text-zinc-400 uppercase">
          TODAY
        </span>
        <div className="mt-2 text-3xl font-mono font-bold text-white">
          Ksh {kpis.todayAmount.toLocaleString()}
        </div>
        <p className="mt-1 text-xs text-zinc-400">confirmed only</p>
      </div>

      <div className="rounded-2xl border border-[#262626] bg-[#161616] p-5 shadow-lg">
        <span className="text-[11px] font-mono tracking-wider text-zinc-400 uppercase">
          THIS WEEK
        </span>
        <div className="mt-2 text-3xl font-mono font-bold text-white">
          Ksh {kpis.thisWeekAmount.toLocaleString()}
        </div>
        <p className="mt-1 text-xs text-zinc-400">since Monday</p>
      </div>

      <div className="rounded-2xl border border-[#262626] bg-[#161616] p-5 shadow-lg">
        <span className="text-[11px] font-mono tracking-wider text-zinc-400 uppercase">
          MOBILE MONEY
        </span>
        <div className="mt-2 text-3xl font-mono font-bold text-amber-500">
          Ksh {kpis.mobileMoneyMonthAmount.toLocaleString()}
        </div>
        <p className="mt-1 text-xs text-zinc-400">this month</p>
      </div>

      <div className="rounded-2xl border border-[#262626] bg-[#161616] p-5 shadow-lg">
        <span className="text-[11px] font-mono tracking-wider text-zinc-400 uppercase">
          VOUCHER
        </span>
        <div className="mt-2 text-3xl font-mono font-bold text-white">
          Ksh {kpis.voucherMonthAmount.toLocaleString()}
        </div>
        <p className="mt-1 text-xs text-zinc-400">this month</p>
      </div>
    </div>
  );
}
