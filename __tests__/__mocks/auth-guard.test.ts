import { describe, it, expect } from "vitest";
import {
  API_PREFIX,
  ADMIN_ROLES,
  decodeRoleFromToken,
  requireAuth,
} from "@/mocks/handlers/auth-guard";
import { buildRoleJwt } from "@/contracts/catalog";

function requestFor(token: string | null): Request {
  const headers: Record<string, string> = {};
  if (token !== null) headers.Authorization = `Bearer ${token}`;
  return new Request(`${API_PREFIX}/network/ip-pools`, { method: "GET", headers });
}

describe("decodeRoleFromToken", () => {
  it("decodes the role claim from a role-coded mock JWT", () => {
    expect(decodeRoleFromToken(buildRoleJwt("STAFF"))).toBe("STAFF");
    expect(decodeRoleFromToken(buildRoleJwt("SYSADMIN"))).toBe("SYSADMIN");
  });

  it("returns null for opaque/legacy tokens (no decodable JWT payload)", () => {
    expect(decodeRoleFromToken("mock-valid-bearer-token")).toBeNull();
    expect(decodeRoleFromToken("plain-string")).toBeNull();
  });
});

describe("requireAuth role gating (mock RBAC parity)", () => {
  it("rejects missing/malformed Authorization headers with 401", () => {
    const missing = requireAuth(requestFor(null));
    expect(missing?.status).toBe(401);

    const malformed = requireAuth(
      new Request(`${API_PREFIX}/network/ip-pools`, {
        headers: { Authorization: "Token abc" },
      })
    );
    expect(malformed?.status).toBe(401);
  });

  it("passes opaque tokens through role-gated routes (presence-only fallback)", () => {
    const res = requireAuth(requestFor("mock-valid-bearer-token"), ADMIN_ROLES);
    expect(res).toBeNull();
  });

  it("allows an admin-role JWT on an admin-gated route", () => {
    const res = requireAuth(requestFor(buildRoleJwt("SYSADMIN")), ADMIN_ROLES);
    expect(res).toBeNull();

    const admin01 = requireAuth(requestFor(buildRoleJwt("01")), ADMIN_ROLES);
    expect(admin01).toBeNull();
  });

  it("returns 403 for a STAFF JWT on an admin-gated route", () => {
    const res = requireAuth(requestFor(buildRoleJwt("STAFF")), ADMIN_ROLES);
    expect(res?.status).toBe(403);
  });
});

describe("MSW end-to-end role enforcement", () => {
  it("GET /network/ip-pools blocks STAFF while SYSADMIN passes", async () => {
    const staffRes = await fetch(`${API_PREFIX}/network/ip-pools`, {
      headers: { Authorization: `Bearer ${buildRoleJwt("STAFF")}` },
    });
    expect(staffRes.status).toBe(403);

    const adminRes = await fetch(`${API_PREFIX}/network/ip-pools`, {
      headers: { Authorization: `Bearer ${buildRoleJwt("SYSADMIN")}` },
    });
    expect(adminRes.status).toBe(200);
  });

  it("staff JWT still reaches any-authed monitoring routes", async () => {
    const res = await fetch(`${API_PREFIX}/network/monitoring/router/1/history`, {
      headers: { Authorization: `Bearer ${buildRoleJwt("STAFF")}` },
    });
    expect(res.status).toBe(200);
  });
});