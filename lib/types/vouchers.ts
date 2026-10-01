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

/**
 * SALE      — sold stock: POST /finance/voucher-batches, posts the sale to the GL.
 * MIGRATION — customers moved in from another ISP (no payment trail): no GL.
 */
export type VoucherSource = "SALE" | "MIGRATION";

export interface GenerateVouchersRequest {
  packageId: number;
  quantity: number;
  voucherType: "DEMO" | "MIGRATION";
  codeLength?: number;
  prefix?: string;
  source: VoucherSource;
  /** Router the stock is minted for (required for SALE); vouchers work only there. */
  deviceId?: number;
  /** SALE only — how the batch was paid for: Dr 1130 (cash) or Dr 1120 (bank) / Cr 4100. */
  channel?: "CASH" | "BANK_TRANSFER";
  /** SALE only — the price the operator saw; the backend rejects the batch if it has moved. */
  expectedUnitPrice?: string;
  /** Stable across retries so a repeated submit cannot mint a second batch. */
  idempotencyKey?: string;
}