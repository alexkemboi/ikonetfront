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

describe("voucher activation (POST /hotspot/vouchers/activate)", () => {
  it("posts the device context without auth and returns the activated session", async () => {
    let seenAuth: string | null = "unset";
    let seenBody: Record<string, unknown> | null = null;
    server.use(
      http.post(`${API_PREFIX}/hotspot/vouchers/activate`, async ({ request }) => {
        seenAuth = request.headers.get("authorization");
        seenBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({
          status: 200,
          success: true,
          message: "Voucher activated successfully",
          data: { sessionId: 9, sessionStatus: "ACTIVE", voucherCode: "KES7HQ2M", macAddress: "78:F2:38:8C:D1:BC" },
          timestamp: new Date().toISOString(),
        });
      })
    );

    const result = await activateVoucherAction({
      voucherCode: " kes7hq2m ",
      macAddress: "78:F2:38:8C:D1:BC",
      clientIp: "10.5.50.20",
      routerIdentity: "ADRINOLD-WESTLANDS",
    });

    expect(seenAuth).toBeNull();
    expect(seenBody).toEqual({
      voucherCode: "KES7HQ2M",
      macAddress: "78:F2:38:8C:D1:BC",
      clientIp: "10.5.50.20",
      routerIdentity: "ADRINOLD-WESTLANDS",
    });
    expect(result.success).toBe(true);
    expect(result.data?.sessionStatus).toBe("ACTIVE");
  });

  it("surfaces the backend refusal message", async () => {
    server.use(
      http.post(`${API_PREFIX}/hotspot/vouchers/activate`, () =>
        HttpResponse.json(
          { status: 409, success: false, message: "This voucher is already bound to another device.", data: null, timestamp: new Date().toISOString() },
          { status: 409 }
        )
      )
    );

    const result = await activateVoucherAction({ voucherCode: "KES7HQ2M", macAddress: "AA:BB:CC:DD:EE:FF" });

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/another device/i);
  });
});
