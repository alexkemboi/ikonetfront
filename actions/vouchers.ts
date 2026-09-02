"use server";

import { auth } from "@/lib/auth";
import { BASE_URL } from "@/lib/constants";
import { getPermissionForRoute } from "@/lib/data/nav";
import type {
  GenerateVouchersRequest,
  VoucherItem,
  VoucherKpis,
  VoucherStatus,
} from "@/lib/types/vouchers";

const FALLBACK_KPIS: VoucherKpis = {
  totalGenerated: 5,
  usedCount: 2,
  unusedCount: 3,
  batchesCount: 3,
  redemptionRatePercent: 40,
};

const FALLBACK_VOUCHERS: VoucherItem[] = [
  {
    id: "v-1",
    code: "ADR4F2K7X9",
    batchNumber: "BN-2026-001",
    packageId: "3",
    packageName: "Monthly Flex 10M/10M",
    planSpeed: "10M/10M",
    planPrice: "Ksh 900",
    durationText: "30 Days",
    status: "UNUSED",
    expiresText: "2026-09-14",
    createdAt: "2026-08-15",
    isFallback: true,
  },
  {
    id: "v-2",
    code: "ADR8N2W5M3",
    batchNumber: "BN-2026-002",
    packageId: "2",
    packageName: "Weekly Flex 4M/4M",
    planSpeed: "4M/4M",
    planPrice: "Ksh 300",
    durationText: "7 Days",
    status: "UNUSED",
    expiresText: "2026-08-22",
    createdAt: "2026-08-15",
    isFallback: true,
  },
  {
    id: "v-3",
    code: "ADR5T9C7R2",
    batchNumber: "BN-2026-002",
    packageId: "2",
    packageName: "Weekly Flex 4M/4M",
    planSpeed: "4M/4M",
    planPrice: "Ksh 300",
    durationText: "7 Days",
    status: "UNUSED",
    expiresText: "2026-08-22",
    createdAt: "2026-08-15",
    isFallback: true,
  },
  {
    id: "v-4",
    code: "ADR6H3M8K4",
    batchNumber: "BN-2026-003",
    packageId: "1",
    packageName: "Daily Flex 1M/1M",
    planSpeed: "1M/1M",
    planPrice: "Ksh 50",
    durationText: "1 Day",
    status: "USED",
    expiresText: "2026-08-16",
    createdAt: "2026-08-14",
    redeemedAt: "2026-08-14",
    redeemedByPhone: "254712345678",
    isFallback: true,
  },
  {
    id: "v-5",
    code: "ADR9P2D6J5",
    batchNumber: "BN-2026-003",
    packageId: "1",
    packageName: "Daily Flex 1M/1M",
    planSpeed: "1M/1M",
    planPrice: "Ksh 50",
    durationText: "1 Day",
    status: "USED",
    expiresText: "2026-08-16",
    createdAt: "2026-08-14",
    redeemedAt: "2026-08-14",
    redeemedByPhone: "254798765432",
    isFallback: true,
  },
];

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

function mapRowToVoucher(row: unknown): VoucherItem {
  const r = (row ?? {}) as Record<string, unknown>;
  const pkg = (r.package ?? {}) as Record<string, unknown>;
  const packageName = str(r.packageName) ?? str(pkg.packageName) ?? "—";
  const speedDown = Number(r.speedDownload ?? pkg.speedDownload ?? 0);
  const speedUp = Number(r.speedUpload ?? pkg.speedUpload ?? 0);
  const planSpeed =
    str(r.planSpeed) ??
    (speedDown > 0 || speedUp > 0
      ? `${speedDown}M/${speedUp}M`
      : str(pkg.rateLimit) ?? "—");
  const validityValue = str(r.validityValue) ?? str(pkg.validityValue);
  const validityType = str(r.validityType) ?? str(pkg.validityType);
  const durationText =
    str(r.durationText) ??
    (validityValue && validityType ? `${validityValue} ${validityType}` : "—");
  const price = Number(r.price ?? pkg.price ?? r.planPrice);

  return {
    id: str(r.id) ?? str(r.voucherId) ?? "—",
    code: str(r.code) ?? str(r.voucherCode) ?? "—",
    batchNumber: str(r.batchNumber),
    packageId: str(r.packageId) ?? str(pkg.id),
    packageName,
    planSpeed,
    planPrice: Number.isFinite(price) && price > 0 ? `Ksh ${price}` : undefined,
    durationText,
    status: normalizeStatus(r.status),
    expiresText: str(r.expiresAt) ?? str(r.expiryDate) ?? "—",
    createdAt: str(r.createdAt),
    redeemedAt: str(r.redeemedAt),
    redeemedByPhone: str(r.redeemedByPhone),
    redeemedByMac: str(r.redeemedByMac),
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
    return { kpis: FALLBACK_KPIS, vouchers: FALLBACK_VOUCHERS };
  }
  try {
    const res = await fetch(`${BASE_URL}hotspot/vouchers`, {
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
      return { kpis: FALLBACK_KPIS, vouchers: FALLBACK_VOUCHERS };
    }
    const vouchers = list.map(mapRowToVoucher);
    return { kpis: deriveKpis(vouchers), vouchers };
  } catch {
    return { kpis: FALLBACK_KPIS, vouchers: FALLBACK_VOUCHERS };
  }
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

  try {
    // Backend ManualVoucherRequest: POST /hotspot/vouchers/create
    // accepts { packageId, count, stationId, companyId }. stationId/companyId
    // are optional (backend derives them from JWT/device); pass stationId when known.
    const session = await auth();
    const stationId = session?.user?.stationId
      ? String(session.user.stationId)
      : undefined;
    const res = await fetch(`${BASE_URL}hotspot/vouchers/create`, {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify({
        packageId: Number(request.packageId),
        count: quantity,
        stationId,
      }),
    });

    if (!res.ok) {
      const body: { message?: string } | null = await res
        .json()
        .catch(() => null);
      const message = `HTTP ${res.status}: ${body?.message || "Failed to mint vouchers"}`;
      console.warn(message);
      return { success: false, message, count: quantity };
    }

    return {
      success: true,
      message: `Successfully minted ${quantity} vouchers.`,
      count: quantity,
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