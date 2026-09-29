import { describe, expect, it } from "vitest";
import { attachServerOnlyApiToken, sanitizeClientSession } from "@/lib/authSession";

const backendToken = "backend-secret-jwt";

describe("sanitizeClientSession", () => {
  it("removes backend credentials before sessions reach browser clients", () => {
    const session = {
      expires: "2026-10-29T10:53:37.390Z",
      user: {
        id: "user-1",
        name: "Operator",
        email: "operator@example.test",
        role: "SYSADMIN",
        apiToken: backendToken,
        refreshToken: "refresh-secret",
      },
    } as never;

    const safeSession = sanitizeClientSession(session);
    expect(safeSession.user).not.toHaveProperty("apiToken");
    expect(safeSession.user).not.toHaveProperty("refreshToken");
    expect(JSON.stringify(safeSession)).not.toContain(backendToken);
    expect(safeSession.user.role).toBe("SYSADMIN");
  });

  it("keeps server credentials readable but non-enumerable for streamed HTML serialization", () => {
    const session = {
      expires: "2026-10-29T10:53:37.390Z",
      user: { id: "user-1", name: "Operator", role: "SYSADMIN", fname: "Operator", username: "operator" },
    } as never;
    const serverSession = attachServerOnlyApiToken(session, backendToken);

    expect(serverSession.user.apiToken).toBe(backendToken);
    expect(Object.keys(serverSession.user)).not.toContain("apiToken");
    expect(JSON.stringify(serverSession)).not.toContain(backendToken);
  });
});
