import { beforeEach, describe, expect, it, vi } from "vitest";
import { generateVouchers, getVouchersData } from "@/actions/vouchers";
import { apiFetch } from "@/lib/apiClient";

const { mockGetPermissionForRoute } = vi.hoisted(() => ({ mockGetPermissionForRoute: vi.fn() }));

vi.mock("@/lib/apiClient", () => ({ apiFetch: vi.fn() }));
vi.mock("@/lib/data/nav", () => ({ getPermissionForRoute: mockGetPermissionForRoute }));

const mockedApiFetch = vi.mocked(apiFetch);
const response = (success: boolean, data: unknown, message = "OK", requestId = "req-vouchers") => ({
  status: success ? 200 : 503,
  success,
  data,
  message,
  requestId,
  timestamp: "2026-09-29T07:00:00Z",
});

beforeEach(() => {
  vi.clearAllMocks();
  mockGetPermissionForRoute.mockResolvedValue({ canCreate: true });
});

describe("getVouchersData", () => {
  it("does not turn a backend failure into zero voucher KPIs", async () => {
    mockedApiFetch
      .mockResolvedValueOnce(response(false, null, "DATA_SOURCE_UNAVAILABLE", "req-list-failed") as never)
      .mockResolvedValueOnce(response(false, null, "DATA_SOURCE_UNAVAILABLE", "req-stats-failed") as never);
    const result = await getVouchersData();
    expect(result.kpis).toBeNull();
    expect(result.error).toBe("DATA_SOURCE_UNAVAILABLE");
    expect(result.requestId).toBe("req-list-failed");
  });

  it("does not apply row-state filters to the statistics endpoint", async () => {
    mockedApiFetch
      .mockResolvedValueOnce(response(true, { content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 }) as never)
      .mockResolvedValueOnce(response(true, { totalVoucherCodes: 0, usedCodes: 0, unusedCodes: 0, expiredUnusedCodes: 0, batches: 0, redemptionRatePercent: 0 }) as never);
    await getVouchersData({ voucherState: "USED", source: "MINTED" });
    expect(mockedApiFetch.mock.calls[0]?.[0]).toContain("voucherState=USED");
    expect(mockedApiFetch.mock.calls[1]?.[0]).toBe("/hotspot/vouchers/statistics?source=MINTED");
  });
});

describe("generateVouchers", () => {
  it("preserves package price-change details and request ID", async () => {
    mockedApiFetch.mockResolvedValueOnce(response(
      false,
      { code: "PACKAGE_CHANGED", serverUnitPrice: "75.00" },
      "PACKAGE_CHANGED",
      "req-price-changed"
    ) as never);

    const result = await generateVouchers({
      packageId: 1,
      quantity: 2,
      voucherType: "DEMO",
      source: "SALE",
      deviceId: 8,
      channel: "CASH",
      expectedUnitPrice: "50.00",
      idempotencyKey: "voucher-attempt-1",
    });

    expect(result).toMatchObject({
      success: false,
      code: "PACKAGE_CHANGED",
      serverUnitPrice: "75.00",
      requestId: "req-price-changed",
    });
  });
});