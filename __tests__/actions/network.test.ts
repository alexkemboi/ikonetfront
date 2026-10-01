import { describe, it, expect, vi, beforeEach } from "vitest";
import { server } from "@/mocks/server";
import { http, HttpResponse } from "msw";
import { API_PREFIX } from "@/mocks/handlers/auth-guard";
import {
  routerHistoryFixture,
  routerLatestFixture,
  errorEnvelope,
} from "@/contracts/catalog";
import {
  getRouterMonitoringHistory,
  getRouterMonitoringLatest,
  getIpPools,
  createIpMappingAction,
  getRegions,
} from "@/actions/network";
import { getMikrotikDeviceStatus } from "@/actions/mikrotik";
import { revalidateTag } from "next/cache";

const TOKEN = "mock-valid-bearer-token";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("network metrics polling", () => {
  it("GET history resolves under `page`/`size` (Page envelope → content[]) and wires Bearer", async () => {
    server.use(
      http.get(`${API_PREFIX}/network/monitoring/router/:id/history`, ({ request }) => {
        expect(request.headers.get("authorization")).toBe(`Bearer ${TOKEN}`);
        const url = new URL(request.url);
        expect(url.searchParams.get("page")).toBe("0");
        expect(url.searchParams.get("size")).toBe("20");
        return HttpResponse.json(routerHistoryFixture(20), { status: 200 });
      })
    );

    const result = await getRouterMonitoringHistory(1, 20);
    expect(result).toHaveLength(20);
    expect(result[0].routerId).toBe(1);
  });

  it("GET latest returns the newest snapshot (polling alias until BE-AAA-045)", async () => {
    const result = await getRouterMonitoringLatest(1);
    expect(result?.routerId).toBe(routerLatestFixture().data?.routerId);
    expect(result?.cpuUsage).toBe(42);
  });

  it("GET device status resolves from the network-devices polling endpoint", async () => {
    const result = await getMikrotikDeviceStatus(1);
    expect(result.success).toBe(true);
    expect(result.data?.online).toBe(true);
    expect(result.data?.identity).toBe("ADRNOLDNETWORKS");
  });

  it("401 on a protected poller yields the error envelope (refresh-signout path)", async () => {
    server.use(
      http.get(`${API_PREFIX}/network-devices/:id/status`, () =>
        HttpResponse.json(errorEnvelope(401, "Unauthorized"), { status: 401 })
      )
    );

    const result = await getMikrotikDeviceStatus(1);
    expect(result.success).toBe(false);
    expect(result.status).toBe(401);
  });
});

describe("IP pools", () => {
  it("returns the registered IpPoolResponse fixtures with no static leakage", async () => {
    const pools = await getIpPools();
    expect(pools).toHaveLength(3);
    const names = pools.map((p) => p.poolName);
    expect(names).toContain("hs-pool-mombasa");
    expect(names).toContain("pppoe-pool-residential");
    expect(names).toContain("wireguard-tunnel-pool");
    expect(pools.every((p) => p.serviceType)).toBe(true);
  });
});

describe("regions tree (onboarding topology precondition)", () => {
  it("GET /network/regions?tree=true resolves the cascading Region → Location → Station tree", async () => {
    const result = await getRegions(true);
    expect(result.success).toBe(true);
    if (!result.success) return;
    const regions = result.data;
    expect(regions.length).toBeGreaterThan(0);
    const coast = regions.find((r) => r.regionCode === "REG-KE-COAST");
    expect(coast?.name).toBe("Coast Region");
    expect(coast?.locations?.[0]?.name).toBe("Mombasa Central");
    // Trap-2 coverage: Station idxno 1 = Mombasa Station 01 must be reachable,
    // fixing the silent Step-3 stall in mock-driven runs.
    expect(coast?.locations?.[0]?.stations?.[0]?.idxno).toBe(1);
    expect(coast?.locations?.[0]?.stations?.[0]?.name).toBe("Mombasa Station 01");
  });

  it("preserves an expired-token response for the page to sign out instead of returning an empty tree", async () => {
    server.use(
      http.get(`${API_PREFIX}/network/regions`, () => HttpResponse.json({
        status: 401,
        success: false,
        message: "TOKEN_INVALID_OR_EXPIRED",
        data: { requestId: "req-region-expired" },
        timestamp: "2026-09-29T08:00:00Z",
      }, { status: 401, headers: { "X-Request-Id": "req-region-expired" } }))
    );

    const result = await getRegions();
    expect(result).toEqual({
      success: false,
      status: 401,
      message: "TOKEN_INVALID_OR_EXPIRED",
      requestId: "req-region-expired",
    });
  });
});

describe("bindings: createIpMappingAction", () => {
  it("POSTs /customer-devices Bearer payload (OpenAPI deviceName) and revalidates the network page", async () => {
    server.use(
      http.post(`${API_PREFIX}/customer-devices`, async ({ request }) => {
        expect(request.headers.get("authorization")).toBe(`Bearer ${TOKEN}`);
        const body = (await request.json()) as Record<string, unknown>;
        expect(body).toEqual({
          customerIdxno: 1,
          macAddress: "AA:BB:CC:DD:EE:FF",
          deviceName: "Smart TV",
        });
        return HttpResponse.json(
          { status: 201, success: true, message: "Customer device bound", data: null },
          { status: 201 }
        );
      })
    );

    const result = await createIpMappingAction({
      customerId: "1",
      macAddress: "AA:BB:CC:DD:EE:FF",
    });

    expect(result.success).toBe(true);
    expect(revalidateTag).toHaveBeenCalledWith("network", "max");
  });

  it("returns the failure message when the backend rejects", async () => {
    server.use(
      http.post(`${API_PREFIX}/customer-devices`, () =>
        HttpResponse.json(errorEnvelope(422, "MAC already reserved"), { status: 422 })
      )
    );

    const result = await createIpMappingAction({
      customerId: "1",
      macAddress: "AA:BB:CC:DD:EE:FF",
    });

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/MAC already reserved/);
  });
});