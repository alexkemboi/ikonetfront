export interface RegionRequest {
  regionCode: string;
  name: string;
  description?: string;
}

export interface RegionResponse {
  idxno: number;
  regionCode: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  locations?: LocationResponse[] | null;
}

export interface LocationRequest {
  regionIdxno: number;
  name: string;
  latitude?: number;
  longitude?: number;
}

export interface LocationResponse {
  idxno: number;
  regionIdxno: number;
  regionName: string;
  name: string;
  latitude?: number;
  longitude?: number;
  isActive: boolean;
  createdAt: string;
  stations?: StationResponse[];
}

export interface StationRequest {
  locationIdxno: number;
  name: string;
  powerType?: string;
  backhaulType?: string;
}

export interface StationResponse {
  idxno: number;
  locationIdxno: number;
  locationName: string;
  name: string;
  powerType: string;
  backhaulType: string;
  isActive: boolean;
  createdAt: string;
}

export interface RouterConnectionRequest {
  ipAddress: string;
  port: number;
  username: string;
  password?: string;
}

export interface RouterValidationResponse {
  identity: string;
  model: string;
  architecture: string;
  routerosVersion: string;
  serialNumber: string;
  cpu: string;
  cpuCount: string;
  totalMemory: string;
  freeMemory: string;
}

export interface RouterOnboardRequest {
  ipAddress: string;
  port: number;
  username: string;
  password?: string;
  stationIdxno: number;
  routerRole: string;
  pppoeEnabled: boolean;
  hotspotEnabled: boolean;
  monitoringEnabled: boolean;
  /** Optional operator-supplied asset code (e.g. "RTR-BDK-MSA-001"); backend derives when omitted. */
  routerName?: string;
  /** Optional company code (e.g. "BDK", "BSM"); backend defaults when omitted. */
  companyCode?: string;
}

export interface RouterHealthSnapshot {
  idxno: number;
  routerId: number;
  cpuUsage: number;
  totalMemory: number;
  freeMemory: number;
  /** Null when the board has no temperature sensor. */
  temperature?: number | null;
  activePppoeSessions: number;
  activeHotspotSessions: number;
  uptime: string;
  latencyMs: number;
  createdAt: string;
  /** False when the router did not answer that collection; the readings are then zero. */
  reachable?: boolean;
  packetLossPct?: number | null;
  totalDisk?: number | null;
  freeDisk?: number | null;
  routerOsVersion?: string | null;
  /** Sum over the router's WAN interfaces; null on routers without the "ibs-wan" list. */
  wanRxBps?: number | null;
  wanTxBps?: number | null;
}

export type RouterSeriesRange = "1h" | "24h" | "7d" | "30d";

/** One bucket of `GET /network/monitoring/router/{id}/series`; a null value means no reading in it. */
export interface RouterSeriesPoint {
  at: string;
  cpuPct: number | null;
  memoryPct: number | null;
  diskPct: number | null;
  latencyMs: number | null;
  packetLossPct: number | null;
  wanRxBps: number | null;
  wanTxBps: number | null;
  pppoeSessions: number | null;
  hotspotSessions: number | null;
}

export interface RouterSeries {
  range: RouterSeriesRange;
  bucketSeconds: number;
  points: RouterSeriesPoint[];
}

/** `GET /network/monitoring/router/{id}/reachability`. Hours with no row at all are simply absent (no data). */
export interface RouterReachability {
  days: number;
  uptimePct: number | null;
  incidentCount: number;
  downtimeSeconds: number;
  hours: { at: string; status: "UP" | "PARTIAL" | "DOWN" }[];
  incidents: { startedAt: string; recoveredAt: string | null; durationSeconds: number; ongoing: boolean }[];
}

/** `GET /network/monitoring/router/{id}/interfaces` — read live from RouterOS. */
export interface RouterLiveInterface {
  name: string;
  type: string | null;
  comment: string | null;
  macAddress: string | null;
  running: boolean;
  disabled: boolean;
  lastLinkUpTime: string | null;
  rxBytes: number | null;
  txBytes: number | null;
  /** Current rate from a one-second monitor-traffic sample (running interfaces only). */
  rxBitsPerSecond: number | null;
  txBitsPerSecond: number | null;
}

export interface RouterLivePppoeSession {
  username: string | null;
  address: string | null;
  callerId: string | null;
  service: string | null;
  uptime: string | null;
  /** Billing customer owning this PPPoE username, when one exists. */
  customerId: number | null;
  customerName: string | null;
  customerPhone: string | null;
}

export interface RouterLiveHotspotSession {
  username: string | null;
  address: string | null;
  macAddress: string | null;
  uptime: string | null;
  loginBy: string | null;
  bytesIn: number | null;
  bytesOut: number | null;
}

/** `GET /network/monitoring/router/{id}/sessions` — who is online right now. */
export interface RouterLiveSessions {
  pppoe: RouterLivePppoeSession[];
  hotspot: RouterLiveHotspotSession[];
}

/**
 * SSE live-telemetry contract.
 *
 * `GET /api/v1/network/monitoring/router/{id}/live` (text/event-stream,
 * Bearer, SYSADMIN/ADMIN/01) emits a named `telemetry` event whose data is a
 * `RouterHealthSnapshot` JSON object and whose `id` is the snapshot `idxno`
 * (the consumer dedupes frames on it). A `: ping` comment arrives every 15s to
 * keep intermediaries from closing the stream. The NOC monitor relays this
 * through `app/api/monitoring/router/[id]/live` and falls back to `/latest` +
 * `/history` polling whenever the EventSource errors; a reconnected stream
 * restarts from the backend's latest snapshot rather than replaying frames
 * missed while disconnected.
 */

export interface RouterCapacityResponse {
  id: number;
  name: string;
  ipAddress: string;
  currentSessions: number;
  maxSessions: number;
  cpuUsage: number;
  loadFactor: number;
  healthStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL';
}

export interface SubscriberProvisioningRequest {
  customerId: string;
  subscriptionId: string;
  stationIdxno: number;
  pppoeUsername: string;
  pppoePassword?: string;
}

export interface RouterResponse {
  id: number;
  name: string;
  ipAddress: string;
  model: string;
  status: boolean;
  stationIdxno?: number;
  stationName?: string;
  locationIdxno?: number;
  locationName?: string;
  regionIdxno?: number;
  regionName?: string;
  routerRole?: string;
  pppoeEnabled?: boolean;
  hotspotEnabled?: boolean;
  monitoringEnabled?: boolean;
  createdAt?: string;
}