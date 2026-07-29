import { describe, it, expect, vi, beforeEach } from "vitest";
import { refreshAccessToken, logoutAction } from "@/actions/auth";

const BASE_URL = process.env.BASE_API_URL || "http://localhost:8381/api/v1/";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("refreshAccessToken", () => {
  it("returns RefreshTokenResponse on success", async () => {
    const mockResponse = {
      access_token: "new-access-token",
      refresh_token: "new-refresh-token",
      expires_in: 3600,
    };

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const result = await refreshAccessToken("old-refresh-token");

    expect(fetch).toHaveBeenCalledWith(`${BASE_URL}auth/refresh-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: "old-refresh-token" }),
    });
    expect(result).toEqual(mockResponse);
    expect(result?.access_token).toBe("new-access-token");
    expect(result?.expires_in).toBe(3600);
  });

  it("returns null on non-ok response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 401 })
    );

    const result = await refreshAccessToken("expired-refresh-token");
    expect(result).toBeNull();
  });
});

describe("logoutAction", () => {
  it("sends POST to /auth/logout with Bearer token and resolves without error", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 200 })
    );

    const token = "mock-valid-bearer-token";
    await logoutAction(token);

    expect(fetchSpy).toHaveBeenCalledWith(`${BASE_URL}auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
  });
});