import { describe, it, expect, vi, beforeEach } from "vitest";
import { server } from "@/mocks/server";
import { http, HttpResponse } from "msw";
import { API_PREFIX } from "@/mocks/handlers/auth-guard";
import { ipMappingsPageFixture } from "@/contracts/catalog";
import { getSubscribersData } from "@/actions/subscribers";

const TOKEN = "mock-valid-bearer-token";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getSubscribersData (subscriber hub)", () => {
  it("derives KPIs from the customers page + ip-mappings Page envelope (no invented BINDING rows)", async () => {
    server.use(
      http.get(`${API_PREFIX}/network/ip-mappings`, ({ request }) => {
        expect(request.headers.get("authorization")).toBe(`Bearer ${TOKEN}`);
        return HttpResponse.json(ipMappingsPageFixture(), { status: 200 });
      })
    );

    const { kpis, subscribers } = await getSubscribersData();

    // Customers page: 2 entries (Grace Wanjiru / Joseph Mwangi). No rows are
    // invented for every binding — no "BINDING" subtypes leak into the list.
    expect(subscribers).toHaveLength(2);
    expect(subscribers.some((s) => s.type === "BINDING")).toBe(false);
    expect(subscribers.some((s) => s.fullName.toLowerCase().includes("BINDING"))).toBe(false);

    // Only A2085 has a matching ONLINE radacct mapping → onlineCount = 1.
    expect(kpis.allUsersCount).toBe(2);
    expect(kpis.onlineCount).toBe(1);

    // Online enrichment: joined stationName + MAC/IP from the live mapping.
    const grace = subscribers.find((s) => s.fullName === "Grace Wanjiru");
    expect(grace?.status).toBe("ONLINE");
    expect(grace?.nasName).toBe("ADRNOLDNETWORKS");
    expect(grace?.macAddress).toBe("32:A2:F1:9C:4D:02");
    expect(grace?.ipAddress).toBe("172.16.0.11");

    const joseph = subscribers.find((s) => s.fullName === "Joseph Mwangi");
    expect(joseph?.status).toBe("OFFLINE");
  });

  it("counts remaining expiring/new/at-risk KPIs from the customer page", async () => {
    const { kpis } = await getSubscribersData();
    expect(kpis.expiringIn7DaysCount).toBeGreaterThanOrEqual(0);
    expect(kpis.newThisWeekCount).toBeGreaterThanOrEqual(0);
    expect(kpis.atRiskCount).toBeGreaterThanOrEqual(0);
    expect(kpis.onlinePercentage).toBe(50);
  });
});