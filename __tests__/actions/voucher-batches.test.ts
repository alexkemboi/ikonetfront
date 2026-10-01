import { beforeEach, describe, expect, it, vi } from "vitest";
import { getVoucherBatchDetails, getVoucherBatches } from "@/actions/payments";
import { apiFetch } from "@/lib/apiClient";

vi.mock("@/lib/apiClient", () => ({ apiFetch: vi.fn() }));

const mockedApiFetch = vi.mocked(apiFetch);
const response = (success: boolean, data: unknown, message = "OK", requestId = "req-batches") => ({
  status: success ? 200 : 503,
  success,
  data,
  message,
  requestId,
  timestamp: "2026-09-29T07:00:00Z",
});

beforeEach(() => { vi.clearAllMocks(); });

describe("getVoucherBatches", () => {
  it("does not represent failed reads as zero-valued KPIs", async () => {
    mockedApiFetch
      .mockResolvedValueOnce(response(false, null, "DATA_SOURCE_UNAVAILABLE", "req-list") as never)
      .mockResolvedValueOnce(response(false, null, "DATA_SOURCE_UNAVAILABLE", "req-summary") as never);
    const result = await getVoucherBatches();
    expect(result.kpis).toBeNull();
    expect(result.batches).toEqual([]);
    expect(result.error).toBe("DATA_SOURCE_UNAVAILABLE");
    expect(result.requestId).toBe("req-list");
  });

  it("preserves zero values returned by a successful empty result", async () => {
    mockedApiFetch
      .mockResolvedValueOnce(response(true, { content: [], totalElements: 0, totalPages: 0, number: 0, size: 50 }) as never)
      .mockResolvedValueOnce(response(true, { companyId: null, batches: 0, vouchers: 0, totalValue: "0.00" }) as never);
    const result = await getVoucherBatches();
    expect(result.kpis?.activeCount).toBe(0);
    expect(result.kpis?.totalValue).toBe("0.00");
    expect(result.error).toBeUndefined();
  });
});

describe("getVoucherBatchDetails", () => {
  it("loads details by stable batch ID", async () => {
    const batch = { batchId: "batch-uuid", batchNumber: "VB-001", sessionBatchId: "VBH-001" };
    mockedApiFetch.mockResolvedValueOnce(response(true, batch) as never);

    const result = await getVoucherBatchDetails("batch-uuid");

    expect(mockedApiFetch).toHaveBeenCalledWith("/finance/voucher-batches/batch-uuid", expect.objectContaining({ auth: "required" }));
    expect(result.success).toBe(true);
    expect(result.data?.sessionBatchId).toBe("VBH-001");
  });
});