import { describe, it, expect, vi, beforeEach } from "vitest";
import { server } from "@/mocks/server";
import { http, HttpResponse } from "msw";
import { API_PREFIX } from "@/mocks/handlers/auth-guard";
import {
  activePackagesFixture,
  initiatePaymentFixture,
  reconnectFixture,
} from "@/contracts/catalog";
import {
  getPublicHotspotPackagesAction,
  initiateHotspotPayment,
  checkActiveSession,
  activateVoucherAction,
} from "@/actions/hotspot";
import { revalidateTag } from "next/cache";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("public hotspot portal (permitAll — NO Authorization header)", () => {
  it("GET /hotspot/packages returns packages without auth", async () => {
    server.use(
      http.get(`${API_PREFIX}/hotspot/packages`, ({ request }) => {
        expect(request.headers.get("authorization")).toBeNull();
        return HttpResponse.json(activePackagesFixture(), { status: 200 });
      })
    );

    const result = await getPublicHotspotPackagesAction();
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(2);
    expect(result.data?.[0].packageName).toBe("Home Hotspot 10Mbps");
  });

  it("POST /hotspot/initiate sends the exact request body without auth and accepts 201", async () => {
    server.use(
      http.post(`${API_PREFIX}/hotspot/initiate`, async ({ request }) => {
        expect(request.headers.get("authorization")).toBeNull();
        const body = (await request.json()) as Record<string, unknown>;
        expect(body).toMatchObject({
          packageId: 1,
          phone: "0726837210",
          paymentMode: "MPESA",
          macAddress: "32:A2:F1:9C:4D:02",
          clientMac: "32:A2:F1:9C:4D:02",
          clientIp: "172.16.0.11",
        });
        return HttpResponse.json(initiatePaymentFixture(), { status: 201 });
      })
    );

    const result = await initiateHotspotPayment({
      packageId: 1,
      phone: "0726837210",
      paymentMode: "MPESA",
      macAddress: "32:A2:F1:9C:4D:02",
      clientMac: "32:A2:F1:9C:4D:02",
      clientIp: "172.16.0.11",
    });

    expect(result.success).toBe(true);
    expect(result.data?.sessionId).toBe("HS-20260826-001");
    expect(revalidateTag).toHaveBeenCalledWith("hotspot-packages", "page");
  });

  it("POST /hotspot/reconnect sends body { macAddress, clientIp } without auth", async () => {
    server.use(
      http.post(`${API_PREFIX}/hotspot/reconnect`, async ({ request }) => {
        expect(request.headers.get("authorization")).toBeNull();
        const body = (await request.json()) as Record<string, unknown>;
        expect(body).toEqual({ macAddress: "32:A2:F1:9C:4D:02", clientIp: "172.16.0.11" });
        return HttpResponse.json(reconnectFixture(), { status: 200 });
      })
    );

    const result = await checkActiveSession("32:A2:F1:9C:4D:02", "172.16.0.11");
    expect(result.success).toBe(true);
    expect(result.data?.hasActiveSession).toBe(true);
    expect(result.data?.session?.sessionStatus).toBe("ACTIVE");
  });
});

describe("voucher activation gating (BE gap ticket)", () => {
  it("returns a readable 503 envelope without touching the network", async () => {
    const result = await activateVoucherAction("ABC123XYZ789");
    expect(result.success).toBe(false);
    expect(result.status).toBe(503);
    expect(result.message).toMatch(/pending/i);
  });
});