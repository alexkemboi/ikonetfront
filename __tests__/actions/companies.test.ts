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

    vi.mocked(global.fetch).mockResolvedValue(new Response(null, { status: 403 }));

    const { listCompanies } = await import("@/actions/companies");
    const result = await listCompanies();
    expect(result).toEqual([]);
  });

  it("getCompanyPaymentAccounts calls correct endpoint", async () => {
    vi.doMock("@/lib/auth", () => ({
      auth: vi.fn().mockResolvedValue({ user: { apiToken: "token" } }),
    }));

    vi.mocked(global.fetch).mockResolvedValue(new Response(
      JSON.stringify({ success: true, data: [] }),
      { status: 200, headers: { "content-type": "application/json" } }
    ));

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

    vi.mocked(global.fetch).mockResolvedValue(new Response(
      JSON.stringify({ success: true, data: { code: "CMP-BSM-001" } }),
      { status: 200, headers: { "content-type": "application/json" } }
    ));

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

    vi.mocked(global.fetch).mockResolvedValue(new Response(
      JSON.stringify({ success: true, data: { ok: true, message: "OK", latencyMs: 100 } }),
      { status: 200, headers: { "content-type": "application/json" } }
    ));

    const { testCompanyPaymentAccount } = await import("@/actions/companies");
    const result = await testCompanyPaymentAccount("CMP-BSM-001");
    expect(result.success).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/companies/CMP-BSM-001/payment-accounts/test"),
      expect.objectContaining({ method: "POST" })
    );
  });
});
