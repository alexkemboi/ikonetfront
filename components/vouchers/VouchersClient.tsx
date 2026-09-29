"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { VoucherKpiCards } from "./VoucherKpiCards";
import { VoucherDataTable } from "./VoucherDataTable";
import { GenerateVouchersModal } from "./GenerateVouchersModal";
import { VoucherBatchLedger } from "./VoucherBatchLedger";
import type { VoucherItem, VoucherKpis, VoucherStatus } from "@/lib/types/vouchers";
import type { VoucherBatchItem, VoucherBatchKpis } from "@/lib/types/payments";

interface Props {
  initialKpis: VoucherKpis | null;
  initialVouchers: VoucherItem[];
  batchKpis: VoucherBatchKpis | null;
  batches: VoucherBatchItem[];
  batchPage: { totalElements: number; totalPages: number; number: number; size: number };
  packageOptions: { value: string; label: string; unitPrice: string }[];
  page: { number: number; size: number; totalElements: number; totalPages: number };
  voucherState: VoucherStatus | "ALL";
  search: string;
  source: "ALL" | "MINTED" | "PURCHASED";
  voucherError?: string;
  requestId?: string;
  batchError?: string;
  batchRequestId?: string;
}

export function VouchersClient({ initialKpis, initialVouchers, batchKpis, batches, batchPage, packageOptions, page, voucherState, search, source, voucherError, requestId, batchError, batchRequestId }: Props) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  return <div className="min-h-screen p-4 sm:p-6"><div className="mx-auto max-w-7xl space-y-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><span className="text-[11px] font-sans tabular-nums tracking-widest text-amber-600 uppercase">Finance · Prepaid</span><h1 className="mt-1 text-2xl font-normal">Vouchers &amp; Prepaid Codes</h1><p className="text-sm text-muted-foreground">Manage codes, inspect paid batches, and mint free demo or migration stock.</p></div><button disabled={packageOptions.length === 0} onClick={() => setIsModalOpen(true)} className="inline-flex items-center gap-2 rounded-md bg-amber-500 px-4 py-2.5 text-sm font-semibold text-black disabled:opacity-50"><Plus className="size-4"/>Mint free stock</button></div>
    {voucherError ? <div role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm">Voucher list/statistics unavailable: {voucherError}{requestId ? ` · Ref: ${requestId}` : ""}</div> : initialKpis ? <VoucherKpiCards kpis={initialKpis} /> : null}
    {!voucherError && <VoucherDataTable vouchers={initialVouchers} page={page.number} totalPages={page.totalPages} totalElements={page.totalElements} size={page.size} state={voucherState} search={search} source={source}/>}
    {batchError ? <div role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm">Paid voucher batch ledger unavailable: {batchError}{batchRequestId ? ` · Ref: ${batchRequestId}` : ""}</div> : batchKpis ? <VoucherBatchLedger kpis={batchKpis} batches={batches} page={batchPage} packageOptions={packageOptions}/> : null}
  </div><GenerateVouchersModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); router.refresh(); }}/></div>;
}
