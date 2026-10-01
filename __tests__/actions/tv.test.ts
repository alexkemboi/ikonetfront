import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiFetch } from "@/lib/apiClient";
import { getEligibleTvPackagesAction } from "@/actions/tv";

vi.mock("@/lib/apiClient", () => ({ apiFetch: vi.fn() }));
const mockedApiFetch = vi.mocked(apiFetch);
beforeEach(() => { vi.clearAllMocks(); });

describe("TV eligible package endpoint", () => {
  it("uses the verification portal token and preserves package price strings", async () => {
    mockedApiFetch.mockResolvedValueOnce({ status: 200, success: true, message: "OK", timestamp: "2026-09-29T00:00:00Z", data: [{ packageId: 12, name: "TV 30 days", validityLabel: "30 days", speedLabel: null, price: "800.00", currency: "KES", availableForDevice: true, unavailableReason: null, notes: "Unlimited" }] } as never);
    const result = await getEligibleTvPackagesAction("portal-token", "AA:BB:CC:DD:EE:FF");
    expect(mockedApiFetch).toHaveBeenCalledWith("/tv/packages/eligible?macAddress=AA%3ABB%3ACC%3ADD%3AEE%3AFF", expect.objectContaining({ auth: "public", headers: { "X-TV-Portal-Token": "portal-token" }, cache: "no-store" }));
    expect(result.packages[0]?.price).toBe("800.00");
    expect(result.packages[0]?.availableForDevice).toBe(true);
  });

  it("returns an explicit package-load error without demo packages", async () => {
    mockedApiFetch.mockResolvedValueOnce({ status: 503, success: false, message: "DATA_SOURCE_UNAVAILABLE", requestId: "req-tv-packages", data: null } as never);
    const result = await getEligibleTvPackagesAction("portal-token", "AA:BB:CC:DD:EE:FF");
    expect(result.packages).toEqual([]);
    expect(result.error).toBe("DATA_SOURCE_UNAVAILABLE");
  });
});
