/**
 * lib/companyContext.ts — server-side tenant-context resolution (R-16).
 *
 * The SYSADMIN tenant switcher persists a client-set, non-httpOnly cookie
 * (`ibs_company_context`). Server actions/components read it here and forward
 * it as `X-Company-Context` on every non-public backend call so RLS scopes
 * the request. A value of `ALL` (or an absent/empty cookie) means "union
 * across companies" — no header is sent.
 *
 * This module is SERVER-ONLY: it imports `next/headers`. It must never be
 * imported from a client component.
 */
import { cookies } from "next/headers";
import { COMPANY_CONTEXT_COOKIE } from "@/lib/companyContextClient";

export { COMPANY_CONTEXT_COOKIE } from "@/lib/companyContextClient";

/**
 * Resolve the active company context code.
 * An explicit `explicitScope` (threaded as a function argument) wins when
 * provided; otherwise the request cookie is used.
 *
 * @returns the company code, or `null` when the caller wants the union.
 */
export async function resolveCompanyContextCode(
  explicitScope?: string | null
): Promise<string | null> {
  const fromExplicit =
    explicitScope && explicitScope.trim() !== "" && explicitScope.toUpperCase() !== "ALL"
      ? explicitScope.trim()
      : null;
  if (fromExplicit) return fromExplicit;

  try {
    const store = await cookies();
    const value = store.get(COMPANY_CONTEXT_COOKIE)?.value;
    if (value && value.trim() !== "" && value.toUpperCase() !== "ALL") {
      return value.trim();
    }
  } catch {
    // cookies() is unavailable outside request scope (build/static render).
    // Treat as "no context" — fail closed to the JWT company scope.
  }
  return null;
}

/**
 * Merge the resolved company context into an outbound backend request's
 * headers. Returns the same headers object with `X-Company-Context` added when
 * a company code is active.
 */
export async function withCompanyContext(
  headers: Record<string, string>,
  explicitScope?: string | null
): Promise<Record<string, string>> {
  const code = await resolveCompanyContextCode(explicitScope);
  if (code) {
    headers["X-Company-Context"] = code;
  }
  return headers;
}