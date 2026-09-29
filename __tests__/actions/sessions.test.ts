import { beforeEach, describe, expect, it, vi } from "vitest";
import { getLiveSessionsData } from "@/actions/sessions";
import { apiFetch } from "@/lib/apiClient";

vi.mock("@/lib/apiClient", () => ({ apiFetch: vi.fn() }));

const mockedApiFetch = vi.mocked(apiFetch);
const response = (success: boolean, data: unknown, message = "OK", requestId = "req-live", status = success ? 200 : 503) => ({ status, success, data, message, requestId, timestamp: "2026-09-29T07:00:00Z" });
const sessionResponse = {
  kpis: { currentlyConnected: 1, pppoeCount: 1, hotspotCount: 0, tvCount: 0, paidNotConnected: 1, lostContact: 0, sessionsWithoutCounters: 1, downloadBytesTotal: "8589934597", uploadBytesTotal: "12", totalBytesTotal: "8589934609" },
  sessions: { content: [{ subscriberCode: "A2085", subscriberName: "Grace Wanjiru", protocol: "PPPoE", deviceMac: "AA:BB:CC:DD:EE:FF", assignedIp: "10.0.0.2", routerName: "RTR-1", routerManagementIp: "10.0.0.1", downloadBytes: "8589934597", uploadBytes: null, countersAvailable: false, onlineDurationFormatted: "2h", connectedAt: "2026-09-29T06:00:00Z", expiryDate: null, expiresAt: null, expiryFormatted: "-", sessionId: null, phone: null, packageName: null, voucherCode: null, mpesaReceipt: null, amountPaid: null, nasIp: "10.0.0.1", minutesRemaining: null, online: true, lastSeenAt: "2026-09-29T06:59:00Z" }], totalElements: 1, totalPages: 1, number: 0, size: 50 },
  scope: { companyId: null, stationId: null, page: 0, size: 50 }, generatedAt: "2026-09-29T07:00:00Z", refreshIntervalSeconds: 30,
};

beforeEach(() => { vi.clearAllMocks(); });

describe("getLiveSessionsData", () => {
  it("requests the paginated endpoint and preserves large/null counters", async () => {
    mockedApiFetch.mockResolvedValueOnce(response(true, sessionResponse) as never);
    const result = await getLiveSessionsData(0, 50);
    expect(mockedApiFetch).toHaveBeenCalledWith("/sessions/live?page=0&size=50", expect.objectContaining({ auth: "required", cache: "no-store" }));
    expect(result.success).toBe(true);
    expect(result.kpis?.currentlyConnected).toBe(1);
    expect(result.kpis?.paidNotConnected).toBe(1);
    expect(result.sessions?.content[0]?.downloadBytes).toBe("8589934597");
    expect(result.sessions?.content[0]?.uploadBytes).toBeNull();
    expect(result.sessions?.content[0]?.protocol).toBe("PPPoE");
  });

  it("returns unavailable state with request reference instead of demo zeroes", async () => {
    mockedApiFetch.mockResolvedValueOnce(response(false, { requestId: "req-live-503" }, "LIVE_SESSIONS_UNAVAILABLE", "req-live-503") as never);
    const result = await getLiveSessionsData();
    expect(result.success).toBe(false);
    expect(result.kpis).toBeNull();
    expect(result.sessions).toBeNull();
    expect(result.requestId).toBe("req-live-503");
  });

  it("preserves unauthorized status so the page can clear the stale session", async () => {
    mockedApiFetch.mockResolvedValueOnce(response(false, { requestId: "req-live-401" }, "TOKEN_INVALID_OR_EXPIRED", "req-live-401", 401) as never);
    const result = await getLiveSessionsData();
    expect(result.success).toBe(false);
    expect(result.status).toBe(401);
    expect(result.message).toBe("TOKEN_INVALID_OR_EXPIRED");
    expect(result.requestId).toBe("req-live-401");
  });
});
