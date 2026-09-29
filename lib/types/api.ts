/**
 * Canonical response envelope + page types shared across every module.
 * Mirrors the backend `ApiResponse<T>` / Spring `Page<T>` shapes exactly.
 * Module-specific type files alias/extend these instead of redeclaring them.
 */

export interface ApiResponse<T = unknown> {
  status: number;
  success: boolean;
  message: string;
  data: T | null;
  timestamp?: string;
  requestId?: string;
}

export interface Sort {
  unsorted: boolean;
  sorted: boolean;
  empty: boolean;
}

export interface Pageable {
  pageNumber: number;
  pageSize: number;
  sort: Sort;
  offset: number;
  unpaged: boolean;
  paged: boolean;
}

export interface PageResponse<T> {
  content: T[];
  pageable: Pageable;
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
  numberOfElements: number;
  size: number;
  number: number;
  sort: Sort;
  empty: boolean;
}

/**
 * `NetPackageResponse` DTO returned by the public captive-portal endpoint
 * `GET /api/v1/hotspot/packages` (`HotspotPublicController`; BE-AAA-042 now
 * shipped — the `/system/packages/active` beacon is an aliased public source).
 */
export interface NetPackage {
  idxno: number;
  packageName: string;
  price: string;
  packageCategory?: string;
  validityType?: string;
  validityValue?: number;
  bandwidthType?: string;
  activeStatus: boolean;
  speedDownload?: number;
  speedUpload?: number;
  rateLimit?: string;
  maxDevices?: number;
}

/**
 * Live IP pool utilization returned by `GET /api/v1/network/ip-pools`.
 */
export interface IpPool {
  poolName: string;
  subnet: string;
  gateway: string | null;
  totalIps: number;
  usedIps: number;
  availableIps: number;
  utilizationPercentage: number;
  serviceType: string;
  poolId: number;
  rawUsedIps: number;
  overCapacity: boolean;
  probeStatus: "OK" | "FAILED" | "NO_DEVICE" | "INVALID_SUBNET";
  stale: boolean;
  probeError: "ROUTER_UNREACHABLE" | "ROUTER_AUTH_FAILED" | "PROBE_FAILED" | "USAGE_QUERY_FAILED" | "POOL_NOT_LINKED" | "NO_NAS_SCOPE" | "INVALID_SUBNET" | null;
  lastProbedAt: string | null;
  usageSource: "MIKROTIK_DHCP_LEASES" | "RADIUS_ACTIVE_SESSIONS" | "WIREGUARD_PEERS";
}

/**
 * `IpMappingResponse` DTO returned by `GET /api/v1/network/ip-mappings`.
 * A Page envelope (`ApiResponse<Page<IpMappingResponse>>`) drives the
 * live-sessions + subscriber hubs server-side.
 */
export interface IpMappingResponse {
  ipAddress: string;
  macAddress: string;
  username: string;
  serviceType: string;
  stationName: string;
  routerName: string;
  status: "ONLINE" | "EXPIRED";
  lastSeen: string;
  subscriberPhone?: string;
  mpesaReceipt?: string;
  voucher?: string;
  expiresAt?: string;
  nasIp?: string;
  bytesIn?: number;
  bytesOut?: number;
}