"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { BASE_URL } from "@/lib/constants";
import { getPermissionForRoute } from "@/lib/data/nav";
import type {
  GenerateVouchersRequest,
  VoucherItem,
  VoucherKpis,
  VoucherStatus,
} from "@/lib/types/vouchers";

const EMPTY_KPIS: VoucherKpis = {
  totalGenerated: 0,
  usedCount: 0,
  unusedCount: 0,
  batchesCount: 0,
  redemptionRatePercent: 0,
};

async function getAuthHeaders(): Promise<HeadersInit> {
  const session = await auth();
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (session?.user?.apiToken) {
    (headers as Record<string, string>)["Authorization"] =
      `Bearer ${session.user.apiToken}`;
  }
  return headers;
}

function normalizeStatus(status: unknown): VoucherStatus {
  const s = String(status ?? "").toUpperCase();
  return s === "USED" || s === "EXPIRED" || s === "VOID" ? s : "UNUSED";
}

function str(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  return String(value);
}

/** Maps a backend HotspotSessionResponse (GET /hotspot/vouchers). */
function mapRowToVoucher(row: unknown): VoucherItem {
  const r = (row ?? {}) as Record<string, unknown>;
  const pkg = (r.package ?? {}) as Record<string, unknown>;
  const packageName = str(r.packageName) ?? str(pkg.packageName) ?? "—";
  const speedDown = Number(r.speedDownload ?? pkg.speedDownload ?? 0);
  const speedUp = Number(r.speedUpload ?? pkg.speedUpload ?? 0);
  const planSpeed =
    str(r.packageSpeedLabel) ??
    str(r.planSpeed) ??
    (speedDown > 0 || speedUp > 0
      ? `${speedDown}M/${speedUp}M`
      : str(pkg.rateLimit) ?? "—");
  const validityValue = str(r.validityValue) ?? str(pkg.validityValue);
  const validityType = str(r.validityType) ?? str(pkg.validityType);
  const durationText =
    str(r.packageValidityLabel) ??
    str(r.durationText) ??
    (validityValue && validityType ? `${validityValue} ${validityType}` : "—");
  const price = Number(r.price ?? pkg.price ?? r.planPrice);

  return {
    id: str(r.sessionId) ?? str(r.id) ?? str(r.voucherId) ?? "—",
    code: str(r.code) ?? str(r.voucherCode) ?? "—",
    batchNumber: str(r.voucherBatchId) ?? str(r.batchNumber),
    packageId: str(r.packageId) ?? str(pkg.id),
    packageName,
    planSpeed,
    planPrice: str(r.packageCurrencyAmount) ??
      (Number.isFinite(price) && price > 0 ? `Ksh ${price}` : undefined),
    durationText,
    // voucherState is derived server-side from session status + redemption.
    status: normalizeStatus(r.voucherState ?? r.status),
    expiresText: str(r.expiresAt) ?? str(r.expiryDate) ?? "—",
    createdAt: str(r.createdAt),
    redeemedAt: str(r.redeemedAt),
    redeemedByPhone: str(r.redeemedByPhone),
    redeemedByMac: str(r.redeemedByMac) ?? (r.redeemedAt ? str(r.macAddress) : undefined),
  };
}

function deriveKpis(vouchers: VoucherItem[]): VoucherKpis {
  const total = vouchers.length;
  const used = vouchers.filter((v) => v.status === "USED").length;
  const unused = vouchers.filter((v) => v.status === "UNUSED").length;
  const batchesCount = new Set(
    vouchers.map((v) => v.batchNumber).filter(Boolean)
  ).size;
  return {
    totalGenerated: total,
    usedCount: used,
    unusedCount: unused,
    batchesCount,
    redemptionRatePercent: total === 0 ? 0 : Math.round((used / total) * 100),
  };
}

export async function getVouchersData(): Promise<{
  kpis: VoucherKpis;
  vouchers: VoucherItem[];
}> {
  const session = await auth();
  if (!session?.user?.apiToken) {
    return { kpis: EMPTY_KPIS, vouchers: [] };
  }
  try {
    // Issued vouchers only (minted / migration / compensation — not raw M-Pesa
    // purchase sessions), newest first, so today's batch is at the top.
    const res = await fetch(`${BASE_URL}hotspot/vouchers?issuedOnly=true&size=200&sort=createdAt,desc`, {
      headers: await getAuthHeaders(),
      cache: "no-store",
    });
    const payload: unknown = await res.json().catch(() => null);
    const envelope = (payload ?? null) as {
      data?: unknown;
      content?: unknown;
    } | null;
    const raw = envelope?.data ?? payload;
    const list = Array.isArray(raw)
      ? raw
      : Array.isArray((raw as { content?: unknown } | null)?.content)
        ? (raw as { content: unknown[] }).content
        : null;

    if (!Array.isArray(list) || list.length === 0) {
      return { kpis: EMPTY_KPIS, vouchers: [] };
    }
    const vouchers = list.map(mapRowToVoucher);
    return { kpis: deriveKpis(vouchers), vouchers };
  } catch {
    return { kpis: EMPTY_KPIS, vouchers: [] };
  }
}

export async function generateVouchers(
  request: GenerateVouchersRequest
): Promise<{ success: boolean; message: string; count?: number; batchNumber?: string }> {
  const pagePerms = await getPermissionForRoute("/finance/vouchers");
  if (!pagePerms.canCreate) {
    return { success: false, message: "Not authorized to mint vouchers." };
  }

  const quantity = Math.floor(Number(request.quantity));
  const codeLength = Math.floor(Number(request.codeLength ?? 8));
  const isSale = request.source === "SALE";

  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 500) {
    return {
      success: false,
      message: "Quantity must be a whole number between 1 and 500 per batch.",
    };
  }
  if (!Number.isInteger(codeLength) || codeLength < 4 || codeLength > 12) {
    return {
      success: false,
      message: "Code length must be between 4 and 12 characters.",
    };
  }
  if (isSale && !request.deviceId) {
    return { success: false, message: "Select the router these vouchers are sold for." };
  }
  if (isSale && request.channel !== "CASH" && request.channel !== "BANK_TRANSFER") {
    return { success: false, message: "Select how the batch was paid for (cash or bank transfer)." };
  }

  try {
    const session = await auth();
    const stationId = session?.user?.stationId
      ? String(session.user.stationId)
      : undefined;
    const prefix = request.prefix?.trim() || undefined;
    const deviceId = request.deviceId ? Number(request.deviceId) : undefined;

    // SALE: /finance/voucher-batches creates the sessions AND posts the sale
    // (Dr 1130/1120, Cr 4100) in one transaction.
    // MIGRATION: /hotspot/vouchers/create — no revenue (the customer paid their
    // previous ISP), still tenant-scoped and optionally locked to a router.
    const res = isSale
      ? await fetch(`${BASE_URL}finance/voucher-batches`, {
          method: "POST",
          headers: await getAuthHeaders(),
          body: JSON.stringify({
            packageId: Number(request.packageId),
            quantity,
            codeLength,
            codePrefix: prefix,
            channel: request.channel,
            stationId,
            deviceId,
          }),
        })
      : await fetch(`${BASE_URL}hotspot/vouchers/create`, {
          method: "POST",
          headers: await getAuthHeaders(),
          body: JSON.stringify({
            packageId: Number(request.packageId),
            count: quantity,
            codeLength,
            prefix,
            voucherType: "MIGRATION",
            stationId,
            deviceId,
          }),
        });

    const body: { message?: string; data?: { batchNumber?: string } } | null = await res
      .json()
      .catch(() => null);
    if (!res.ok) {
      const message = `HTTP ${res.status}: ${body?.message || "Failed to mint vouchers"}`;
      console.warn(message);
      return { success: false, message, count: quantity };
    }

    revalidatePath("/finance/vouchers");
    const batchNumber = isSale ? body?.data?.batchNumber : undefined;
    return {
      success: true,
      message: `Minted ${quantity} ${isSale ? "" : "migration "}vouchers${batchNumber ? ` in batch ${batchNumber}` : ""}.`,
      count: quantity,
      batchNumber,
    };
  } catch (error: unknown) {
    const detail = error instanceof Error ? error.message : "fetch failed";
    console.warn("Voucher mint network error:", detail);
    return {
      success: false,
      message: "Failed to reach voucher minting service. Please retry.",
    };
  }
}

/**
 * Re-instate a settled M-Pesa hotspot purchase that never connected.
 * POST /hotspot/vouchers/compensate — no GL (the sale was posted at settlement);
 * the original session is revoked; idempotent per payment.
 */
export async function compensateHotspotPayment(
  mpesaReceipt: string,
  reason?: string
): Promise<{ success: boolean; message: string; voucherCode?: string; packageName?: string }> {
  const pagePerms = await getPermissionForRoute("/finance/vouchers");
  if (!pagePerms.canCreate) {
    return { success: false, message: "Not authorized to issue compensation vouchers." };
  }
  const receipt = mpesaReceipt.trim().toUpperCase();
  if (!/^[A-Z0-9]{8,12}$/.test(receipt)) {
    return { success: false, message: "Enter the M-Pesa receipt code from the customer's SMS (e.g. UIOAC7SJ5A)." };
  }
  try {
    const res = await fetch(`${BASE_URL}hotspot/vouchers/compensate`, {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify({ mpesaReceipt: receipt, reason: reason?.trim() || undefined }),
    });
    const body: { message?: string; data?: { voucherCode?: string; packageName?: string } } | null = await res
      .json()
      .catch(() => null);
    if (!res.ok || !body?.data?.voucherCode) {
      return { success: false, message: body?.message || `Failed to issue voucher (HTTP ${res.status}).` };
    }
    revalidatePath("/finance/vouchers");
    return {
      success: true,
      message: body.message || "Compensation voucher issued",
      voucherCode: body.data.voucherCode,
      packageName: body.data.packageName,
    };
  } catch (error: unknown) {
    console.warn("Compensation voucher network error:", error instanceof Error ? error.message : error);
    return { success: false, message: "Failed to reach the voucher service. Please retry." };
  }
}
