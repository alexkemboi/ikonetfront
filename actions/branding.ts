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

/** What the sign-in page shows once an organisation is recognised. */
export type OrganisationMatch = { code: string; name: string; logoUrl: string | null };

/**
 * Resolve the organisation typed on the sign-in page: a company code
 * (`CMP-BDK-001`) or the short name the company was set up under (its
 * subdomain, e.g. `bedak`). Returns null when no active company matches.
 *
 * The public branding endpoint resolves by host or by exact code only, so the
 * short name is looked up as the subdomain label of a placeholder host.
 */
export async function resolveOrganisationAction(input: string): Promise<OrganisationMatch | null> {
  const value = input.trim();
  if (!value || value.length > 63) return null;

  // "localhost" resolves to no tenant, so only the code is matched here.
  let branding = await getPublicBranding({ host: "localhost", company: value.toUpperCase() });
  if (!branding && /^[a-z0-9-]+$/i.test(value)) {
    branding = await getPublicBranding({ host: `${value.toLowerCase()}.organisation.lookup` });
  }
  return branding
    ? { code: branding.code, name: branding.name, logoUrl: branding.logoUrl ?? null }
    : null;
}
