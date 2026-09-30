"use server";

import { apiFetch } from "@/lib/apiClient";
import { getPermissionForRoute } from "@/lib/data/nav";
import type {
  GenerateVouchersRequest,
  VoucherItem,
  VoucherKpis,
  VoucherStatus,
} from "@/lib/types/vouchers";

function normalizeStatus(status: unknown): VoucherStatus {
  const s = String(status ?? "").toUpperCase();
  return s === "USED" || s === "EXPIRED" || s === "VOID" || s === "PENDING" || s === "FAILED" ? s : "UNUSED";
}

function str(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  return String(value);
}

function mapRowToVoucher(row: unknown): VoucherItem {
  const r = (row ?? {}) as Record<string, unknown>;
  const pkg = (r.package ?? {}) as Record<string, unknown>;
  const packageName = str(r.packageName) ?? str(pkg.packageName) ?? "—";
  const speedDown = Number(r.speedDownload ?? pkg.speedDownload ?? 0);
  const speedUp = Number(r.speedUpload ?? pkg.speedUpload ?? 0);
  const planSpeed =
    str(r.packageSpeedLabel) ?? str(r.planSpeed) ??
    (speedDown > 0 || speedUp > 0
      ? `${speedDown}M/${speedUp}M`
      : str(pkg.rateLimit) ?? "—");
  const validityValue = str(r.validityValue) ?? str(pkg.validityValue);
  const validityType = str(r.validityType) ?? str(pkg.validityType);
  const durationText =
    str(r.durationText) ??
    (validityValue && validityType ? `${validityValue} ${validityType}` : "—");

  return {
    id: str(r.sessionId) ?? str(r.id) ?? str(r.voucherId) ?? "—",
    code: str(r.voucherCode) ?? str(r.code) ?? "—",
    batchNumber: str(r.voucherBatchId),
    voucherBatchId: str(r.voucherBatchId),
    voucherType: str(r.voucherType),
    source: str(r.source) === "PURCHASED" ? "PURCHASED" : "MINTED",
    packageId: str(r.packageId) ?? str(pkg.id),
    packageName: str(r.packageName) ?? packageName,
    planSpeed,
    packageSpeed: str(r.packageSpeedLabel) ?? planSpeed,
    planPrice: str(r.packageCurrencyAmount) ?? str(r.price) ?? str(pkg.price) ?? str(r.planPrice),
    durationText,
    packageValidityLabel: str(r.packageValidityLabel) ?? durationText,
    status: normalizeStatus(r.voucherState ?? r.status),
    expiresText: str(r.expiresAt) ?? str(r.expiryDate) ?? "Starts on first use",
    expiryStartsOnFirstUse: r.expiresAt == null && r.startedAt == null,
    packageCurrencyAmount: str(r.packageCurrencyAmount),
    amountPaid: str(r.amountPaid) ?? null,
    sessionStatus: str(r.sessionStatus),
    minutesRemaining: r.minutesRemaining == null ? null : Number(r.minutesRemaining),
    createdAt: str(r.createdAt),
    redeemedAt: str(r.redeemedAt),
    redeemedByPhone: str(r.clientPhone) ?? str(r.redeemedByPhone),
    redeemedByMac: str(r.macAddress) ?? str(r.redeemedByMac),
    mpesaReceipt: str(r.mpesaReference),
  };
}

export async function getVouchersData(options: { page?: number; size?: number; search?: string; voucherState?: VoucherStatus | "ALL"; source?: "ALL" | "MINTED" | "PURCHASED"; from?: string; to?: string; stationId?: string; companyId?: string } = {}): Promise<{
  kpis: VoucherKpis | null;
  vouchers: VoucherItem[];
  page: { totalElements: number; totalPages: number; number: number; size: number };
  requestId?: string;
  error?: string;
}> {
  const listRequestId = crypto.randomUUID();
  const statsRequestId = crypto.randomUUID();
  try {
    const query = new URLSearchParams({ page: String(options.page ?? 0), size: String(options.size ?? 20), issuedOnly: "false" });
    const statsQuery = new URLSearchParams();
    if (options.search) query.set("search", options.search);
    if (options.voucherState && options.voucherState !== "ALL") {
      query.set("voucherState", options.voucherState);
    }
    if (options.source && options.source !== "ALL") {
      query.set("source", options.source);
      statsQuery.set("source", options.source);
    }
    if (options.from) { query.set("from", options.from); statsQuery.set("from", options.from); }
    if (options.to) { query.set("to", options.to); statsQuery.set("to", options.to); }
    if (options.stationId) { query.set("stationId", options.stationId); statsQuery.set("stationId", options.stationId); }
    if (options.companyId) { query.set("companyId", options.companyId); statsQuery.set("companyId", options.companyId); }
    const [res, stats] = await Promise.all([
      apiFetch<{ content: unknown[]; totalElements: number; totalPages: number; number: number; size: number }>(`/hotspot/vouchers?${query}`, {
      auth: "required",
      tags: ["vouchers"],
      cache: "no-store",
      headers: { "X-Request-Id": listRequestId },
      }),
      apiFetch<VoucherKpis>(`/hotspot/vouchers/statistics${statsQuery.size ? `?${statsQuery}` : ""}`, { auth: "required", cache: "no-store", headers: { "X-Request-Id": statsRequestId } }),
    ]);
    if (!res.success || !res.data || !stats.success || !stats.data) return { kpis: null, vouchers: [], page: { totalElements: 0, totalPages: 0, number: 0, size: options.size ?? 20 }, requestId: res.requestId ?? stats.requestId, error: res.message ?? stats.message };
    return { kpis: stats.data, vouchers: res.data.content.map(mapRowToVoucher), page: res.data, requestId: res.requestId };
  } catch (error) {
    console.warn("Failed to fetch vouchers:", error);
    return { kpis: null, vouchers: [], page: { totalElements: 0, totalPages: 0, number: 0, size: options.size ?? 20 }, requestId: listRequestId, error: "DATA_SOURCE_UNAVAILABLE" };
  }
}

export async function generateVouchers(
  request: GenerateVouchersRequest
): Promise<{
  success: boolean;
  message: string;
  count?: number;
  code?: string;
  serverUnitPrice?: string;
  requestId?: string;
}> {
  const pagePerms = await getPermissionForRoute("/finance/vouchers");
  if (!pagePerms.canCreate) {
    return { success: false, message: "Not authorized to mint vouchers." };
  }

  const quantity = Math.floor(Number(request.quantity));
  const codeLength = Math.floor(Number(request.codeLength ?? 6));

  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 500) {
    return {
      success: false,
      message: "Quantity must be a whole number between 1 and 500.",
    };
  }
  if (!Number.isInteger(codeLength) || codeLength < 4 || codeLength > 12) {
    return {
      success: false,
      message: "Code length must be between 4 and 12 characters.",
    };
  }

  const requestId = crypto.randomUUID();
  try {
    // Backend ManualVoucherRequest: POST /hotspot/vouchers/create
    // accepts { packageId, count, stationId, companyId }. stationId/companyId
    // are optional (backend derives them from JWT/device); pass stationId when known.
    const res = await apiFetch<unknown>("/hotspot/vouchers/create", {
      method: "POST",
      auth: "required",
      headers: { "Idempotency-Key": request.idempotencyKey, "X-Request-Id": requestId },
      body: {
        packageId: Number(request.packageId),
        count: quantity,
        voucherType: request.voucherType,
        stationId: request.stationId,
        companyId: request.companyId,
        expectedUnitPrice: request.expectedUnitPrice,
        deviceId: request.deviceId,
        prefix: request.prefix,
        codeLength,
      },
      cache: "no-store",
    });

    if (!res.success) {
      const errorData = (res.data ?? {}) as { code?: string; serverUnitPrice?: string };
      return {
        success: false,
        message: res.message,
        count: quantity,
        code: errorData.code ?? res.message,
        serverUnitPrice: errorData.serverUnitPrice,
        requestId: res.requestId,
      };
    }

    return {
      success: true,
      message: `Successfully minted ${quantity} vouchers.`,
      count: quantity,
      requestId: res.requestId,
    };
  } catch (error: unknown) {
    const detail = error instanceof Error ? error.message : "fetch failed";
    console.warn("Voucher mint network error:", detail);
    return {
      success: false,
      message: "Failed to reach voucher minting service. Please retry.",
      requestId,
    };
  }
}