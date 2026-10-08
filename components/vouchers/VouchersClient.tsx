"use client";

import { useState } from "react";
import { useCompanyScope } from "@/providers/CompanyScopeProvider";
import { useRouter } from "next/navigation";
import { Plus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VoucherKpiCards } from "./VoucherKpiCards";
import { VoucherDataTable } from "./VoucherDataTable";
import { GenerateVouchersModal } from "./GenerateVouchersModal";
import { VoucherBatchLedger } from "./VoucherBatchLedger";
import { CompensatePaymentModal } from "./CompensatePaymentModal";
import { VoucherItem, VoucherKpis, VoucherStatus } from "@/lib/types/vouchers";
import type { VoucherBatchItem, VoucherBatchKpis } from "@/lib/types/payments";

interface Props {
  initialKpis: VoucherKpis | null;
  initialVouchers: VoucherItem[];
  kpiError?: string;
  batchKpis?: VoucherBatchKpis;
  batches?: VoucherBatchItem[];
  batchPage: { totalElements: number; totalPages: number; number: number; size: number };
  packageOptions?: { value: string; label: string; unitPrice?: string }[];
  routerOptions?: { value: string; label: string }[];
  voucherPage: { totalElements: number; totalPages: number; number: number; size: number };
  voucherState: "ALL" | VoucherStatus;
  search: string;
  source: "ALL" | "MINTED" | "PURCHASED";
}

const EMPTY_BATCH_KPIS: VoucherBatchKpis = {
  activeCount: 0,
  activeValue: "0",
  totalValue: "0",
  vouchers: 0,
};

export function VouchersClient({
  initialKpis,
  initialVouchers,
  kpiError,
  batchKpis = EMPTY_BATCH_KPIS,
  batches = [],
  batchPage,
  packageOptions = [],
  routerOptions = [],
  voucherPage,
  voucherState,
  search,
  source,
}: Props) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { requireCompany } = useCompanyScope();
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
  <Button
  variant="secondary"
  onClick={() => setIsCompensateOpen(true)}
  >
  <RotateCcw className="h-4 w-4" /> Compensate Payment
  </Button>
  <Button
  onClick={() => requireCompany(() => setIsModalOpen(true))}
  >
  <Plus className="h-4 w-4" /> Generate Vouchers
  </Button>
  </div>
  </div>

  <VoucherKpiCards kpis={initialKpis} error={kpiError} />
  <VoucherDataTable
  vouchers={initialVouchers}
  page={voucherPage.number}
  totalPages={voucherPage.totalPages}
  totalElements={voucherPage.totalElements}
  size={voucherPage.size}
  state={voucherState}
  search={search}
  source={source}
  />

  <VoucherBatchLedger
  kpis={batchKpis}
  batches={batches}
  page={batchPage}
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
