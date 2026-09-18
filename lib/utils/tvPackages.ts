import type { NetPackage } from "@/lib/types/api";
import type { TvPackage } from "@/lib/types/tv";

/**
 * Map a backend `NetPackage` (category TV) to the UI `TvPackage` shape used by
 * the captive-portal picker. `validity` and `dataAllowance` are derived from the
 * package validity/bandwidth fields; raw packages are never shipped un-mapped.
 *
 * Kept OUT of `"use server"` action files on purpose: it is a pure synchronous
 * function imported by both server actions and tests, and Next.js requires every
 * export of a "use server" module to be an async server action.
 */
export function mapToTvPackage(net: NetPackage): TvPackage {
  const value = net.validityValue ?? 1;
  const rawType = (net.validityType ?? "day").toLowerCase();
  const singular = rawType.endsWith("s") ? rawType.slice(0, -1) : rawType;
  const validity = `${value} ${singular}${value === 1 ? "" : "s"}`;
  const unlimited = net.bandwidthType?.toUpperCase() === "UNLIMITED";
  return {
    idxno: net.idxno,
    packageName: net.packageName,
    price: net.price,
    validity,
    speedDownload: net.speedDownload ?? 0,
    speedUpload: net.speedUpload ?? 0,
    maxDevices: net.maxDevices ?? 1,
    dataAllowance: unlimited ? "Unlimited" : net.rateLimit || "Unlimited",
  };
}