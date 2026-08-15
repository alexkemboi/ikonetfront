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

export interface GenerateVouchersRequest {
  packageId: number;
  quantity: number;
  codeLength?: number;
  prefix?: string;
  expiresAt?: string;
}