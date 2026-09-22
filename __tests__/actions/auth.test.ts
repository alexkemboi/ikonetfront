import { describe, it, expect, vi, beforeEach } from "vitest";
import { server } from "@/mocks/server";
import { http, HttpResponse } from "msw";
import { API_PREFIX } from "@/mocks/handlers/auth-guard";
import {
  loginFixture,
  refreshTokenFixture,
  logoutFixture,
  accountTypeFixture,
  errorEnvelope,
} from "@/contracts/catalog";
import {
  loginAction,
  refreshAccessToken,
  logoutAction,
  determineAccountTypeAction,
  sysAdminLoginAction,
} from "@/actions/auth";

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

describe("determineAccountTypeAction", () => {
  it("POSTs /auth/account-type with username and password and returns accountType", async () => {
    server.use(
      http.post(`${API_PREFIX}/auth/account-type`, ({ request }) => {
        expect(request.headers.get("authorization")).toBeNull();
        return HttpResponse.json(accountTypeFixture({ accountType: "SYSADMIN" }), { status: 200 });
      })
    );

    const result = await determineAccountTypeAction("admin", "secret");
    expect(result.success).toBe(true);
    expect(result.data?.accountType).toBe("SYSADMIN");
  });

  it("returns INVALID when the backend reports it", async () => {
    server.use(
      http.post(`${API_PREFIX}/auth/account-type`, () =>
        HttpResponse.json(accountTypeFixture({ accountType: "INVALID" }), { status: 200 })
      )
    );

    const result = await determineAccountTypeAction("nobody", "secret");
    expect(result.success).toBe(true);
    expect(result.data?.accountType).toBe("INVALID");
  });

  it("surfaces backend errors", async () => {
    server.use(
      http.post(`${API_PREFIX}/auth/account-type`, () =>
        HttpResponse.json(errorEnvelope(400, "Bad request"), { status: 400 })
      )
    );

    const result = await determineAccountTypeAction("admin", "");
    expect(result.success).toBe(false);
    expect(result.status).toBe(400);
  });
});

describe("sysAdminLoginAction", () => {
  it("POSTs /auth/sysadminlogin and returns the JWT directly (OTP bypass)", async () => {
    server.use(
      http.post(`${API_PREFIX}/auth/sysadminlogin`, ({ request }) => {
        expect(request.headers.get("authorization")).toBeNull();
        return HttpResponse.json(
          {
            status: 200,
            success: true,
            message: "SysAdmin login successful",
            data: {
              username: "nicanornicolas",
              role: "SYSADMIN",
              token: "mock-sysadmin-jwt",
            },
            timestamp: "2026-08-26T00:00:00.000Z",
          },
          { status: 200 }
        );
      })
    );

    const result = await sysAdminLoginAction("nicanornicolas", "secret");
    expect(result.success).toBe(true);
    expect(result.data?.token).toBe("mock-sysadmin-jwt");
    expect(result.data?.username).toBe("nicanornicolas");
    expect(result.data?.role).toBe("SYSADMIN");
  });

  it("surfaces backend rejection for sysadmin login", async () => {
    server.use(
      http.post(`${API_PREFIX}/auth/sysadminlogin`, () =>
        HttpResponse.json(errorEnvelope(401, "Invalid username or password"), { status: 401 })
      )
    );

    const result = await sysAdminLoginAction("nobody", "wrong");
    expect(result.success).toBe(false);
    expect(result.status).toBe(401);
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