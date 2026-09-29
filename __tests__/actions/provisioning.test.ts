import { describe, it, expect, vi, beforeEach } from "vitest";
import { isRouterOnline } from "@/lib/utils/router-status";

const mockDevices = vi.fn();
const mockRouters = vi.fn();
const mockLatest = vi.fn();

vi.mock("@/actions/mikrotik", () => ({
  getMikrotikDevices: (...args: unknown[]) => mockDevices(...args),
  getMikrotikDeviceStatus: vi.fn(),
}));

vi.mock("@/actions/network", () => ({
  getRouterMonitoringLatest: (...args: unknown[]) => mockLatest(...args),
  getRouters: (...args: unknown[]) => mockRouters(...args),
}));

// Import AFTER the mocks so the module under test uses them.
import { getNasRoutersData } from "@/actions/provisioning";

const deviceFixture = [
  {
    id: 8,
    name: "RTR-BDK-MWI-001",
    deviceType: "ROUTER",
    online: false, // ARP-discovery flag is stale — the exact bug scenario
    ipAddress: "10.8.1.10",
    uptime: null,
    cpuLoad: null,
  },
];

const freshSnapshot = {
  idxno: 91,
  routerId: 7,
  cpuUsage: 0,
  totalMemory: 268435456,
  freeMemory: 839000000,
  activePppoeSessions: 1,
  activeHotspotSessions: 0,
  uptime: "3d 12h 32m 5s",
  latencyMs: 14,
  createdAt: new Date(Date.now() - 30_000).toISOString(), // 30s ago → fresh
};

const staleSnapshot = {
  ...freshSnapshot,
  createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1h ago → stale
};

const inventoryFixture = [{ id: 7, name: "RTR-BDK-MWI-001", ipAddress: "10.8.1.10" }];

describe("isRouterOnline (status badge normalization)", () => {
  it.each([
    ["ONLINE", true],
    ["ACTIVE", true],
    ["Active", true],
    ["active", true],
    ["OFFLINE", false],
  ] as [string, boolean][])("status %s → %s", (status, expected) => {
    expect(isRouterOnline({ status })).toBe(expected);
  });

  it("treats boolean true / online flag as online", () => {
    expect(isRouterOnline({ status: true })).toBe(true);
    expect(isRouterOnline({ status: "OFFLINE", online: true })).toBe(true);
    expect(isRouterOnline({ status: "OFFLINE", online: false })).toBe(false);
    expect(isRouterOnline(null)).toBe(false);
  });
});

describe("getNasRoutersData (telemetry-driven ONLINE badge)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDevices.mockResolvedValue({ success: true, data: deviceFixture });
    mockRouters.mockResolvedValue(inventoryFixture);
  });

  it("elevates a stale-flag device to ONLINE when the snapshot is fresh", async () => {
    mockLatest.mockResolvedValue(freshSnapshot);
    const { kpis, routers } = await getNasRoutersData();

    expect(routers[0].id).toBe("8");
    expect(routers[0].routerId).toBe(7);
    expect(routers[0].status).toBe("ONLINE");
    expect(isRouterOnline(routers[0])).toBe(true);
    expect(kpis.onlineCount).toBe(1);
    // Live values surface on the row
    expect(routers[0].freeMemory).toBe(839000000);
    expect(routers[0].uptime).toBe("3d 12h 32m 5s");
  });

  it("keeps the device-derived status when the snapshot is stale", async () => {
    mockLatest.mockResolvedValue(staleSnapshot);
    const { kpis, routers } = await getNasRoutersData();

    // snapshotAt present but older than 5 min → stays OFFLINE (device.online=false)
    expect(routers[0].status).toBe("OFFLINE");
    expect(kpis.onlineCount).toBe(0);
  });

  it("keeps the device-derived status when no snapshot exists", async () => {
    mockLatest.mockResolvedValue(null);
    const { routers } = await getNasRoutersData();
    expect(routers[0].status).toBe("OFFLINE");
  });

  it("returns an empty inventory (never sample routers) when the company has none", async () => {
    mockDevices.mockResolvedValue({ success: true, data: [] });
    const { kpis, routers, error } = await getNasRoutersData();
    expect(routers).toEqual([]);
    expect(kpis.totalRoutersCount).toBe(0);
    expect(kpis.liveSessionsCount).toBe(0);
    expect(error).toBeUndefined();
  });

  it("reports an error instead of sample routers when the inventory call fails", async () => {
    mockDevices.mockResolvedValue({ success: false, data: [], message: "Forbidden" });
    const { routers, error } = await getNasRoutersData();
    expect(routers).toEqual([]);
    expect(error).toBe("Forbidden");
  });

  it("does not read telemetry by device id when no router row matches", async () => {
    mockRouters.mockResolvedValue([]);
    mockLatest.mockResolvedValue(freshSnapshot);
    const { routers } = await getNasRoutersData();
    expect(mockLatest).not.toHaveBeenCalled();
    expect(routers[0].routerId).toBeUndefined();
  });
});