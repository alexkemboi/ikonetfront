import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { authMock, withCompanyContextMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  withCompanyContextMock: vi.fn(async (headers: Record<string, string>) => headers),
}));

vi.mock("@/lib/auth", () => ({ auth: authMock }));
vi.mock("@/lib/constants", () => ({ buildApiUrl: (path: string) => `https://api.test${path}` }));
vi.mock("@/lib/companyContext", () => ({ withCompanyContext: withCompanyContextMock }));

import { apiFetch } from "@/lib/apiClient";

describe("apiFetch response handling", () => {
  beforeEach(() => {
    authMock.mockResolvedValue({ user: { apiToken: "session-token" } });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("treats an empty 204 response as a successful mutation", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 204 })));

    const response = await apiFetch<null>("/system-users/3", { method: "DELETE" });

    expect(response).toMatchObject({ success: true, status: 204, data: null });
  });

  it("promotes stable nested backend error codes to the response envelope", async () => {
    const body = {
      status: 409,
      success: false,
      message: "Username already exists",
      data: { code: "USERNAME_ALREADY_EXISTS", requestId: "req-123" },
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(body), {
          status: 409,
          headers: { "Content-Type": "application/json" },
        })
      )
    );

    const response = await apiFetch("/system-users", { method: "POST", body: {} });

    expect(response).toMatchObject({
      success: false,
      status: 409,
      code: "USERNAME_ALREADY_EXISTS",
      requestId: "req-123",
    });
  });
});
