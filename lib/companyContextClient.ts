/**
 * lib/companyContextClient.ts — client-safe tenant-context cookie helpers (R-16).
 *
 * The `ibs_company_context` cookie is client-set (non-httpOnly) and read
 * server-side by `lib/companyContext.ts`. This module must NOT import
 * `next/headers` so it can be used by client components and Redux slices.
 */

export const COMPANY_CONTEXT_COOKIE = "ibs_company_context";

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

/** Read the current context cookie (null when unset or "ALL"/union). */
export function readContextCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${COMPANY_CONTEXT_COOKIE}=([^;]*)`));
  if (!match) return null;
  const value = decodeURIComponent(match[1]);
  return value && value.toUpperCase() !== "ALL" ? value : null;
}

/** Persist (or clear, with `code === null`) the context cookie. */
export function writeContextCookie(code: string | null): void {
  if (typeof document === "undefined") return;
  if (code && code.toUpperCase() !== "ALL") {
    document.cookie = `${COMPANY_CONTEXT_COOKIE}=${encodeURIComponent(code.trim())}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
  } else {
    document.cookie = `${COMPANY_CONTEXT_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
  }
}

/** Remove the context cookie (logout, non-SYSADMIN login). */
export function clearCompanyContextCookie(): void {
  writeContextCookie(null);
}