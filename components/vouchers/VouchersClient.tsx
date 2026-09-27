"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, RotateCcw } from "lucide-react";
import { VoucherKpiCards } from "./VoucherKpiCards";
import { VoucherDataTable } from "./VoucherDataTable";
import { GenerateVouchersModal } from "./GenerateVouchersModal";
import { VoucherBatchLedger } from "./VoucherBatchLedger";
import { CompensatePaymentModal } from "./CompensatePaymentModal";
import { VoucherItem, VoucherKpis } from "@/lib/types/vouchers";
import type { VoucherBatchItem, VoucherBatchKpis } from "@/lib/types/payments";

interface Props {
  initialKpis: VoucherKpis;
  initialVouchers: VoucherItem[];
  batchKpis?: VoucherBatchKpis;
  batches?: VoucherBatchItem[];
  packageOptions?: { value: string; label: string }[];
  routerOptions?: { value: string; label: string }[];
}

const EMPTY_BATCH_KPIS: VoucherBatchKpis = {
  activeCount: 0,
  activeValue: 0,
  totalValue: 0,
};

export function VouchersClient({
  initialKpis,
  initialVouchers,
  batchKpis = EMPTY_BATCH_KPIS,
  batches = [],
  packageOptions = [],
  routerOptions = [],
}: Props) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCompensateOpen, setIsCompensateOpen] = useState(false);

  return (
  <div className="min-h-screen p-4 sm:p-6">
  <div className="mx-auto max-w-7xl space-y-6">
  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
  <div>
  <span className="text-[11px] font-sans tabular-nums tracking-widest text-amber-500 uppercase">
  Finance · Prepaid
  </span>
  <h1 className="mt-1 text-2xl font-normal tracking-normal text-foreground">
  Vouchers &amp; Prepaid Codes
  </h1>
  <p className="text-sm text-muted-foreground">
  Mint, export and print hotspot vouchers.
  </p>
  </div>
  <div className="flex flex-wrap gap-2">
  <button
  onClick={() => setIsCompensateOpen(true)}
  className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-xs font-semibold text-foreground hover:bg-accent"
  >
  <RotateCcw className="h-4 w-4" /> Compensate Payment
  </button>
  <button
  onClick={() => setIsModalOpen(true)}
  className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-2.5 text-xs font-semibold text-black hover:bg-amber-400"
  >
  <Plus className="h-4 w-4" /> Generate Vouchers
  </button>
  </div>
  </div>

  <VoucherKpiCards kpis={initialKpis} />
  <VoucherDataTable vouchers={initialVouchers} />

  <VoucherBatchLedger
  kpis={batchKpis}
  batches={batches}
  packageOptions={packageOptions}
  routerOptions={routerOptions}
  />
  </div>

  <CompensatePaymentModal
  isOpen={isCompensateOpen}
  onClose={() => {
  setIsCompensateOpen(false);
  router.refresh();
  }}
  />

  <GenerateVouchersModal
  isOpen={isModalOpen}
  routerOptions={routerOptions}
  onClose={() => {
  setIsModalOpen(false);
  router.refresh();
  }}
  />
  </div>
  );
}