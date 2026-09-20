import { describe, it, expect, vi } from "vitest";

describe("companies actions", () => {
  beforeEach(() => {
    vi.resetModules();
    global.fetch = vi.fn();
  });

  it("listCompanies returns empty array when no token", async () => {
    vi.doMock("@/lib/auth", () => ({
      auth: vi.fn().mockResolvedValue({ user: { apiToken: null } }),
    }));

    const { listCompanies } = await import("@/actions/companies");
    const result = await listCompanies();
    expect(result).toEqual([]);
  });

  it("listCompanies returns empty array on 403", async () => {
    vi.doMock("@/lib/auth", () => ({
      auth: vi.fn().mockResolvedValue({ user: { apiToken: "token" } }),
    }));

    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 403,
    });

    const { listCompanies } = await import("@/actions/companies");
    const result = await listCompanies();
    expect(result).toEqual([]);
  });

  it("getCompanyPaymentAccounts calls correct endpoint", async () => {
    vi.doMock("@/lib/auth", () => ({
      auth: vi.fn().mockResolvedValue({ user: { apiToken: "token" } }),
    }));

    (global.fetch as any).mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      json: vi.fn().mockResolvedValue({ success: true, data: [] }),
    });

    const { getCompanyPaymentAccounts } = await import("@/actions/companies");
    const result = await getCompanyPaymentAccounts("CMP-BSM-001");
    expect(result.success).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/companies/CMP-BSM-001/payment-accounts"),
      expect.objectContaining({ method: "GET" })
    );
  });

  it("updateCompanyBranding calls correct endpoint", async () => {
    vi.doMock("@/lib/auth", () => ({
      auth: vi.fn().mockResolvedValue({ user: { apiToken: "token" } }),
    }));

    (global.fetch as any).mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      json: vi.fn().mockResolvedValue({ success: true, data: { code: "CMP-BSM-001" } }),
    });

    const { updateCompanyBranding } = await import("@/actions/companies");
    const result = await updateCompanyBranding("CMP-BSM-001", { primaryColor: "#ff0000" });
    expect(result.success).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/companies/CMP-BSM-001/branding"),
      expect.objectContaining({ method: "PUT" })
    );
  });

  it("testCompanyPaymentAccount calls correct endpoint", async () => {
    vi.doMock("@/lib/auth", () => ({
      auth: vi.fn().mockResolvedValue({ user: { apiToken: "token" } }),
    }));

    (global.fetch as any).mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      json: vi.fn().mockResolvedValue({ success: true, data: { ok: true, message: "OK", latencyMs: 100 } }),
    });

    const { testCompanyPaymentAccount } = await import("@/actions/companies");
    const result = await testCompanyPaymentAccount("CMP-BSM-001");
    expect(result.success).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/companies/CMP-BSM-001/payment-accounts/test"),
      expect.objectContaining({ method: "POST" })
    );
  });
});
