"use server";

import { getPermissionForRoute } from "@/lib/data/nav";
import { apiFetch } from "@/lib/apiClient";
import type {
  GenerateVouchersRequest,
  VoucherItem,
  VoucherKpis,
} from "@/lib/types/vouchers";

const ZERO_KPIS: VoucherKpis = {
  totalGenerated: 0,
  usedCount: 0,
  unusedCount: 0,
  batchesCount: 0,
  redemptionRatePercent: 0,
};

export type VouchersData = {
  available: boolean;
  message: string;
  kpis: VoucherKpis;
  vouchers: VoucherItem[];
};

/**
 * Voucher LIST — pending backend route.
 *
 * The live spec exposes only `POST /hotspot/vouchers/create`; there is no
 * `GET /hotspot/vouchers` (nor any other list/statistics endpoint verified in
 * api-docs.json). The historical `FALLBACK_VOUCHERS` demo data was being
 * fabricated on every failure — that silent fake-success is removed here.
 * The UI renders a gated empty state instead; minting stays live.
 */
export async function getVouchersData(): Promise<VouchersData> {
  return {
    available: false,
    message:
      "Voucher list pending backend route (only POST /hotspot/vouchers/create exists)",
    kpis: ZERO_KPIS,
    vouchers: [],
  };
}

export async function generateVouchers(
  request: GenerateVouchersRequest
): Promise<{ success: boolean; message: string; count?: number }> {
  const pagePerms = await getPermissionForRoute("/finance/vouchers");
  if (!pagePerms.canCreate) {
    return { success: false, message: "Not authorized to mint vouchers." };
  }

  const quantity = Math.floor(Number(request.quantity));
  const codeLength = Math.floor(Number(request.codeLength ?? 6));

  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10000) {
    return {
      success: false,
      message: "Quantity must be a whole number between 1 and 10,000.",
    };
  }
  if (!Number.isInteger(codeLength) || codeLength < 4 || codeLength > 12) {
    return {
      success: false,
      message: "Code length must be between 4 and 12 characters.",
    };
  }

  // Backend ManualVoucherRequest accepts `{ packageId, count, stationId?, companyId? }`.
  // Runtime probe: reached the controller tokenless (business 404 on a fake
  // package) — public enforcement, matching the live spec's missing `security`
  // block. stationId is optional (backend derives it from JWT/device).
  const res = await apiFetch<Record<string, unknown>[]>("/hotspot/vouchers/create", {
    method: "POST",
    auth: "public",
    body: {
      packageId: Number(request.packageId),
      count: quantity,
    },
  });

  if (!res.success) {
    console.warn(`[Vouchers] mint failed (${res.status}): ${res.message}`);
    return { success: false, message: res.message, count: quantity };
  }

  return {
    success: true,
    message: `Successfully minted ${quantity} vouchers.`,
    count: quantity,
  };
}