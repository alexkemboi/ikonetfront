"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Printer } from "lucide-react";
import { VoucherItem } from "@/lib/types/vouchers";

interface Props {
  vouchers: VoucherItem[];
  networkName?: string;
}

export function VoucherPrintSheet({
  vouchers,
  networkName = "ADRINOLD NETWORK",
}: Props) {
  const router = useRouter();

  if (vouchers.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white p-8">
        <div className="text-center">
          <h1 className="text-lg font-bold text-zinc-900">
            No un-issued vouchers to print
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Mint vouchers first, then revisit this print sheet.
          </p>
          <button
            onClick={() => router.push("/finance/vouchers")}
            className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-700"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Vouchers
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Toolbar — hidden when printing */}
      <div className="sticky top-0 z-10 border-b border-zinc-200 bg-white/95 backdrop-blur print:hidden">
        <div className="mx-auto flex max-w-[210mm] items-center justify-between gap-4 px-4 py-3">
          <button
            onClick={() => router.push("/finance/vouchers")}
            className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </button>
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-widest">
              Voucher Print Sheet
            </p>
            <p className="text-[11px] text-zinc-500">
              {vouchers.length} un-issued vouchers
            </p>
          </div>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-700"
          >
            <Printer className="h-3.5 w-3.5" /> Print
          </button>
        </div>
      </div>

      {/* Cut grid */}
      <div className="mx-auto max-w-[210mm] p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:grid-cols-4 print:grid-cols-4 print:gap-0 print:p-0">
          {vouchers.map((v) => (
            <div
              key={v.id}
              className="flex flex-col justify-between overflow-hidden border-2 border-dashed border-zinc-400 p-4 print:min-h-[70mm] print:break-inside-avoid print:border-zinc-400"
            >
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em]">
                  {networkName}
                </p>
                <p className="mt-1 text-[10px] leading-tight text-zinc-600">
                  {v.packageName || "—"}
                </p>
              </div>
              <div>
                <p className="font-mono text-2xl font-bold tracking-[0.18em] text-black">
                  {v.code}
                </p>
                <p className="mt-2 text-[10px] leading-tight text-zinc-600">
                  {v.planSpeed || ""}
                  {v.durationText ? ` · ${v.durationText}` : ""}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}