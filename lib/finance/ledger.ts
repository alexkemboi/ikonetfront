import type { AccountPosting } from "@/lib/types/finance";

/**
 * Unwrap `data.content` | `content` | `data` | bare array into a posting list.
 * Shared by every consumer of `GET /finance/transactions` so the envelope
 * handling never drifts between callers.
 */
export function unwrapPostings(json: unknown): AccountPosting[] {
  if (typeof json !== "object" || json === null) return [];
  const body = json as Record<string, unknown>;
  const data = body.data;
  const content =
    (typeof data === "object" && data !== null
      ? (data as Record<string, unknown>).content
      : undefined) ??
    body.content ??
    data ??
    json;
  return Array.isArray(content) ? (content as AccountPosting[]) : [];
}

/**
 * 30s abort signal for server-side ledger fetches so a slow backend cannot
 * hold a force-dynamic SSR render open indefinitely. Returns `undefined`
 * where `AbortSignal.timeout` is unavailable (some test environments).
 */
export function timeoutSignal(ms = 30_000): AbortSignal | undefined {
  return typeof AbortSignal?.timeout === "function"
    ? AbortSignal.timeout(ms)
    : undefined;
}
