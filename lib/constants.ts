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