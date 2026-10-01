import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiFetch } from "@/lib/apiClient";
import { activateVoucherAction, getPublicHotspotPackagesAction, initiateHotspotPayment, checkActiveSession } from "@/actions/hotspot";

vi.mock("@/lib/apiClient", () => ({ apiFetch: vi.fn() }));
const mockedApiFetch = vi.mocked(apiFetch);
beforeEach(() => { vi.clearAllMocks(); });

describe("public hotspot APIs", () => {
  it("scopes public package reads to router identity without staff auth", async () => {
    mockedApiFetch.mockResolvedValueOnce({ status: 200, success: true, message: "OK", data: [{ idxno: 1, packageName: "Hotspot 1h", price: "50.00", activeStatus: true }], timestamp: "2026-09-29T00:00:00Z" } as never);
    const result = await getPublicHotspotPackagesAction({ routerIdentity: "RTR-1", clientIp: "10.0.0.2" });
    expect(mockedApiFetch).toHaveBeenCalledWith("/hotspot/packages?serviceType=HOTSPOT&routerIdentity=RTR-1&clientIp=10.0.0.2", expect.objectContaining({ auth: "public" }));
    expect(result.data?.[0]?.price).toBe("50.00");
  });

  it("starts hotspot payments using the provided captive device identity", async () => {
    mockedApiFetch.mockResolvedValueOnce({ status: 201, success: true, message: "Accepted", data: { sessionId: "HS-1" }, timestamp: "2026-09-29T00:00:00Z" } as never);
    const result = await initiateHotspotPayment({ packageId: 1, phone: "254712345678", paymentMode: "MPESA", macAddress: "AA:BB:CC:DD:EE:FF", clientMac: "AA:BB:CC:DD:EE:FF", clientIp: "10.0.0.2" });
    expect(mockedApiFetch).toHaveBeenCalledWith("/hotspot/initiate", expect.objectContaining({ auth: "public", method: "POST" }));
    expect(result.success).toBe(true);
  });

  it("activates a voucher using the router-provided device context", async () => {
    mockedApiFetch.mockResolvedValueOnce({ status: 200, success: true, message: "Activated", data: { voucherCode: "ABCD1234", packageName: "Hotspot 1h" }, timestamp: "2026-09-29T00:00:00Z" } as never);
    const result = await activateVoucherAction({ voucherCode: "abcd1234", macAddress: "AA:BB:CC:DD:EE:FF", clientIp: "10.0.0.2", routerIdentity: "RTR-1" });
    expect(mockedApiFetch).toHaveBeenCalledWith("/hotspot/activate", expect.objectContaining({ auth: "public", method: "POST", body: expect.objectContaining({ voucherCode: "ABCD1234", macAddress: "AA:BB:CC:DD:EE:FF" }) }));
    expect(result.success).toBe(true);
  });

  it("checks reconnect state without staff authorization", async () => {
    mockedApiFetch.mockResolvedValueOnce({ status: 200, success: true, message: "OK", data: { hasActiveSession: true, message: "Connected", session: { sessionId: "HS-1" } }, timestamp: "2026-09-29T00:00:00Z" } as never);
    const result = await checkActiveSession("AA:BB:CC:DD:EE:FF", "10.0.0.2");
    expect(mockedApiFetch).toHaveBeenCalledWith("/hotspot/reconnect", expect.objectContaining({ auth: "public", method: "POST" }));
    expect(result.data?.hasActiveSession).toBe(true);
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
