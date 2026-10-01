import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSubscribersData } from "@/actions/subscribers";
import { apiFetch } from "@/lib/apiClient";

vi.mock("@/lib/apiClient", () => ({ apiFetch: vi.fn() }));

const mockedApiFetch = vi.mocked(apiFetch);
const response = (success: boolean, data: unknown, message = "OK", requestId = "req-sub") => ({ status: success ? 200 : 503, success, data, message, requestId, timestamp: "2026-09-29T07:00:00Z" });
const hub = {
  kpis: { allUsersCount: 2, expiringIn7DaysCount: 1, newThisWeekCount: 1, onlinePercentage: 50, onlineCount: 1, atRiskCount: 1, statusCounts: { active: 1, grace: 0, expired: 1, suspended: 0 } },
  rows: { content: [
    { id: 1, code: "A2085", fullName: "Grace Wanjiru", phone: "0712345678", email: "grace@example.test", type: "HOTSPOT", planName: "Daily", planSpeed: "10 Mbps", planPrice: "50.00", expiryText: "Expires today", expiryDate: "2026-09-29", isExpiringToday: true, status: "ACTIVE", isOnline: false, lastSeenAt: null, activeSessionId: null, nasName: "RTR-1", deviceType: null, macAddress: null, ipAddress: null },
    { id: 2, code: "A2", fullName: "Joseph Mwangi", phone: "0712345679", email: null, type: "PPPOE", planName: "Monthly", planSpeed: "20 Mbps", planPrice: "1500.00", expiryText: "Expired", expiryDate: "2026-09-20", isExpiringToday: false, status: "EXPIRED", isOnline: true, lastSeenAt: "2026-09-29T06:59:00Z", activeSessionId: "session-2", nasName: "RTR-2", deviceType: null, macAddress: "AA:BB:CC:DD:EE:FF", ipAddress: "10.0.0.2" },
  ], totalElements: 2, totalPages: 1, number: 0, size: 25 },
  query: { page: 0, size: 25, statusFilter: null, search: null, businessDate: "2026-09-29", kpiScope: "KPIS_IGNORE_STATUS_FILTER_AND_PAGINATION" },
};

beforeEach(() => { vi.clearAllMocks(); });

describe("getSubscribersData", () => {
  it("keeps account lifecycle, connection state, and money strings distinct", async () => {
    mockedApiFetch.mockResolvedValueOnce(response(true, hub) as never);
    const result = await getSubscribersData();
    expect(mockedApiFetch).toHaveBeenCalledWith("/subscribers/hub?page=0&size=25", expect.objectContaining({ auth: "required" }));
    expect(result.success).toBe(true);
    expect(result.kpis?.onlineCount).toBe(1);
    expect(result.rows?.content[0]?.status).toBe("ACTIVE");
    expect(result.rows?.content[0]?.isOnline).toBe(false);
    expect(result.rows?.content[0]?.planPrice).toBe("50.00");
    expect(result.rows?.content[1]?.status).toBe("EXPIRED");
    expect(result.rows?.content[1]?.isOnline).toBe(true);
  });

  it("returns unavailable state with request reference on backend failure", async () => {
    mockedApiFetch.mockResolvedValueOnce(response(false, { requestId: "req-sub-503" }, "DATA_SOURCE_UNAVAILABLE", "req-sub-503") as never);
    const result = await getSubscribersData();
    expect(result.success).toBe(false);
    expect(result.kpis).toBeNull();
    expect(result.rows).toBeNull();
    expect(result.requestId).toBe("req-sub-503");
  });
});
