"use server";

import { apiFetch } from "@/lib/apiClient";
import type { TenantBranding } from "@/lib/types/company";

/**
 * Track 2 — resolve the public brand tokens for the requesting tenant.
 *
 * Uses `auth: "public"` so the request carries NO `X-Company-Context` header:
 * branding belongs to the subdomain/company-of-the-page, not the session.
 * Unknown tenants 404 → we return `null` and the shell renders the default
 * Beesmart theme.
 */
export async function getPublicBranding(opts?: {
  host?: string;
  company?: string;
}): Promise<TenantBranding | null> {
  const params = new URLSearchParams();
  if (opts?.host) params.set("host", opts.host);
  if (opts?.company) params.set("company", opts.company);
  const query = params.toString();

  const res = await apiFetch<TenantBranding>(
    query ? `/public/branding?${query}` : "/public/branding",
    { auth: "public", cache: "no-store" }
  );

  if (!res.success || !res.data) return null;
  return res.data;
}