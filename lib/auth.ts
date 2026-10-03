import NextAuth from "next-auth";
import type { Session, User } from "next-auth";
import type { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import { jwtVerify, decodeJwt } from "jose";
import { JwtPayload, LoginResponse } from "@/lib/types/auth";
import { buildApiUrl } from "@/lib/constants";
import { refreshAccessToken } from "@/actions/auth";
import { getBackendAccessToken } from "@/lib/authToken";
import { attachServerOnlyApiToken, sanitizeClientSession } from "@/lib/authSession";

function getJwtSecret(): string {
  const secret = process.env.AUTH_JWT_SECRET;
  if (!secret) throw new Error("AUTH_JWT_SECRET environment variable is not set.");
  return secret;
}

async function parseBackendJwt(token: string, secret: string): Promise<JwtPayload | null> {
  try {
    const secretKey = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, secretKey, { algorithms: ["HS256"] });
    return payload as unknown as JwtPayload;
  } catch (verifyError) {
    // Fail-safe fallback: decode the payload for local claim extraction ONLY
    // outside production. In production an invalid signature must NOT be
    // treated as valid — that would bypass JWT authentication.
    if (process.env.NODE_ENV !== "production") {
      try {
        const decoded = decodeJwt(token);
        return decoded as unknown as JwtPayload;
      } catch (decodeError) {
        console.error("[Auth] Token decoding failed completely:", decodeError);
        return null;
      }
    }
    console.error("[Auth] JWT signature verification failed:", verifyError);
    return null;
  }
}

/** Read the backend JWT `exp` claim (seconds → ms). Never a security control. */
function tokenExpiryMs(token: string): number | null {
  try {
    const payload = decodeJwt(token);
    if (typeof payload?.exp === "number") return payload.exp * 1000;
  } catch {
    // Ignore malformed tokens — caller falls back to a default window.
  }
  return null;
}

/**
 * Single-flight refresh locks (Guardrail 1) keyed by the exact JWT being
 * refreshed — one Next.js render fans out 4–6 parallel Server Components/Actions
 * that all await the SAME refresh, while a different session's token refresh is
 * never conflated with another user's. `apiClient`'s 401 branch never calls
 * refresh directly — this is the only refresh entry.
 */
const refreshLocks = new Map<string, Promise<string | null>>();

export async function getValidAccessToken(currentJwt: string): Promise<string | null> {
  const inFlight = refreshLocks.get(currentJwt);
  if (inFlight) return inFlight;
  const promise = (async () => {
    try {
      const r = await refreshAccessToken(currentJwt);
      return r?.token ?? null;
    } finally {
      refreshLocks.delete(currentJwt);
    }
  })();
  refreshLocks.set(currentJwt, promise);
  return promise;
}

/**
 * Proactive refresh window. The backend refuses to refresh an already-expired
 * token, so this is the only chance to rotate it. Kept well below the access
 * JWT TTL (8h) so several heartbeats can retry before expiry.
 */
const REFRESH_THRESHOLD_MS = 30 * 60_000;

export const authCallbacks = {
  async jwt({ token, user }: { token: JWT; user?: User }) {
    if (user) {
      return {
        ...token,
        userId: user.userId,
        username: user.username,
        email: user.email,
        role: user.role,
        fname: user.fname,
        middleName: user.middleName,
        otherName: user.otherName,
        phoneNumber: user.phoneNumber,
        apiToken: user.apiToken ?? "",
        refreshToken: user.refreshToken,
        expiresAt: user.expiresAt,
        regionId: user.regionId,
        stationId: user.stationId,
        locationId: user.locationId,
        investorScope: user.investorScope,
        companyScope: user.companyScope,
      };
    }

    // Prefer the stored expiry; fall back to decoding the real `exp` claim when
    // it is missing/non-numeric (e.g. sessions seeded before the field existed).
    const expiresAt =
      typeof token.expiresAt === "number" && token.expiresAt > 0
        ? token.expiresAt
        : tokenExpiryMs(String(token.apiToken)) ?? 0;

    if (token.apiToken && expiresAt > 0 && Date.now() >= expiresAt - REFRESH_THRESHOLD_MS) {
      const newToken = await getValidAccessToken(String(token.apiToken));
      if (newToken) {
        return {
          ...token,
          apiToken: newToken,
          expiresAt: tokenExpiryMs(newToken) ?? Date.now() + 2 * 60 * 60 * 1000,
          error: undefined,
        };
      }
      // Keep a still-valid token alive without surfacing an error: a transient
      // refresh failure must not log out an active NOC session. The next
      // heartbeat retries; only an actually-expired token forces a re-login.
      if (Date.now() < expiresAt) {
        return token;
      }
      // Existing middleware/SessionGuard path handles the signout flow.
      return { ...token, error: "RefreshAccessTokenError" };
    }

    return token;
  },
  async session({ session, token }: { session: Session; token: JWT }) {
    session.user = {
      ...session.user,
      id: token.sub || "",
      userId: token.userId as string | undefined,
      username: token.username as string,
      email: token.email as string,
      role: token.role as string,
      fname: token.fname as string,
      middleName: token.middleName as string | undefined,
      otherName: token.otherName as string | undefined,
      phoneNumber: token.phoneNumber as string | undefined,
      expiresAt: token.expiresAt as number | undefined,
      regionId: token.regionId as number | undefined,
      stationId: token.stationId as number | undefined,
      locationId: token.locationId as number | undefined,
      investorScope: token.investorScope as string | undefined,
      companyScope: token.companyScope as string | undefined,
    };
    // Propagate the refresh failure so proxy.ts, SessionGuard and app/page.tsx
    // can act on it (they already check `session.error`).
    session.error = token.error;
    return sanitizeClientSession(session);
  },
};

const { handlers, auth: nextAuth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        // Sysadmin direct-login bypass (OTP temporarily disabled).
        // The client calls /auth/sysadminlogin directly, receives a JWT, and
        // forwards it here as `sysadminToken`. We skip the normal userlogin
        // call and build the session from the verified token.
        if (credentials.password === "sysadmin-otp-verified") {
          const sysadminToken = (credentials as Record<string, unknown>).sysadminToken as string | undefined;
          if (!sysadminToken) return null;

          const decoded = await parseBackendJwt(sysadminToken, getJwtSecret());
          if (!decoded) return null;

          const fname = typeof decoded?.fname === "string" ? decoded.fname : String(credentials.username);

          return {
            id: decoded?.userId || decoded?.sub || String(credentials.username),
            userId: decoded?.userId,
            username: String(credentials.username),
            email: typeof decoded?.email === "string" ? decoded.email : "",
            role: typeof decoded?.role === "string" ? decoded.role : "SYSADMIN",
            fname,
            middleName: typeof decoded?.middleName === "string" ? decoded.middleName : undefined,
            otherName: typeof decoded?.otherName === "string" ? decoded.otherName : undefined,
            phoneNumber: typeof decoded?.phoneNumber === "string" ? decoded.phoneNumber : undefined,
            apiToken: sysadminToken,
            refreshToken: undefined,
            expiresAt: tokenExpiryMs(sysadminToken) ?? Date.now() + 2 * 60 * 60 * 1000,
            regionId: typeof decoded?.regionId === "number" ? decoded.regionId : undefined,
            stationId: typeof decoded?.stationId === "number" ? decoded.stationId : undefined,
            locationId: typeof decoded?.locationId === "number" ? decoded.locationId : undefined,
            investorScope: typeof decoded?.investorScope === "string" ? decoded.investorScope : undefined,
            companyScope: typeof decoded?.companyScope === "string" ? decoded.companyScope : undefined,
          };
        }

        try {
          const res = await fetch(buildApiUrl("/auth/userlogin"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: credentials.username,
              password: credentials.password,
            }),
            cache: "no-store",
          });

          if (!res.ok) {
            console.warn(`[Auth] Backend login rejected with status ${res.status}`);
            return null;
          }

          const loginRes: LoginResponse = await res.json();
          if (!loginRes.success || !loginRes.data?.token) return null;

          const token = loginRes.data.token;
          const decoded = await parseBackendJwt(token, getJwtSecret());
          const rawRole = loginRes.data.role || decoded?.role;
          if (!rawRole) return null;

          return {
            id: decoded?.userId || decoded?.sub || loginRes.data.username,
            userId: decoded?.userId,
            username: loginRes.data.username,
            email: decoded?.email || "",
            role: rawRole,
            fname: decoded?.fname || loginRes.data.username,
            middleName: decoded?.middleName,
            otherName: decoded?.otherName,
            phoneNumber: decoded?.phoneNumber,
            apiToken: token,
            refreshToken: loginRes.data.refreshToken,
            expiresAt: tokenExpiryMs(token) ?? Date.now() + 2 * 60 * 60 * 1000,
            regionId: decoded?.regionId,
            stationId: decoded?.stationId,
            locationId: decoded?.locationId,
            investorScope: decoded?.investorScope,
            companyScope: decoded?.companyScope ?? decoded?.companyId,
          };
        } catch (error) {
          console.error("[Auth] Authorize exception:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: authCallbacks,
  pages: { signIn: "/login", error: "/login" },
  session: { strategy: "jwt" },
});

export { handlers, signIn, signOut };
export const authMiddleware = nextAuth;

/** Server-side session access with backend credentials read from the HttpOnly cookie. */
export async function auth() {
  const session = await nextAuth();
  if (!session?.user) return session;
  const apiToken = await getBackendAccessToken();
  return apiToken ? attachServerOnlyApiToken(session, apiToken) : session;
}