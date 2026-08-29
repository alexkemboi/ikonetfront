import { describe, it, expect, vi, beforeEach } from "vitest";
import { server } from "@/mocks/server";
import { http, HttpResponse } from "msw";
import { API_PREFIX } from "@/mocks/handlers/auth-guard";
import { ipMappingsPageFixture } from "@/contracts/catalog";
import { getLiveSessionsData } from "@/actions/sessions";

const TOKEN = "mock-valid-bearer-token";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getLiveSessionsData (live-sessions hub)", () => {
  it("unwraps the ip-mappings Page envelope into content[] and derives KPIs from real bindings", async () => {
    server.use(
      http.get(`${API_PREFIX}/network/ip-mappings`, ({ request }) => {
        expect(request.headers.get("authorization")).toBe(`Bearer ${TOKEN}`);
        return HttpResponse.json(ipMappingsPageFixture(), { status: 200 });
      })
    );

    const { kpis, sessions } = await getLiveSessionsData();

    // 2 ONLINE bindings (A2085 HOTSPOT, P-114 PPPOE); EXPIRED row is excluded.
    expect(sessions).toHaveLength(2);
    expect(kpis.currentlyConnectedCount).toBe(2);
    expect(kpis.pppoeCount).toBe(1);
    expect(kpis.hotspotCount).toBe(1);
    expect(kpis.downloadTrafficGb).toBeGreaterThanOrEqual(0);
    expect(kpis.totalTrafficGb).toBeGreaterThanOrEqual(0);

    // Real identity: no synthesized "demo-/uuid" rows when content is non-empty.
    expect(sessions.some((s) => s.isFallback)).toBe(false);
    expect(sessions.every((s) => !s.id.startsWith("demo-"))).toBe(true);
    expect(sessions.every((s) => !/\b[0-9a-f]{8}-[0-9a-f]{4}/i.test(s.id))).toBe(true);

    // Display name joined from the real customer directory (username -> fullName).
    const grace = sessions.find((s) => s.subscriberCode === "A2085");
    expect(grace?.subscriberName).toBe("Grace Wanjiru");
    expect(grace?.protocol).toBe("HOTSPOT");
    expect(grace?.routerName).toBe("ADRNOLDNETWORKS");

    const pppoe = sessions.find((s) => s.subscriberCode === "P-114");
    expect(pppoe?.protocol).toBe("PPPOE");
  });

  it("falls back to the demo baseline when the backend has no bindings", async () => {
    server.use(
      http.get(`${API_PREFIX}/network/ip-mappings`, () =>
        HttpResponse.json(
          {
            status: 200,
            success: true,
            message: "OK",
            data: {
              content: [],
              pageable: {
                pageNumber: 0,
                pageSize: 20,
                sort: { unsorted: true, sorted: false, empty: true },
                offset: 0,
                unpaged: false,
                paged: true,
              },
              totalElements: 0,
              totalPages: 0,
              last: true,
              first: true,
              numberOfElements: 0,
              size: 20,
              number: 0,
              sort: { unsorted: true, sorted: false, empty: true },
              empty: true,
            },
          },
          { status: 200 }
        )
      )
    );

    const { kpis, sessions } = await getLiveSessionsData();
    expect(kpis.currentlyConnectedCount).toBe(51);
    expect(sessions[0].isFallback).toBe(true);
  });
});