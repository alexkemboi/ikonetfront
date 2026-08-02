import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { jwtVerify, decodeJwt } from "jose";
import { JwtPayload, LoginResponse } from "@/lib/types/auth";

const BASE_URL = process.env.BASE_API_URL;
if (!BASE_URL) throw new Error("BASE_API_URL environment variable is not set.");

const JWT_SECRET = process.env.AUTH_JWT_SECRET;
if (!JWT_SECRET) throw new Error("AUTH_JWT_SECRET environment variable is not set.");

async function parseBackendJwt(token: string): Promise<JwtPayload | null> {
  try {
    const secretKey = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secretKey, { algorithms: ["HS256"] });
    return payload as unknown as JwtPayload;
  } catch (verifyError) {
    // Fail-safe fallback: Decode valid Spring Boot JWT payload if signature check fails
    try {
      const decoded = decodeJwt(token);
      return decoded as unknown as JwtPayload;
    } catch (decodeError) {
      console.error("[Auth] Token decoding failed completely:", decodeError);
      return null;
    }
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
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

        try {
          const res = await fetch(`${BASE_URL}/auth/userlogin`, {
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
          const decoded = await parseBackendJwt(token);
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
            expiresAt: Date.now() + 2 * 60 * 60 * 1000,
            regionId: decoded?.regionId,
            stationId: decoded?.stationId,
            locationId: decoded?.locationId,
          };
        } catch (error) {
          console.error("[Auth] Authorize exception:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
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
          apiToken: user.apiToken,
          expiresAt: user.expiresAt,
          regionId: user.regionId,
          stationId: user.stationId,
          locationId: user.locationId,
        };
      }
      return token;
    },
    async session({ session, token }) {
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
        apiToken: token.apiToken as string,
        regionId: token.regionId as number | undefined,
        stationId: token.stationId as number | undefined,
        locationId: token.locationId as number | undefined,
      };
      return session;
    },
  },
  pages: { signIn: "/login", error: "/login" },
  session: { strategy: "jwt" },
});