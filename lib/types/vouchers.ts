export type VoucherStatus = "UNUSED" | "USED" | "EXPIRED" | "VOID";

export interface VoucherItem {
  id: string;
  code: string;
  batchNumber?: string;
  packageId?: string;
  packageName?: string;
  planSpeed?: string;
  planPrice?: string;
  durationText?: string;
  status: VoucherStatus;
  expiresText?: string;
  createdAt?: string;
  redeemedAt?: string;
  redeemedByPhone?: string;
  redeemedByMac?: string;
  isFallback?: boolean;
}

export interface VoucherKpis {
  totalGenerated: number;
  usedCount: number;
  unusedCount: number;
  batchesCount: number;
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
  codeLength?: number;
  prefix?: string;
  source: VoucherSource;
  /** Router the stock is minted for (required for SALE); vouchers work only there. */
  deviceId?: number;
  /** SALE only — how the batch was paid for: Dr 1130 (cash) or Dr 1120 (bank) / Cr 4100. */
  channel?: "CASH" | "BANK_TRANSFER";
}