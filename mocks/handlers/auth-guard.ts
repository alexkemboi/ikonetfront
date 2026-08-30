import { HttpResponse } from "msw";
import { errorEnvelope } from "@/contracts/catalog";

/**
 * Contract-fidelity guard: every Bearer-only route returns 401 when the
 * Authorization header is missing/malformed — mirroring the backend's
 * `JwtAuthenticationEntryPoint`.
 */
export function requireAuth(request: Request): Response | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return HttpResponse.json(errorEnvelope(401, "Unauthorized"), { status: 401 });
  }
  return null;
}

export const API_PREFIX = "http://localhost:8381/api/v1";