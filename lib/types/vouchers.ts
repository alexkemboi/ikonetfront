export type VoucherStatus = "UNUSED" | "USED" | "EXPIRED" | "VOID" | "PENDING" | "FAILED";

export interface VoucherItem {
  id: string;
  code: string;
  batchNumber?: string;
  voucherBatchId?: string;
  voucherType?: string;
  source?: "MINTED" | "PURCHASED";
  packageId?: string;
  packageName?: string;
  packageSpeed?: string;
  packageValidityLabel?: string;
  planSpeed?: string;
  planPrice?: string;
  durationText?: string;
  status: VoucherStatus;
  expiresText?: string;
  expiryStartsOnFirstUse?: boolean;
  packageCurrencyAmount?: string;
  amountPaid?: string | null;
  sessionStatus?: string;
  minutesRemaining?: number | null;
  createdAt?: string;
  redeemedAt?: string;
  redeemedByPhone?: string;
  redeemedByMac?: string;
  mpesaReceipt?: string;
  isFallback?: boolean;
}

export interface VoucherKpis {
  totalVoucherCodes: number;
  usedCodes: number;
  unusedCodes: number;
  expiredUnusedCodes: number;
  batches: number;
  redemptionRatePercent: number;
}

export interface GenerateVouchersRequest {
  packageId: number;
  quantity: number;
  voucherType: "DEMO" | "MIGRATION";
  codeLength?: number;
  prefix?: string;
  stationId?: string;
  companyId?: string;
  expectedUnitPrice: string;
  deviceId?: number;
  idempotencyKey: string;
}