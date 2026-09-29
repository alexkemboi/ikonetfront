import { headers } from "next/headers";
import { getToken } from "next-auth/jwt";

/** Read the Auth.js encrypted session cookie only from a server request. */
export async function getBackendAccessToken(): Promise<string | null> {
  const requestHeaders = await headers();
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;

  const forwardedProtocol = requestHeaders.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const configuredUrl = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "";
  const secureCookie = configuredUrl.startsWith("https://") || forwardedProtocol === "https";
  const cookieNames = secureCookie
    ? ["__Secure-authjs.session-token", "authjs.session-token"]
    : ["authjs.session-token", "__Secure-authjs.session-token"];

  for (const cookieName of cookieNames) {
    const token = await getToken({
      req: { headers: requestHeaders },
      secret,
      cookieName,
      secureCookie: cookieName.startsWith("__Secure-"),
    });
    if (typeof token?.apiToken === "string") return token.apiToken;
  }
  return null;
}
