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
