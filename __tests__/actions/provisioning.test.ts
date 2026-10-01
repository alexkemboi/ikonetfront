import { beforeEach, describe, expect, it, vi } from "vitest";
import { getNasRoutersData } from "@/actions/provisioning";
import { getMikrotikDevices } from "@/actions/mikrotik";
import { getRouters, getRouterMonitoringLatest } from "@/actions/network";
import { isRouterOnline } from "@/lib/utils/router-status";
import type { MikrotikDevice } from "@/lib/types/mikrotik";

vi.mock("@/actions/mikrotik", () => ({ getMikrotikDevices: vi.fn() }));
vi.mock("@/actions/network", () => ({
  getRouters: vi.fn(),
  getRouterMonitoringLatest: vi.fn(),
}));

const mockedDevices = vi.mocked(getMikrotikDevices);
const mockedRouters = vi.mocked(getRouters);
const mockedLatest = vi.mocked(getRouterMonitoringLatest);

const deviceFixture = [
  {
    id: 8,
    name: "RTR-1",
    deviceType: "MIKROTIK",
    online: false,
    ipAddress: "10.0.0.1",
    uptime: "3d",
    cpuLoad: "12",
    winboxTunnelPort: null,
    webfigProxyEnabled: null,
    tunnelExpiresAt: null,
    winboxTunnelAddress: null,
    webConsoleUrl: null,
  },
] as unknown as MikrotikDevice[];

const inventoryFixture = [{ id: 7, ipAddress: "10.0.0.1" }] as Awaited<ReturnType<typeof getRouters>>;

const freshSnapshot = {
  idxno: 501,
  createdAt: new Date().toISOString(),
  cpuUsage: 91,
  freeMemory: 839_000_000,
  totalMemory: 2_000_000_000,
  uptime: "3d 12h 32m 5s",
  activePppoeSessions: 3,
  activeHotspotSessions: 2,
} as Awaited<ReturnType<typeof getRouterMonitoringLatest>>;

const staleSnapshot = {
  ...freshSnapshot,
  createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
} as Awaited<ReturnType<typeof getRouterMonitoringLatest>>;

beforeEach(() => {
  vi.clearAllMocks();
  mockedDevices.mockResolvedValue({ status: 200, success: true, message: "OK", data: deviceFixture } as never);
  mockedRouters.mockResolvedValue(inventoryFixture);
  mockedLatest.mockResolvedValue(freshSnapshot);
});

describe("getNasRoutersData (telemetry-driven ONLINE badge)", () => {
  it("elevates a stale-flag device to ONLINE when the snapshot is fresh", async () => {
    const { kpis, routers } = await getNasRoutersData();

    expect(routers[0].id).toBe("8");
    expect(routers[0].routerId).toBe(7);
    expect(routers[0].status).toBe("ONLINE");
    expect(isRouterOnline(routers[0])).toBe(true);
    expect(kpis.onlineCount).toBe(1);
    // Live values surface on the row
    expect(routers[0].freeMemory).toBe(839000000);
    expect(routers[0].uptime).toBe("3d 12h 32m 5s");
    expect(kpis.liveSessionsCount).toBe(5);
  });

  it("keeps the device-derived status when the snapshot is stale", async () => {
    mockedLatest.mockResolvedValue(staleSnapshot);
    const { kpis, routers } = await getNasRoutersData();

    // snapshotAt present but older than 5 min → stays OFFLINE (device.online=false)
    expect(routers[0].status).toBe("OFFLINE");
    expect(kpis.onlineCount).toBe(0);
  });

  it("keeps the device-derived status when no snapshot exists", async () => {
    mockedLatest.mockResolvedValue(null);
    const { routers } = await getNasRoutersData();
    expect(routers[0].status).toBe("OFFLINE");
  });

  it("returns an empty inventory (never sample routers) when the company has none", async () => {
    mockedDevices.mockResolvedValue({ status: 200, success: true, message: "OK", data: [] } as never);
    const { kpis, routers, error } = await getNasRoutersData();
    expect(routers).toEqual([]);
    expect(kpis.totalRoutersCount).toBe(0);
    expect(kpis.liveSessionsCount).toBe(0);
    expect(error).toBeUndefined();
  });

  it("reports an error instead of sample routers when the inventory call fails", async () => {
    mockedDevices.mockResolvedValue({
      status: 403,
      success: false,
      message: "Forbidden",
      data: [],
    } as never);
    const { routers, error } = await getNasRoutersData();
    expect(routers).toEqual([]);
    expect(error).toBe("Forbidden");
  });

  it("does not read telemetry by device id when no router row matches", async () => {
    mockedRouters.mockResolvedValue([]);
    mockedLatest.mockResolvedValue(freshSnapshot);
    const { routers } = await getNasRoutersData();
    expect(mockedLatest).not.toHaveBeenCalled();
    expect(routers[0].routerId).toBeUndefined();
  });
});