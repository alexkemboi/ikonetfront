"use strict";

export const API_VERSION = "v1";
const rawBaseUrl = process.env.BASE_API_URL || "/api/v1/";

export const BASE_URL = rawBaseUrl
  ? rawBaseUrl.endsWith("/")
    ? rawBaseUrl
    : `${rawBaseUrl}/`
  : "/api/v1/";

/** Alias with an explicit name for the single backend URL authority. */
export const API_BASE = BASE_URL;

/**
 * Safely construct a backend URL without double-slash bugs.
 * If BASE_API_URL is not configured, we fall back to the in-app API prefix
 * rather than throwing during module import in production builds.
 */
export function buildApiUrl(path: string): string {
  if (!path) return BASE_URL;
  if (/^https?:\/\//i.test(path)) return path;

  const base = BASE_URL.replace(/\/+$/, "");
  const cleanPath = path.replace(/^\/+/, "");
  return cleanPath ? `${base}/${cleanPath}` : base;
}

/** Resolve a backend-provided link without duplicating an existing /api/v1 prefix. */
export function resolveApiLink(link: string): string {
  if (/^https?:\/\//i.test(link)) return link;
  const base = BASE_URL.replace(/\/+$/, "");
  const clean = `/${link.replace(/^\/+/, "")}`;
  let basePath = base;
  let origin = "";
  try {
    const parsed = new URL(base);
    origin = parsed.origin;
    basePath = parsed.pathname.replace(/\/+$/, "");
  } catch {
    basePath = base;
  }
  if (basePath && (clean === basePath || clean.startsWith(`${basePath}/`))) return `${origin}${clean}`;
  return buildApiUrl(clean);
}