/**
 * lib/apiClient.ts — the single choke point for every backend call (D6).
 *
 * Centralizes what the 21+ action files historically copy-pasted:
 *   - URL normalization via `buildApiUrl`
 *   - auth header policy (explicit `public` / `required` / `optional`)
 *   - `ApiResponse<T>` envelope parse (incl. non-JSON/empty fallbacks)
 *   - typed `ApiError`s as envelopes (never throws across the wire boundary)
 *   - request timeout + idempotent-GET retry
 *   - Next.js `fetch` cache pass-through (`tags` / `revalidate`)
 *   - 401 → signout signal (the jwt() refresh flow in lib/auth.ts is the ONLY
 *     refresh entry point — Guardrail 1; this wrapper never refreshes itself)
 *
 * Usage:
 *   const res = await apiFetch<Customer[]>("/customers", {
 *     auth: "required", tags: ["customers"],
 *   });
 */
import { auth } from "@/lib/auth";
import { buildApiUrl } from "@/lib/constants";
import { withCompanyContext } from "@/lib/companyContext";
import type { ApiResponse } from "@/lib/types/api";

export type ApiAuthPolicy = "required" | "public" | "optional";

export interface ApiFetchOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  auth?: ApiAuthPolicy;
  /**
   * Explicit `Authorization` header value (e.g. `Bearer <oldJwt>` for refresh).
   * When provided, the session lookup is skipped entirely.
   */
  authorization?: string;
  /** Mirrors Next.js fetch `cache`. */
  cache?: RequestCache;
  /** Next.js fetch `next.tags`. */
  tags?: string[];
  /** Seconds; `0` = always fresh. */
  revalidate?: number | false;
  timeoutMs?: number;
  /** Extra retries (on top of the always-on idempotent GET retry). */
  retries?: number;
  /**
   * Step-up re-authentication token (Track 6). When present, forwarded as
   * `X-Step-Up-Token` so step-up-gated endpoints accept the mutation.
   */
  stepUpToken?: string;
  /** Additional request headers for endpoint-specific protocol values. */
  headers?: Record<string, string>;
}

type FetchNext = {
  tags?: string[];
  revalidate?: number | false;
};

function toNext(options: ApiFetchOptions): FetchNext {
  const next: FetchNext = {};
  if (options.tags && options.tags.length > 0) next.tags = options.tags;
  if (typeof options.revalidate === "number") next.revalidate = options.revalidate;
  return next;
}

function envelopeError<T>(
  status: number,
  message: string,
  data: T | null = null
): ApiResponse<T> {
  return { status, success: false, message, data, timestamp: new Date().toISOString() };
}

export async function apiFetch<T = unknown>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<ApiResponse<T>> {
  const {
    method = "GET",
    body,
    auth: authPolicy = "required",
    authorization,
    cache,
    revalidate,
    timeoutMs = 30_000,
    retries = 0,
    stepUpToken,
    headers: extraHeaders,
  } = options;

  const requestId = extraHeaders?.["X-Request-Id"] ?? crypto.randomUUID();
  function requestIdFromBody(value: unknown): string | undefined {
    if (!value || typeof value !== "object") return undefined;
    const data = (value as { data?: unknown }).data;
    if (!data || typeof data !== "object") return undefined;
    const requestId = (data as { requestId?: unknown }).requestId;
    return typeof requestId === "string" ? requestId : undefined;
  }
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...extraHeaders,
    "X-Request-Id": requestId,
  };

  if (stepUpToken) {
    headers["X-Step-Up-Token"] = stepUpToken;
  }

  if (authorization) {
    headers.Authorization = authorization;
  } else if (authPolicy !== "public") {
    const session = await auth();
    if (authPolicy === "required" && !session?.user?.apiToken) {
      return envelopeError<T>(401, "Not authenticated. Please sign in again.");
    }
    if (session?.user?.apiToken) {
      headers.Authorization = `Bearer ${session.user.apiToken}`;
    }
  }

  // R-16 / R-02: forward the SYSADMIN-selected tenant context (server-side
  // cookie → `X-Company-Context`) on every non-public call. Stripped for
  // `auth: "public"` requests (login/refresh/captive portal must never carry it).
  if (authPolicy !== "public") {
    await withCompanyContext(headers);
  }

  const next = toNext(options);
  const init: RequestInit = {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    ...(cache === "no-store" || revalidate === false ? { cache: "no-store" as const } : {}),
    ...(Object.keys(next).length > 0 && cache !== "no-store" && revalidate !== false ? { next } : {}),
  };

  const attempts = 1 + retries + (method === "GET" ? 1 : 0);
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(buildApiUrl(path), { ...init, signal: controller.signal });

      const contentType = res.headers.get("content-type") ?? "";
      let parsed: unknown = null;
      if (contentType.includes("application/json")) {
        parsed = await res.json().catch(() => null);
      }
      const responseRequestId = res.headers.get("X-Request-Id") ?? requestIdFromBody(parsed) ?? requestId;

      if (res.ok && parsed) {
        const api = parsed as ApiResponse<T>;
        return {
          status: api.status ?? res.status,
          success: api.success ?? true,
          message: api.message ?? "Request succeeded",
          data: (api.data as T) ?? null,
          timestamp: api.timestamp ?? new Date().toISOString(),
          requestId: responseRequestId,
        };
      }

      if (parsed && typeof parsed === "object") {
        const api = parsed as ApiResponse<T>;
        return {
          status: (api.status as number) ?? res.status,
          success: false,
          message: api.message ?? `Request failed (HTTP ${res.status})`,
          data: (api.data as T) ?? null,
          timestamp: api.timestamp ?? new Date().toISOString(),
          requestId: responseRequestId,
        };
      }

      return {
        ...envelopeError<T>(res.status, `Request failed (HTTP ${res.status})`),
        requestId: responseRequestId,
      };
    } catch (e) {
      lastError = e;
      // Abort (timeout) or network error — retry idempotent methods only.
      if (method !== "GET" || attempt === attempts - 1) break;
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    ...envelopeError<T>(
    500,
    lastError instanceof Error && lastError.name === "AbortError"
      ? "Request timed out. Please try again."
      : "Network error. Please try again."
    ),
    requestId,
  };
}

/** Convenience guard for 401 envelopes (drives the signout UI path). */
export function isUnauthorized<T>(res: ApiResponse<T>): boolean {
  return !res.success && res.status === 401;
}