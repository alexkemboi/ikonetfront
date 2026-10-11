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

/**
 * `GET /network/outages` — a confirmed outage: the router failed 4 health checks in a
 * row (about 2 minutes) and the outage ends after 2 good checks in a row.
 */
export interface RouterOutage {
  id: string;
  routerId: number;
  routerName: string | null;
  /** `network_device.id` linked to the router: the id hotspot sessions carry. */
  networkDeviceId: number | null;
  stationId: string | null;
  companyId: string | null;
  status: "OPEN" | "CLOSED";
  startedAt: string;
  resolvedAt: string | null;
  durationSeconds: number;
  /** POWER_LOSS: the router restarted. LINK_LOSS: it stayed on, the connection to it was lost. */
  cause: "POWER_LOSS" | "LINK_LOSS" | "UNKNOWN";
  routerRestarted: boolean | null;
  detectedBy: string | null;
  reason: string | null;
  /** PENDING until decided; APPLIED = sessions got the lost time back. */
  creditStatus: "PENDING" | "APPLIED" | "NOT_ELIGIBLE" | "REFUSED";
  creditedSessions: number;
  creditedMinutes: number;
  /** Phone numbers the outage SMS was queued for; null when none was sent. */
  outageSmsCount: number | null;
  closedBy: string | null;
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
// ── Router operations page (`/network/routers/{id}`) ──

/** `GET /network/routers/{id}/overview` — figures read from the database, no router call. */
export interface RouterOverview {
  router: {
    routerId: number;
    /** network_device.id: the id revenue, tunnels and the login page key on. */
    deviceId: number | null;
    name: string;
    model: string | null;
    routerOsVersion: string | null;
    /** Absent in the investor view. */
    ipAddress?: string | null;
    vpnIp?: string | null;
    uptime: string | null;
    /** A telemetry reading in the last 3 minutes decides; with none, the device health check the routers list shows. */
    online: boolean;
    /** Which check `online` comes from. Absent on backends older than this field. */
    statusSource?: "TELEMETRY" | "HEALTH_CHECK" | "NONE";
    /** Why there is no recent telemetry reading; null when there is one. */
    telemetryNote?: string | null;
    lastSeenAt: string | null;
    companyId: string | null;
    stationName: string | null;
    hotspotEnabled: boolean | null;
    pppoeEnabled: boolean | null;
  };
  figures: {
    activePppoe: number | null;
    activeHotspot: number | null;
    activeUsers: number | null;
    /** Distinct logins seen on this router in the last `registeredUsersDays` days. */
    registeredUsers: number;
    registeredUsersDays: number;
    dataThisMonthBytes: number;
    revenueThisMonth: number;
    revenueDaily: { day: string; amount: number }[];
    uptime30dPct: number | null;
    currency: string;
  };
  health: RouterHealthScore;
}

export interface RouterHealthScore {
  /** null with band UNKNOWN: the router is online but has no recent readings to score. */
  score: number | null;
  band: "GOOD" | "FAIR" | "POOR" | "UNKNOWN";
  cpuPct: number | null;
  memoryPct: number | null;
  diskPct: number | null;
  latencyMs: number | null;
  packetLossPct: number | null;
  uptime24hPct: number | null;
  /** Why points were taken off; empty when the score is 100. */
  deductions: { reading: string; value: string; points: number }[];
}

export interface RouterPayment {
  occurredAt: string;
  amount: number;
  serviceType: string | null;
  memo: string | null;
  customerId: number | null;
  packageId: number | null;
}

export interface RouterLogEntry {
  time: string | null;
  topics: string | null;
  message: string | null;
}

export interface RouterScheduleItem {
  name: string | null;
  startDate: string | null;
  startTime: string | null;
  interval: string | null;
  nextRun: string | null;
  runCount: string | null;
  disabled: boolean;
  /** SYSADMIN only; null for everyone else. */
  onEvent: string | null;
}

export interface RouterScriptItem {
  name: string | null;
  owner: string | null;
  lastStarted: string | null;
  runCount: string | null;
  /** SYSADMIN only; null for everyone else. */
  source: string | null;
}

export interface RouterBackupFile {
  name: string;
  sizeBytes: number | null;
  createdAt: string | null;
}

export interface RouterIpService {
  name: string | null;
  port: string | null;
  address: string | null;
  disabled: boolean;
}

export type LoginPageStatus = "CURRENT" | "OUTDATED" | "MISSING" | "NO_HOTSPOT" | "UNKNOWN";

export interface RouterHotspotSettings {
  servers: {
    name: string | null;
    interface: string | null;
    profile: string | null;
    addressPool: string | null;
    addressesPerMac: string | null;
    disabled: boolean;
  }[];
  idleTimeout: string | null;
  keepaliveTimeout: string | null;
  sharedUsers: string | null;
  idleTimeoutOptions: string[];
  keepaliveTimeoutOptions: string[];
  loginPage: {
    status: LoginPageStatus;
    htmlDirectory: string | null;
    path?: string | null;
    expectedBytes: number | null;
    actualBytes?: number | null;
  };
}

/** `GET /network/routers/{id}/connection` — never carries a secret. */
export interface RouterConnectionInfo {
  apiHost: string | null;
  apiUsername: string | null;
  apiPort: number | null;
  hasApiPassword: boolean;
  radiusServer: string | null;
  hasRadiusSecret: boolean;
  deviceId: number | null;
  remoteAccessEnabled: boolean;
  winboxEndpoint: string | null;
  webConsoleUrl: string | null;
  tunnelExpiresAt: string | null;
  tunnelAuthorizedIp: string | null;
  /** True for SYSADMIN: the reveal button is shown. */
  canRevealSecrets: boolean;
}

export interface RouterSecrets {
  apiUsername: string | null;
  apiPassword: string | null;
  radiusSecret: string | null;
}
