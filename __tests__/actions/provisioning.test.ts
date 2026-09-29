import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiFetch } from "@/lib/apiClient";
import { getNasRoutersData } from "@/actions/provisioning";

vi.mock("@/lib/apiClient", () => ({ apiFetch: vi.fn() }));
const mockedApiFetch = vi.mocked(apiFetch);
const links = { router: "/api/v1/network-routers/7", routerAction: "/api/v1/network-routers/7/action", telemetryLatest: "/api/v1/network/monitoring/router/7/latest", deviceInterfaces: "/api/v1/network-devices/8/interfaces", deviceStatus: "/api/v1/network-devices/8/status", deviceDelete: "/api/v1/network-devices/8" };
const response = (data: unknown, success = true) => ({ status: success ? 200 : 503, success, message: success ? "OK" : "DATA_SOURCE_UNAVAILABLE", data, requestId: "req-router", timestamp: "2026-09-29T00:00:00Z" });

beforeEach(() => { vi.clearAllMocks(); });

describe("getNasRoutersData", () => {
  it("preserves the authoritative four-state status, ids, telemetry and links", async () => {
    mockedApiFetch.mockResolvedValueOnce(response({ kpis: { totalCount: 2, onlineCount: 2, offlineCount: 0, healthyCount: 1, degradedCount: 1, notProvisionedCount: 0, cpuAvg: 40, memoryAvg: 50, rowsWithTelemetry: 2, activeSessionsTotal: 4 }, rows: [
      { routerId: 7, deviceId: 8, name: "RTR-1", model: "RB5009", serialNumber: "SN1", status: "DEGRADED", online: true, managementIp: "10.0.0.1", winboxTunnelAddress: null, winboxTunnelPort: null, activeSessions: 4, cpuUsage: 90, freeMemory: 100, totalMemory: 200, uptime: "3d", snapshotAt: "2026-09-29T00:00:00Z", telemetryStatus: "LIVE", companyCode: "CMP-1", stationName: "Station 1", links },
      { routerId: null, deviceId: 9, name: "DEVICE-ONLY", model: null, serialNumber: null, status: "NOT_PROVISIONED", online: false, managementIp: null, winboxTunnelAddress: null, winboxTunnelPort: null, activeSessions: null, cpuUsage: null, freeMemory: null, totalMemory: null, uptime: null, snapshotAt: null, telemetryStatus: "UNAVAILABLE", companyCode: null, stationName: null, links: { router: null, routerAction: null, telemetryLatest: null, deviceInterfaces: "/api/v1/network-devices/9/interfaces", deviceStatus: "/api/v1/network-devices/9/status", deviceDelete: "/api/v1/network-devices/9" } },
    ] }) as never);
    const result = await getNasRoutersData();
    expect(mockedApiFetch).toHaveBeenCalledWith("/provisioning/nas-routers", expect.objectContaining({ auth: "required" }));
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.routers[0]?.status).toBe("DEGRADED");
    expect(result.routers[0]?.routerId).toBe(7);
    expect(result.routers[0]?.deviceId).toBe(8);
    expect(result.routers[0]?.links?.routerAction).toBe(links.routerAction);
    expect(result.routers[1]?.status).toBe("NOT_PROVISIONED");
    expect(result.routers[1]?.routerId).toBeUndefined();
    expect(result.routers[1]?.links?.routerAction).toBeNull();
  });

  it("returns no demo rows when the service is unavailable", async () => {
    mockedApiFetch.mockResolvedValueOnce(response(null, false) as never);
    const result = await getNasRoutersData();
    expect(result).toEqual({ success: false, message: "DATA_SOURCE_UNAVAILABLE", requestId: "req-router" });
  });
});
