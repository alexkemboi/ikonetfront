"use server";

import { apiFetch } from "@/lib/apiClient";
import type { OmniSearchResponse } from "@/lib/types/search";

const EMPTY: OmniSearchResponse = { query: "", executionTimeMs: 0, results: [] };

/**
 * Omni-search server action — envelopes every failure to an empty response so
 * the Ctrl+K modal always degrades to an empty state, never an error crash.
 */
export async function searchOmni(
  query: string,
  limit = 20
): Promise<OmniSearchResponse> {
  const q = query.trim();
  if (!q) {
    return EMPTY;
  }
  const res = await apiFetch<OmniSearchResponse>(
    `/search?q=${encodeURIComponent(q)}&limit=${limit}`,
    { auth: "required", cache: "no-store" }
  );
  if (!res.success || !res.data) {
    return { ...EMPTY, query: q };
  }
  return res.data;
}