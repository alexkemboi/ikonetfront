import React from "react";
import type { Metadata } from "next";
import { getInvoicesLedgerData } from "@/actions/payments";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Invoice Ledger | IBS Platform",
  description: "Subscriber invoice lifecycle and receivables",
};

export default async function InvoicesLedgerPage() {
  const { kpis, invoices } = await getInvoicesLedgerData();

  return (
    <div className="min-h-screen bg-[#0d0d0d] p-4 text-zinc-100 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <span className="text-[11px] font-mono tracking-wider text-zinc-500 uppercase">
              BILLING — INVOICES
            </span>
            <h1 className="text-3xl font-serif font-semibold text-white">Invoice ledger.</h1>
            <p className="mt-1 text-xs text-zinc-400">
              {kpis.allInvoicesCount} paid · {kpis.pendingCount} pending · Ksh{" "}
              {kpis.pendingAmount} outstanding.
            </p>
          </div>

          <button className="rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-semibold text-black hover:bg-amber-400 transition shadow-lg shadow-amber-500/20">
            + Create invoice
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-2xl border border-[#262626] bg-[#161616] p-5 shadow-lg">
            <span className="text-[11px] font-mono tracking-wider text-zinc-400 uppercase">
              ALL INVOICES
            </span>
            <div className="mt-2 text-3xl font-mono font-bold text-white">
              {kpis.allInvoicesCount}
            </div>
            <p className="mt-1 text-xs text-zinc-400">total raised</p>
          </div>

          <div className="rounded-2xl border border-[#262626] bg-[#161616] p-5 shadow-lg">
            <span className="text-[11px] font-mono tracking-wider text-zinc-400 uppercase">
              PENDING
            </span>
            <div className="mt-2 text-3xl font-mono font-bold text-white">
              Ksh {kpis.pendingAmount}
            </div>
            <p className="mt-1 text-xs text-zinc-400">{kpis.pendingCount} unpaid</p>
          </div>

          <div className="rounded-2xl border border-[#262626] bg-[#161616] p-5 shadow-lg">
            <span className="text-[11px] font-mono tracking-wider text-zinc-400 uppercase">
              OVERDUE
            </span>
            <div className="mt-2 text-3xl font-mono font-bold text-rose-400">
              {kpis.overdueCount}
            </div>
            <p className="mt-1 text-xs text-zinc-400">past due date</p>
          </div>

          <div className="rounded-2xl border border-[#262626] bg-[#161616] p-5 shadow-lg">
            <span className="text-[11px] font-mono tracking-wider text-zinc-400 uppercase">
              COLLECTED
            </span>
            <div className="mt-2 text-3xl font-mono font-bold text-emerald-400">
              Ksh {kpis.collectedAmount}
            </div>
            <p className="mt-1 text-xs text-zinc-400">0 settled</p>
          </div>
        </div>

        {invoices.length === 0 ? (
          <div className="rounded-2xl border border-[#262626] bg-[#161616] p-12 text-center shadow-xl">
            <p className="text-sm text-zinc-400">
              No invoices yet.{" "}
              <span className="text-amber-500 font-semibold cursor-pointer">
                Create the first one.
              </span>
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-[#262626] bg-[#161616] shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono min-w-[720px]">
                <thead>
                  <tr className="border-b border-[#262626] text-[11px] tracking-wider text-zinc-400 uppercase">
                    <th className="py-3 px-3">NUMBER</th>
                    <th className="py-3 px-3">CUSTOMER</th>
                    <th className="py-3 px-3">AMOUNT</th>
                    <th className="py-3 px-3">OUTSTANDING</th>
                    <th className="py-3 px-3">STATUS</th>
                    <th className="py-3 px-3">DUE DATE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-zinc-800/30 transition">
                      <td className="py-3.5 px-3 font-semibold text-white">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3.5 px-3 text-zinc-300">
                        <div className="text-white font-sans">{inv.customerName}</div>
                        <div className="text-[11px] text-zinc-500">{inv.customerPhone}</div>
                      </td>
                      <td className="py-3.5 px-3 font-bold text-white">
                        Ksh {inv.amount.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-3 text-amber-400">
                        Ksh {inv.outstanding.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            inv.status === "PAID"
                              ? "bg-emerald-500/15 text-emerald-400"
                              : inv.status === "OVERDUE"
                                ? "bg-rose-500/15 text-rose-400"
                                : "bg-amber-500/15 text-amber-400"
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-zinc-400">{inv.dueDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
