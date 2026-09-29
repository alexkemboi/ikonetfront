import { beforeEach, describe, expect, it, vi } from "vitest";
import { getVouchersData } from "@/actions/vouchers";
import { apiFetch } from "@/lib/apiClient";

vi.mock("@/lib/apiClient", () => ({ apiFetch: vi.fn() }));

const mockedApiFetch = vi.mocked(apiFetch);
const response = (success: boolean, data: unknown, message = "OK", requestId = "req-vouchers") => ({
  status: success ? 200 : 503,
  success,
  data,
  message,
  requestId,
  timestamp: "2026-09-29T07:00:00Z",
});

beforeEach(() => { vi.clearAllMocks(); });

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