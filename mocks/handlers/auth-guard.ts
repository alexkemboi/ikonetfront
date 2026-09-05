import { HttpResponse } from "msw";
import { errorEnvelope } from "@/contracts/catalog";

/**
 * Contract-fidelity guard: every Bearer-only route returns 401 when the
 * Authorization header is missing/malformed — mirroring the backend's
 * `JwtAuthenticationEntryPoint`.
 *
 * Role enforcement (3rd trap): when a route passes `adminRoles`, a Bearer
 * JWT whose payload carries a non-admin role gets a 403 — mirroring the
 * backend's SYSADMIN/ADMIN/01 gates. Opaque tokens (e.g. the legacy
 * `mock-valid-bearer-token` used across unit tests) have no decodable role
 * and fall back to presence-only so existing tests keep passing.
 */
export const ADMIN_ROLES = [
  "SYSADMIN",
  "ROLE_SYSADMIN",
  "ADMIN",
  "ROLE_ADMIN",
  "ROLE_LEGACY_ADMIN",
  "01",
] as const;

export type AllowedRoles = readonly string[];

/** Decode the `role` claim from a JWT payload. Returns null for opaque tokens. */
export function decodeRoleFromToken(token: string): string | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;
  const payloadB64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  try {
    const payloadStr =
      typeof atob === "function"
        ? atob(payloadB64)
        : Buffer.from(payloadB64, "base64").toString("utf8");
    const payload = JSON.parse(payloadStr) as { role?: unknown };
    return typeof payload.role === "string" && payload.role.trim() !== ""
      ? payload.role.toUpperCase()
      : null;
  } catch {
    return null;
  }
}

export function requireAuth(request: Request, allowedRoles?: AllowedRoles): Response | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return HttpResponse.json(errorEnvelope(401, "Unauthorized"), { status: 401 });
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const role = decodeRoleFromToken(authHeader.slice("Bearer ".length));
    // Opaque token (no decodable role) → presence-only, same as today.
    if (role !== null && !allowedRoles.includes(role)) {
      return HttpResponse.json(
        errorEnvelope(403, "Forbidden: Insufficient role permissions"),
        { status: 403 }
      );
    }
  }

  return null;
}

export const API_PREFIX = "http://localhost:8381/api/v1";