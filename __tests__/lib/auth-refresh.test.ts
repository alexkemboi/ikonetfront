import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next-auth", () => ({
  default: vi.fn(() => ({
    handlers: {},
    auth: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
  })),
}));

vi.mock("@/actions/auth", () => ({
  refreshAccessToken: vi.fn(),
}));

// vitest.setup.ts globally mocks @/lib/auth; this suite exercises the real
// callbacks, so opt back into the module implementation.
vi.unmock("@/lib/auth");

import type { JWT } from "next-auth/jwt";
import type { Session } from "next-auth";
import { refreshAccessToken } from "@/actions/auth";
import { authCallbacks } from "@/lib/auth";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

/** Build a structurally-decodable JWT with a real `exp` claim (no signature). */
function jwtWithExp(expMs: number): string {
  const b64 = (value: object) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${b64({ alg: "HS256", typ: "JWT" })}.${b64({
    exp: Math.floor(expMs / 1000),
  })}.mock-signature`;
}

function baseToken(overrides: Partial<JWT> = {}): JWT {
  return {
    sub: "user-1",
    username: "operator",
    email: "operator@example.test",
    role: "SYSADMIN",
    fname: "Operator",
    apiToken: "",
    ...overrides,
  } as JWT;
}

beforeEach(() => {
  vi.mocked(refreshAccessToken).mockReset();
});

describe("authCallbacks.jwt — first sign-in", () => {
  it("seeds the session from the user on first sign-in (keeps the `if (user)` branch)", async () => {
    const result = await authCallbacks.jwt({
      token: baseToken(),
      user: {
        id: "user-1",
        username: "operator",
        email: "operator@example.test",
        role: "SYSADMIN",
        fname: "Operator",
        apiToken: "login-token",
        expiresAt: Date.now() + 24 * HOUR,
      },
    });

    expect(result.apiToken).toBe("login-token");
    expect(result.role).toBe("SYSADMIN");
    expect(refreshAccessToken).not.toHaveBeenCalled();
  });
});

describe("authCallbacks.jwt — proactive refresh", () => {
  it("refreshes when the token is within the 30-minute window", async () => {
    const oldToken = jwtWithExp(Date.now() + 20 * MINUTE);
    const newToken = jwtWithExp(Date.now() + 24 * HOUR);
    vi.mocked(refreshAccessToken).mockResolvedValue({ token: newToken });

    const result = await authCallbacks.jwt({
      token: baseToken({ apiToken: oldToken, expiresAt: Date.now() + 20 * MINUTE }),
    });

    expect(refreshAccessToken).toHaveBeenCalledWith(oldToken);
    expect(result.apiToken).toBe(newToken);
    expect(result.error).toBeUndefined();
  });

  it("derives expiresAt from the apiToken exp when token.expiresAt is missing", async () => {
    const oldToken = jwtWithExp(Date.now() + 20 * MINUTE);
    const newToken = jwtWithExp(Date.now() + 24 * HOUR);
    vi.mocked(refreshAccessToken).mockResolvedValue({ token: newToken });

    const result = await authCallbacks.jwt({
      token: baseToken({ apiToken: oldToken }),
    });

    expect(refreshAccessToken).toHaveBeenCalledWith(oldToken);
    expect(result.apiToken).toBe(newToken);
  });

  it("does not refresh when the token is far from expiry", async () => {
    const farToken = jwtWithExp(Date.now() + 7 * HOUR);

    const result = await authCallbacks.jwt({
      token: baseToken({ apiToken: farToken, expiresAt: Date.now() + 7 * HOUR }),
    });

    expect(refreshAccessToken).not.toHaveBeenCalled();
    expect(result.apiToken).toBe(farToken);
    expect(result.error).toBeUndefined();
  });

  it("does not set an error while the token is still valid when refresh fails", async () => {
    const oldToken = jwtWithExp(Date.now() + 20 * MINUTE);
    vi.mocked(refreshAccessToken).mockResolvedValue(null);

    const result = await authCallbacks.jwt({
      token: baseToken({ apiToken: oldToken, expiresAt: Date.now() + 20 * MINUTE }),
    });

    expect(refreshAccessToken).toHaveBeenCalledWith(oldToken);
    expect(result.error).toBeUndefined();
    expect(result.apiToken).toBe(oldToken);
  });

  it("sets RefreshAccessTokenError only once the token is expired", async () => {
    const expiredToken = jwtWithExp(Date.now() - 5 * MINUTE);
    vi.mocked(refreshAccessToken).mockResolvedValue(null);

    const result = await authCallbacks.jwt({
      token: baseToken({ apiToken: expiredToken, expiresAt: Date.now() - 5 * MINUTE }),
    });

    expect(result.error).toBe("RefreshAccessTokenError");
    expect(result.apiToken).toBe(expiredToken);
  });

  it("clears a previous error when a refresh succeeds", async () => {
    const oldToken = jwtWithExp(Date.now() + 20 * MINUTE);
    const newToken = jwtWithExp(Date.now() + 24 * HOUR);
    vi.mocked(refreshAccessToken).mockResolvedValue({ token: newToken });

    const result = await authCallbacks.jwt({
      token: baseToken({
        apiToken: oldToken,
        expiresAt: Date.now() + 20 * MINUTE,
        error: "RefreshAccessTokenError",
      }),
    });

    expect(result.error).toBeUndefined();
    expect(result.apiToken).toBe(newToken);
  });
});

describe("authCallbacks.session — error propagation", () => {
  it("propagates the refresh error onto the session", async () => {
    const session = {
      user: { name: "Operator" },
      expires: new Date(Date.now() + HOUR).toISOString(),
    } as unknown as Session;

    const result = await authCallbacks.session({
      session,
      token: baseToken({ error: "RefreshAccessTokenError" }),
    });

    expect(result.error).toBe("RefreshAccessTokenError");
  });

  it("leaves session.error undefined on a healthy token", async () => {
    const session = {
      user: { name: "Operator" },
      expires: new Date(Date.now() + HOUR).toISOString(),
    } as unknown as Session;

    const result = await authCallbacks.session({ session, token: baseToken() });

    expect(result.error).toBeUndefined();
  });

  it("still strips backend credentials before the session reaches the client", async () => {
    const session = {
      user: { name: "Operator" },
      expires: new Date(Date.now() + HOUR).toISOString(),
    } as unknown as Session;

    const result = await authCallbacks.session({
      session,
      token: baseToken({ apiToken: "backend-secret" }),
    });

    expect(result.user).not.toHaveProperty("apiToken");
    expect(JSON.stringify(result)).not.toContain("backend-secret");
  });
});
