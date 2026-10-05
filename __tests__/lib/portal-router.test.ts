import { describe, expect, it, vi, beforeEach } from "vitest";
import { apiFetch } from "@/lib/apiClient";
import { parsePortalRouter, withPortalRouter } from "@/lib/hotspot/portalRouter";
import { activateVoucherAction, getHotspotPortalContextAction, getPublicHotspotPackagesAction } from "@/actions/hotspot";

vi.mock("@/lib/apiClient", () => ({ apiFetch: vi.fn() }));
const mockedApiFetch = vi.mocked(apiFetch);
beforeEach(() => { vi.clearAllMocks(); });

const rid = "3f2a1b4c-0000-4000-8000-123456789abc";
const sig = "q83vEjRWeJq83vEjRWeJq83vEjRWeJq83vEjRWeJq8M";

describe("signed router id", () => {
  it("accepts only a well-formed id with a signature", () => {
    expect(parsePortalRouter(rid, sig)).toEqual({ rid, sig });
    expect(parsePortalRouter(rid, "")).toBeNull();
    expect(parsePortalRouter("RTR-BDK-A", sig)).toBeNull();
    expect(parsePortalRouter(undefined, undefined)).toBeNull();
  });

  it("is added to backend paths, and leaves them unchanged when absent", () => {
    expect(withPortalRouter("/hotspot/initiate", { rid, sig })).toBe(`/hotspot/initiate?rid=${rid}&sig=${sig}`);
    expect(withPortalRouter("/hotspot/packages?serviceType=HOTSPOT", { rid, sig })).toBe(`/hotspot/packages?serviceType=HOTSPOT&rid=${rid}&sig=${sig}`);
    expect(withPortalRouter("/hotspot/initiate", null)).toBe("/hotspot/initiate");
  });

  it("scopes the package list and voucher activation to the signed router, uncached", async () => {
    mockedApiFetch.mockResolvedValue({ status: 200, success: true, message: "OK", data: [], timestamp: "" } as never);
    await getPublicHotspotPackagesAction({ portalRouter: { rid, sig } });
    expect(mockedApiFetch).toHaveBeenCalledWith(`/hotspot/packages?serviceType=HOTSPOT&rid=${rid}&sig=${sig}`, expect.objectContaining({ auth: "public", cache: "no-store" }));
    await activateVoucherAction({ voucherCode: "abcd1234", portalRouter: { rid, sig } });
    expect(mockedApiFetch).toHaveBeenLastCalledWith(`/hotspot/vouchers/activate?rid=${rid}&sig=${sig}`, expect.objectContaining({ method: "POST" }));
  });

  it("returns the company of the router, or null when the backend cannot resolve one", async () => {
    mockedApiFetch.mockResolvedValueOnce({ status: 200, success: true, message: "OK", data: { companyCode: "CMP-NEW-001", companyName: "New ISP", routerVerified: true }, timestamp: "" } as never);
    expect((await getHotspotPortalContextAction({ portalRouter: { rid, sig } }))?.companyName).toBe("New ISP");
    expect(mockedApiFetch).toHaveBeenCalledWith(`/hotspot/branding/portal-context?rid=${rid}&sig=${sig}`, expect.objectContaining({ auth: "public" }));
    mockedApiFetch.mockResolvedValueOnce({ status: 404, success: false, message: "Unknown hotspot", data: null, timestamp: "" } as never);
    expect(await getHotspotPortalContextAction({ company: "CMP-XXX-001" })).toBeNull();
  });
});
