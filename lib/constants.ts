"use strict";

export const API_VERSION = "v1";
const nodeEnv = process.env.NODE_ENV || "development";
const rawBaseUrl =
  process.env.BASE_API_URL ||
  (nodeEnv === "production"
    ? ""
    : "http://localhost:8381/api/v1/");
if (!rawBaseUrl) {
  throw new Error("BASE_API_URL is required in production.");
}
export const BASE_URL = rawBaseUrl.endsWith("/") ? rawBaseUrl : `${rawBaseUrl}/`;

/** Alias with an explicit name for the single backend URL authority. */
export const API_BASE = BASE_URL;

/**
 * Safely construct a backend URL without double-slash bugs.
 * BASE_URL keeps its trailing slash (existing ${BASE_URL}path call sites
 * depend on it); this helper normalizes only the site(s) we touch.
 */
export function buildApiUrl(path: string): string {
  const base = BASE_URL.replace(/\/+$/, "");
  const cleanPath = path.replace(/^\/+/, "");
  return `${base}/${cleanPath}`;
}