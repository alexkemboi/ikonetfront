/**
 * Normalize a router row's online state across the multiple shapes the backend
 * can produce: string `status` ("ONLINE"/"ACTIVE"/whatever), boolean `status`,
 * and/or a boolean `online` flag (from the network-device API).
 *
 * Used by the routers table badge + KPI pills. Kept OUT of `"use server"`
 * action files because Next.js forbids synchronous exports there; this is a
 * pure client/SSR-friendly utility.
 */
export function isRouterOnline(
  r?: { status?: unknown; online?: unknown } | null
): boolean {
  if (!r) return false;
  const status = r.status;
  const online = r.online;
  return (
    status === true ||
    status === "ONLINE" ||
    status === "ACTIVE" ||
    status === "Active" ||
    status === "active" ||
    online === true
  );
}