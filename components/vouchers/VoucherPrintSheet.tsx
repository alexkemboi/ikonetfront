"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VoucherItem } from "@/lib/types/vouchers";

interface Props {
 vouchers: VoucherItem[];
 networkName?: string;
 error?: string;
 requestId?: string;
}

export function VoucherPrintSheet({
 vouchers,
 networkName = "ADRINOLD NETWORK",
 error,
 requestId,
}: Props) {
 const router = useRouter();

 if (vouchers.length === 0) {
 return (
 <div className="flex min-h-screen items-center justify-center bg-white p-8">
 <div className="text-center">
 {error ? <><h1 className="text-lg font-normal text-zinc-900">Voucher data unavailable</h1><p role="alert" className="mt-1 text-sm text-muted-foreground">{error}{requestId ? ` · Ref: ${requestId}` : ""}</p></> : <>
 <h1 className="text-lg font-normal text-zinc-900">
 No un-issued vouchers to print
 </h1>
 <p className="mt-1 text-sm text-muted-foreground">
 Mint vouchers first, then revisit this print sheet.
 </p>
 </>}
 <Button
 className="mt-4"
 onClick={() => router.push("/finance/vouchers")}
 >
 <ArrowLeft className="h-3.5 w-3.5" /> Back to Vouchers
 </Button>
 </div>
 </div>
 );
 }

 return (
 <div className="min-h-screen bg-white text-black">
 {/* Toolbar — hidden when printing */}
 <div className="sticky top-0 z-10 border-b border-zinc-200 bg-white/95 backdrop-blur print:hidden">
 <div className="mx-auto flex max-w-[210mm] items-center justify-between gap-4 px-4 py-3">
 <Button
 variant="secondary"
 size="sm"
 onClick={() => router.push("/finance/vouchers")}
 >
 <ArrowLeft className="h-3.5 w-3.5" /> Back
 </Button>
 <div className="text-center">
 <p className="text-sm font-bold uppercase tracking-widest">
 Voucher Print Sheet
 </p>
 <p className="text-[11px] text-muted-foreground">
 {vouchers.length} un-issued vouchers
 </p>
 </div>
 <Button
 size="sm"
 onClick={() => window.print()}
 >
 <Printer className="h-3.5 w-3.5" /> Print
 </Button>
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
 <p className="mt-1 text-[10px] leading-tight text-muted-foreground">
 {v.packageName || "—"}
 </p>
 </div>
 <div>
 <p className="font-sans tabular-nums text-2xl font-bold tracking-[0.18em] text-black">
 {v.code}
 </p>
 <p className="mt-2 text-[10px] leading-tight text-muted-foreground">
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