import { describe, it, expect, vi, beforeEach } from "vitest";
import { server } from "@/mocks/server";
import { http, HttpResponse } from "msw";
import { API_PREFIX } from "@/mocks/handlers/auth-guard";
import {
  loginFixture,
  refreshTokenFixture,
  logoutFixture,
  errorEnvelope,
} from "@/contracts/catalog";
import { loginAction, refreshAccessToken, logoutAction } from "@/actions/auth";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("loginAction", () => {
  it("POSTs /auth/userlogin WITHOUT an Authorization header on this public route", async () => {
    server.use(
      http.post(`${API_PREFIX}/auth/userlogin`, ({ request }) => {
        expect(request.headers.get("authorization")).toBeNull();
        return HttpResponse.json(loginFixture(), { status: 200 });
      })
    );

    const result = await loginAction({ username: "admin", password: "secret" });
    expect(result.success).toBe(true);
    expect(result.data?.token).toBe(loginFixture().data?.token);
    expect(result.data?.role).toBe("SYSADMIN");
  });
});

describe("refreshAccessToken", () => {
  it("POSTs /auth/refresh-token with Bearer old JWT and parses { token }", async () => {
    server.use(
      http.post(`${API_PREFIX}/auth/refresh-token`, ({ request }) => {
        expect(request.headers.get("authorization")).toBe("Bearer expired-jwt");
        return HttpResponse.json(refreshTokenFixture(), { status: 200 });
      })
    );

    const result = await refreshAccessToken("expired-jwt");
    expect(result).toEqual({ token: refreshTokenFixture().data?.token });
  });

  it("returns null when the backend rejects the token (401)", async () => {
    server.use(
      http.post(`${API_PREFIX}/auth/refresh-token`, () =>
        HttpResponse.json(errorEnvelope(401, "Token expired"), { status: 401 })
      )
    );

    expect(await refreshAccessToken("expired-jwt")).toBeNull();
  });
});

describe("logoutAction", () => {
  it("POSTs /auth/logout with Bearer token and resolves without error", async () => {
    server.use(
      http.post(`${API_PREFIX}/auth/logout`, ({ request }) => {
        expect(request.headers.get("authorization")).toBe("Bearer mock-valid-bearer-token");
        return HttpResponse.json(logoutFixture(), { status: 200 });
      })
    );

    await expect(logoutAction("mock-valid-bearer-token")).resolves.toBeUndefined();
  });
});