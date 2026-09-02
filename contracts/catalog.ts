/**
 * contracts/catalog.ts — the single source of truth for the Wave-1 contract
 * surface (D5).
 *
 * Every fixture here is shaped EXACTLY like the verified backend DTOs (§0.1):
 * - `ApiResponse<T>` envelope `{ status, success, message, data, timestamp }`
 * - Spring `Page<T>` envelope inside `data` where the backend paginates
 * - Real status codes (e.g. `POST /hotspot/initiate` → **201**)
 * - Real DTO fields (e.g. `IpMappingResponse` has `username/serviceType/status`)
 *
 * MSW handlers (mocks/handlers) and Pact specs (__tests__/pact) BOTH import
 * from here — update this file once and both stay in sync.
 */
import type {
  ApiResponse,
  IpMappingResponse,
  IpPool,
  NetPackage,
  PageResponse,
} from "@/lib/types/api";
import type { HotspotSessionResponse } from "@/lib/types/hotspot";
import type { Customer } from "@/lib/types/customer";
import type {
  RouterHealthSnapshot,
  RouterValidationResponse,
  RouterResponse,
} from "@/lib/types/network";
import type { TopologyNode } from "@/lib/types/network-router";
import type { MikrotikDeviceStatus } from "@/lib/types/mikrotik";

/** Mock/embedded stage backend authority (mirrors vitest.setup.ts). */
export const apiBaseUrl = "http://localhost:8381/api/v1/";

export type AuthPosture = "public" | "bearer";

export interface Interaction {
  /** Human-readable description, used as the Pact `uponReceiving`. */
  name: string;
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  path: string;
  query?: Record<string, string>;
  auth: AuthPosture;
  requestBody?: unknown;
  status: number;
  responseBody: unknown;
}

export function envelope<T>(data: T, message: string, status = 200): ApiResponse<T> {
  return { status, success: true, message, data, timestamp: "2026-08-26T00:00:00.000Z" };
}

export function errorEnvelope(status: number, message: string): ApiResponse<null> {
  return { status, success: false, message, data: null, timestamp: "2026-08-26T00:00:00.000Z" };
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export interface LoginFixtureData {
  token: string;
  username: string;
  role: string;
  refreshToken?: string;
}

export function loginFixture(overrides: Partial<LoginFixtureData> = {}): ApiResponse<LoginFixtureData> {
  return envelope(
    {
      token: "eyJhbGciOiJIUzI1NiJ9.verified-login-token",
      username: "admin",
      role: "SYSADMIN",
      refreshToken: "login-time-refresh-token",
      ...overrides,
    },
    "Login successful"
  );
}

export function refreshTokenFixture(): ApiResponse<{ token: string }> {
  return envelope({ token: "eyJhbGciOiJIUzI1NiJ9.refreshed-access-token" }, "Token refreshed");
}

export function logoutFixture(): ApiResponse<{ message: string }> {
  return envelope({ message: "Logged out successfully" }, "Logged out successfully");
}

// ── Public hotspot ───────────────────────────────────────────────────────────

export function activePackagesFixture(): ApiResponse<NetPackage[]> {
  return envelope(
    [
      {
        idxno: 1,
        packageName: "Home Hotspot 10Mbps",
        price: 1500,
        packageCategory: "HOTSPOT",
        validityType: "MONTHLY",
        validityValue: 30,
        bandwidthType: "SHARED",
        activeStatus: true,
        speedDownload: 10,
        speedUpload: 5,
        rateLimit: "10M/5M",
      },
      {
        idxno: 2,
        packageName: "PPPoE Unlimited 8M",
        price: 2000,
        packageCategory: "PPPOE",
        validityType: "MONTHLY",
        validityValue: 30,
        bandwidthType: "DEDICATED",
        activeStatus: true,
        speedDownload: 8,
        speedUpload: 8,
        rateLimit: "8M/8M",
      },
    ],
    "Active packages retrieved successfully"
  );
}

export function initiatePaymentFixture(): ApiResponse<HotspotSessionResponse> {
  return envelope(
    {
      sessionId: "HS-20260826-001",
      macAddress: "32:A2:F1:9C:4D:02",
      clientPhone: "0726837210",
      payerPhone: "0726837210",
      packageName: "Home Hotspot 10Mbps",
      amountPaid: 1500,
      sessionStatus: "ACTIVE",
      startedAt: "2026-08-26T08:00:00+03:00",
      expiresAt: "2026-09-25T08:00:00+03:00",
      minutesRemaining: 43140,
      mpesaReference: "QDD7X9Y2A1",
      voucherCode: "",
      concurrentUserLimit: 1,
      durationSeconds: 2592000,
      dataUploadedBytes: 0,
      dataDownloadedBytes: 0,
      ipAddress: "172.16.0.11",
    },
    "Hotspot session initiated successfully"
  );
}

export function reconnectFixture(): ApiResponse<{
  hasActiveSession: boolean;
  message: string;
  session: HotspotSessionResponse | null;
}> {
  return envelope(
    {
      hasActiveSession: true,
      message: "Active session found",
      session: {
        sessionId: "HS-20260826-001",
        macAddress: "32:A2:F1:9C:4D:02",
        clientPhone: "0726837210",
        payerPhone: "0726837210",
        packageName: "Home Hotspot 10Mbps",
        amountPaid: 1500,
        sessionStatus: "ACTIVE",
        startedAt: "2026-08-26T08:00:00+03:00",
        expiresAt: "2026-09-25T08:00:00+03:00",
        minutesRemaining: 43140,
        mpesaReference: "QDD7X9Y2A1",
        voucherCode: "",
        concurrentUserLimit: 1,
        durationSeconds: 2592000,
        dataUploadedBytes: 0,
        dataDownloadedBytes: 0,
        ipAddress: "172.16.0.11",
      },
    },
    "Reconnect state resolved"
  );
}

// ── Customer ─────────────────────────────────────────────────────────────────

export function customerFixture(overrides: Partial<Customer> = {}): Customer {
  return {
    userIdxno: 1,
    username: "A2085",
    firstname: "Grace",
    lname: "Wanjiru",
    fullName: "Grace Wanjiru",
    email: "gwanjiru@gmail.com",
    phoneNumber: "0703247179",
    role: "CUSTOMER",
    isActive: true,
    canLogin: true,
    createdAt: "2026-01-12T10:00:00+03:00",
    subscriberIdxno: 2085,
    acno: "ACC-2085",
    packageName: "Home Hotspot 10Mbps",
    custtype: "HOTSPOT",
    isSubActive: true,
    startDate: "2026-07-26T00:00:00+03:00",
    expiryDate: "2026-08-26T23:59:59+03:00",
    lastActiveDate: "2026-08-25T18:00:00+03:00",
    ...overrides,
  };
}

export function customersPageFixture(
  size = 2,
  totalElements = 2
): ApiResponse<PageResponse<Customer>> {
  return envelope({
    content: [
      customerFixture(),
      customerFixture({ userIdxno: 2, username: "A3112", fullName: "Joseph Mwangi", firstname: "Joseph", lname: "Mwangi", phoneNumber: "0712884551", email: "jmwangi@outlook.com", subscriberIdxno: 3112, acno: "ACC-3112", packageName: "Hotspot Daily 4Mbps", custtype: "HOTSPOT", expiryDate: "2026-08-22T23:59:59+03:00" }),
    ],
    pageable: {
      pageNumber: 0,
      pageSize: size,
      sort: { unsorted: false, sorted: true, empty: false },
      offset: 0,
      unpaged: false,
      paged: true,
    },
    totalElements,
    totalPages: Math.ceil(totalElements / size),
    last: true,
    first: true,
    numberOfElements: size,
    size,
    number: 0,
    sort: { unsorted: false, sorted: true, empty: false },
    empty: false,
  }, "Customers fetched successfully");
}

export function customerByIdFixture(): ApiResponse<Customer> {
  return envelope(customerFixture(), "Customer fetched successfully");
}

// ── Network ──────────────────────────────────────────────────────────────────

export function routersFixture(): ApiResponse<RouterResponse[]> {
  return envelope(
    [
      {
        id: 1,
        name: "ADRNOLDNETWORKS",
        ipAddress: "192.168.1.1",
        model: "RouterOS RB5009UG+S+",
        status: true,
        stationIdxno: 1,
        stationName: "ADRNOLDNETWORKS",
        locationName: "Ukunda",
        regionName: "Coast",
        routerRole: "CORE",
        pppoeEnabled: true,
        hotspotEnabled: true,
        monitoringEnabled: true,
        createdAt: "2026-01-01T00:00:00+03:00",
      },
      {
        id: 2,
        name: "Adrinold Ukunda",
        ipAddress: "10.10.0.2",
        model: "RouterOS RB5009UG+S+",
        status: true,
        stationIdxno: 2,
        stationName: "Adrinold Ukunda",
        locationName: "Ukunda",
        regionName: "Coast",
        routerRole: "AGGREGATION",
        pppoeEnabled: true,
        hotspotEnabled: true,
        monitoringEnabled: true,
        createdAt: "2026-01-02T00:00:00+03:00",
      },
    ],
    "Routers fetched successfully"
  );
}

export function validateConnectivityFixture(): ApiResponse<RouterValidationResponse> {
  return envelope(
    {
      identity: "ADRNOLDNETWORKS",
      model: "RouterOS RB5009UG+S+",
      architecture: "arm64",
      routerosVersion: "7.15.2",
      serialNumber: "SN-2026-0001",
      cpu: "ARM",
      cpuCount: "4",
      totalMemory: "1024MB",
      freeMemory: "512MB",
    },
    "Hardware connectivity validated"
  );
}

export function onboardFixture(): ApiResponse<{
  routerId: number;
  identity: string;
  script: string;
  status: string;
}> {
  return envelope(
    {
      routerId: 3,
      identity: "ADRNOLDNETWORKS",
      script: "/interface bridge add name=bridge-local;",
      status: "ONBOARDED",
    },
    "Router onboarded successfully"
  );
}

export function topologyFixture(): ApiResponse<TopologyNode[]> {
  return envelope(
    [
      {
        id: 1,
        name: "ADRNOLDNETWORKS",
        ipAddress: "192.168.1.1",
        nodeStatus: "ACTIVE",
        children: [
          {
            id: 2,
            name: "Adrinold Ukunda",
            ipAddress: "10.10.0.2",
            nodeStatus: "PASSIVE",
            children: [],
          },
        ],
      },
    ],
    "Topology loaded successfully"
  );
}

export function routerHealthSnapshotFixture(overrides: Partial<RouterHealthSnapshot> = {}): RouterHealthSnapshot {
  return {
    idxno: 101,
    routerId: 1,
    cpuUsage: 42,
    totalMemory: 1024,
    freeMemory: 512,
    temperature: 51,
    activePppoeSessions: 2,
    activeHotspotSessions: 49,
    uptime: "30d 04:12",
    latencyMs: 12,
    createdAt: "2026-08-26T08:00:00+03:00",
    ...overrides,
  };
}

export function routerHistoryFixture(size = 30): ApiResponse<PageResponse<RouterHealthSnapshot>> {
  const snapshots: RouterHealthSnapshot[] = Array.from(
    { length: Math.min(size, 30) },
    (_, i) =>
      routerHealthSnapshotFixture({
        idxno: 100 + i,
        createdAt: new Date(Date.parse("2026-08-26T08:00:00+03:00") - i * 60_000).toISOString(),
      })
  );
  return envelope(
    {
      content: snapshots,
      pageable: {
        pageNumber: 0,
        pageSize: size,
        sort: { unsorted: false, sorted: true, empty: false },
        offset: 0,
        unpaged: false,
        paged: true,
      },
      totalElements: snapshots.length,
      totalPages: 1,
      last: true,
      first: true,
      numberOfElements: snapshots.length,
      size,
      number: 0,
      sort: { unsorted: false, sorted: true, empty: false },
      empty: snapshots.length === 0,
    },
    "Router history fetched successfully"
  );
}

export function routerLatestFixture(): ApiResponse<RouterHealthSnapshot> {
  return envelope(routerHealthSnapshotFixture(), "Router latest snapshot fetched successfully");
}

/**
 * SSE `text/event-stream` body for the live telemetry route. Emits one named
 * `telemetry` frame (the exact payload shape `RouterHealthSnapshot`) plus the
 * `: ping` keepalive the backend broker sends every 15s.
 */
export function routerLiveStreamFixture(
  snapshots: RouterHealthSnapshot[] = [routerHealthSnapshotFixture()]
): string {
  const frames = snapshots.map(
    (snapshot) => `id: ${snapshot.idxno}\nevent: telemetry\ndata: ${JSON.stringify(snapshot)}\n`
  );
  return [...frames, ": ping", ""].join("\n");
}

export function deviceStatusFixture(): ApiResponse<MikrotikDeviceStatus> {
  return envelope(
    {
      deviceId: 1,
      name: "ADRNOLDNETWORKS",
      ipAddress: "192.168.1.1",
      deviceType: "ROUTER",
      online: true,
      identity: "ADRNOLDNETWORKS",
      version: "7.15.2",
      uptime: "30d 04:12",
      cpuLoad: "42%",
      freeMemory: "512MB",
      totalMemory: "1024MB",
      interfaces: [
        {
          type: "ether",
          ".id": "*1",
          name: "ether1",
          "default-name": "ether1",
          mtu: "1500",
          "actual-mtu": "1500",
          l2mtu: "1598",
          "max-l2mtu": "1598",
          "mac-address": "32:A2:F1:9C:4D:02",
          "link-downs": "0",
          "rx-byte": "1500000000",
          "tx-byte": "89500000",
          "rx-packet": "100000",
          "tx-packet": "50000",
          "tx-queue-drop": "0",
          "fp-rx-byte": "0",
          "fp-tx-byte": "0",
          "fp-rx-packet": "0",
          "fp-tx-packet": "0",
          running: "true",
          disabled: "false",
        },
      ],
      neighbors: [],
    },
    "Device status fetched successfully"
  );
}

export function ipPoolsFixture(): ApiResponse<IpPool[]> {
  return envelope(
    [
      {
        poolName: "hs-pool-magunas",
        subnet: "172.16.0.0/16",
        gateway: "172.16.0.1",
        totalIps: 65534,
        usedIps: 49,
        availableIps: 65485,
        utilizationPercentage: 0,
        serviceType: "HOTSPOT",
      },
      {
        poolName: "pppoe-pool-residential",
        subnet: "10.0.19.0/24",
        gateway: "10.0.19.1",
        totalIps: 254,
        usedIps: 114,
        availableIps: 140,
        utilizationPercentage: 45,
        serviceType: "PPPOE",
      },
      {
        poolName: "wireguard-tunnel-pool",
        subnet: "10.9.0.0/24",
        gateway: "10.9.0.1",
        totalIps: 254,
        usedIps: 2,
        availableIps: 252,
        utilizationPercentage: 1,
        serviceType: "WIREGUARD",
      },
    ],
    "IP pools fetched successfully"
  );
}

export function customerDeviceFixture(): ApiResponse<{
  customerIdxno: number;
  macAddress: string;
  ipAddress: string;
  deviceType: string;
  idxno: number;
}> {
  return envelope(
    {
      customerIdxno: 1,
      macAddress: "AA:BB:CC:DD:EE:FF",
      ipAddress: "192.168.10.50",
      deviceType: "SMART_TV",
      idxno: 501,
    },
    "Customer device bound successfully"
  );
}

export function ipMappingsPageFixture(): ApiResponse<PageResponse<IpMappingResponse>> {
  return envelope({
    content: [
      {
        ipAddress: "172.16.0.11",
        macAddress: "32:A2:F1:9C:4D:02",
        username: "A2085",
        serviceType: "HOTSPOT",
        stationName: "ADRNOLDNETWORKS",
        status: "ONLINE",
        lastSeen: "2026-08-26T07:59:00+03:00",
      },
      {
        ipAddress: "10.0.19.114",
        macAddress: "D0:9C:0B:7E:33:A1",
        username: "P-114",
        serviceType: "PPPOE",
        stationName: "Adrinold Ukunda",
        status: "ONLINE",
        lastSeen: "2026-08-26T07:58:00+03:00",
      },
      {
        ipAddress: "172.16.0.73",
        macAddress: "70:2F:7C:90:AE:1E",
        username: "A4290",
        serviceType: "HOTSPOT",
        stationName: "ADRNOLDNETWORKS",
        status: "EXPIRED",
        lastSeen: "2026-08-25T21:00:00+03:00",
      },
    ],
    pageable: {
      pageNumber: 0,
      pageSize: 20,
      sort: { unsorted: true, sorted: false, empty: true },
      offset: 0,
      unpaged: false,
      paged: true,
    },
    totalElements: 3,
    totalPages: 1,
    last: true,
    first: true,
    numberOfElements: 3,
    size: 20,
    number: 0,
    sort: { unsorted: true, sorted: false, empty: true },
    empty: false,
  }, "IP mappings fetched successfully");
}

// ── Wave-1 interaction matrix (mirrors the Pact spec + MSW handlers) ─────────

export const authInteractions: Interaction[] = [
  {
    name: "POST /api/v1/auth/userlogin",
    method: "POST",
    path: "/api/v1/auth/userlogin",
    auth: "public",
    status: 200,
    responseBody: loginFixture(),
  },
  {
    name: "POST /api/v1/auth/refresh-token with Bearer old JWT",
    method: "POST",
    path: "/api/v1/auth/refresh-token",
    auth: "bearer",
    status: 200,
    requestBody: {},
    responseBody: refreshTokenFixture(),
  },
  {
    name: "POST /api/v1/auth/logout",
    method: "POST",
    path: "/api/v1/auth/logout",
    auth: "bearer",
    status: 200,
    responseBody: logoutFixture(),
  },
];

export const hotspotInteractions: Interaction[] = [
  {
    name: "GET /api/v1/hotspot/packages",
    method: "GET",
    path: "/api/v1/hotspot/packages",
    auth: "public",
    status: 200,
    responseBody: activePackagesFixture(),
  },
  {
    name: "POST /api/v1/hotspot/initiate",
    method: "POST",
    path: "/api/v1/hotspot/initiate",
    auth: "public",
    status: 200,
    requestBody: {
      packageId: 1,
      phone: "0726837210",
      paymentMode: "MPESA",
      macAddress: "32:A2:F1:9C:4D:02",
      clientMac: "32:A2:F1:9C:4D:02",
      clientIp: "172.16.0.11",
    },
    responseBody: initiatePaymentFixture(),
  },
  {
    name: "POST /api/v1/hotspot/reconnect",
    method: "POST",
    path: "/api/v1/hotspot/reconnect",
    auth: "public",
    status: 200,
    requestBody: { macAddress: "32:A2:F1:9C:4D:02", clientIp: "172.16.0.11" },
    responseBody: reconnectFixture(),
  },
  {
    name: "POST /api/v1/hotspot/sessions/{sessionId}/disconnect",
    method: "POST",
    path: "/api/v1/hotspot/sessions/HS-20260826-001/disconnect",
    auth: "public",
    status: 200,
    responseBody: errorEnvelope(200, "Session disconnected successfully"),
  },
  {
    name: "GET /api/v1/hotspot/sessions/active pageable",
    method: "GET",
    path: "/api/v1/hotspot/sessions/active",
    query: { page: "0", size: "10" },
    auth: "public",
    status: 200,
    responseBody: hotspotSessionsPageFixture(10, 2),
  },
  {
    name: "GET /api/v1/hotspot/sessions/history pageable",
    method: "GET",
    path: "/api/v1/hotspot/sessions/history",
    query: { page: "0", size: "10" },
    auth: "public",
    status: 200,
    responseBody: hotspotSessionsPageFixture(10, 2),
  },
  {
    name: "POST /api/v1/hotspot/vouchers/create",
    method: "POST",
    path: "/api/v1/hotspot/vouchers/create",
    auth: "public",
    status: 200,
    requestBody: { packageId: 1, count: 5, stationId: "2" },
    responseBody: voucherBatchFixture(),
  },
];

export const customerInteractions: Interaction[] = [
  {
    name: "GET /api/v1/customers page",
    method: "GET",
    path: "/api/v1/customers",
    query: { page: "0", size: "10", regionId: "1", stationId: "2", locationId: "3" },
    auth: "bearer",
    status: 200,
    responseBody: customersPageFixture(),
  },
  {
    name: "POST /api/v1/customers",
    method: "POST",
    path: "/api/v1/customers",
    auth: "bearer",
    status: 200,
    requestBody: { username: "johndoe", firstname: "John", lname: "Doe" },
    responseBody: customersPageFixture(),
  },
  {
    name: "GET /api/v1/customers/{idxno}",
    method: "GET",
    path: "/api/v1/customers/1",
    auth: "bearer",
    status: 200,
    responseBody: customerByIdFixture(),
  },
];

export const networkInteractions: Interaction[] = [
  {
    name: "GET /api/v1/network/routers",
    method: "GET",
    path: "/api/v1/network/routers",
    query: { regionId: "1", stationId: "2", locationId: "3" },
    auth: "bearer",
    status: 200,
    responseBody: routersFixture(),
  },
  {
    name: "POST /api/v1/network/routers/validate-connectivity",
    method: "POST",
    path: "/api/v1/network/routers/validate-connectivity",
    auth: "bearer",
    status: 200,
    responseBody: validateConnectivityFixture(),
  },
  {
    name: "POST /api/v1/network/routers/onboard",
    method: "POST",
    path: "/api/v1/network/routers/onboard",
    auth: "bearer",
    status: 200,
    responseBody: onboardFixture(),
  },
  {
    name: "GET /api/v1/network-routers/topology",
    method: "GET",
    path: "/api/v1/network-routers/topology",
    auth: "bearer",
    status: 200,
    responseBody: topologyFixture(),
  },
  {
    name: "GET /api/v1/network/monitoring/router/{id}/history",
    method: "GET",
    path: "/api/v1/network/monitoring/router/1/history",
    query: { page: "0", size: "30" },
    auth: "bearer",
    status: 200,
    responseBody: routerHistoryFixture(),
  },
  {
    name: "GET /api/v1/network/monitoring/router/{id}/latest",
    method: "GET",
    path: "/api/v1/network/monitoring/router/1/latest",
    auth: "bearer",
    status: 200,
    responseBody: routerLatestFixture(),
  },
  {
    name: "GET /api/v1/network-devices/{id}/status",
    method: "GET",
    path: "/api/v1/network-devices/1/status",
    auth: "bearer",
    status: 200,
    responseBody: deviceStatusFixture(),
  },
  {
    name: "GET /api/v1/network/ip-pools",
    method: "GET",
    path: "/api/v1/network/ip-pools",
    auth: "bearer",
    status: 200,
    responseBody: ipPoolsFixture(),
  },
];

export const sessionInteractions: Interaction[] = [
  {
    name: "POST /api/v1/customer-devices",
    method: "POST",
    path: "/api/v1/customer-devices",
    auth: "bearer",
    status: 200,
    requestBody: { customerIdxno: 1, macAddress: "AA:BB:CC:DD:EE:FF", ipAddress: "192.168.10.50", deviceType: "SMART_TV" },
    responseBody: customerDeviceFixture(),
  },
  {
    name: "GET /api/v1/network/ip-mappings",
    method: "GET",
    path: "/api/v1/network/ip-mappings",
    auth: "bearer",
    status: 200,
    responseBody: ipMappingsPageFixture(),
  },
];

/**
 * Live SSE surfaces — intentionally OUT of Pact. The committed pact suite and
 * its provider verification assume a JSON `ApiResponse` envelope on every
 * interaction; a perpetual `text/event-stream` body cannot be replayed there.
 * These are covered by the MSW handler + integration-manual against a live
 * backend instead.
 */
export const sseInteractions: Interaction[] = [
  {
    name: "GET /api/v1/network/monitoring/router/{id}/live (SSE)",
    method: "GET",
    path: "/api/v1/network/monitoring/router/1/live",
    auth: "bearer",
    status: 200,
    responseBody: routerLiveStreamFixture(),
  },
];

export const unauthorizedFixture = (status = 401): ApiResponse<null> =>
  errorEnvelope(status, status === 403 ? "Forbidden" : "Unauthorized");

/** Network-level failure (no HTTP response) — used by graceful-degradation tests. */
export function networkErrorFixture(): { name: string; message: string } {
  return { name: "FetchError", message: "Network request failed" };
}

// ── Hotspot admin (public per spec + probe) ─────────────────────────────────

export function hotspotSessionFixture(
  overrides: Partial<HotspotSessionResponse> = {}
): HotspotSessionResponse {
  return {
    sessionId: "HS-20260826-001",
    macAddress: "32:A2:F1:9C:4D:02",
    clientPhone: "0726837210",
    payerPhone: "0726837210",
    packageName: "Home Hotspot 10Mbps",
    amountPaid: 1500,
    sessionStatus: "ACTIVE",
    startedAt: "2026-08-26T08:00:00+03:00",
    expiresAt: "2026-09-25T08:00:00+03:00",
    minutesRemaining: 43140,
    mpesaReference: "QDD7X9Y2A1",
    voucherCode: "",
    concurrentUserLimit: 1,
    durationSeconds: 2592000,
    dataUploadedBytes: 0,
    dataDownloadedBytes: 0,
    ipAddress: "172.16.0.11",
    stationId: "1",
    companyId: "1",
    ...overrides,
  };
}

export function hotspotSessionsPageFixture(
  size = 10,
  totalElements = 2
): ApiResponse<PageResponse<HotspotSessionResponse>> {
  const content = [
    hotspotSessionFixture(),
    hotspotSessionFixture({
      sessionId: "HS-20260826-002",
      clientPhone: "0712884551",
      payerPhone: "0712884551",
      packageName: "Hotspot Daily 4Mbps",
      amountPaid: 50,
      minutesRemaining: 720,
    }),
  ].slice(0, Math.min(size, totalElements));
  return envelope(
    {
      content,
      pageable: {
        pageNumber: 0,
        pageSize: size,
        sort: { unsorted: false, sorted: true, empty: false },
        offset: 0,
        unpaged: false,
        paged: true,
      },
      totalElements,
      totalPages: 1,
      last: true,
      first: true,
      numberOfElements: content.length,
      size,
      number: 0,
      sort: { unsorted: false, sorted: true, empty: false },
      empty: content.length === 0,
    },
    "Hotspot sessions fetched successfully"
  );
}

export function voucherBatchFixture(): ApiResponse<HotspotSessionResponse[]> {
  return envelope(
    [
      hotspotSessionFixture({
        sessionId: "VS-20260902-0001",
        voucherCode: "ADR4F2K7X9",
        amountPaid: 900,
        clientPhone: "",
        payerPhone: "",
        macAddress: "",
        sessionStatus: "PENDING",
        minutesRemaining: 43200,
        expiresAt: "2026-10-02T08:00:00+03:00",
      }),
      hotspotSessionFixture({
        sessionId: "VS-20260902-0002",
        voucherCode: "ADR8N2W5M3",
        amountPaid: 900,
        clientPhone: "",
        payerPhone: "",
        macAddress: "",
        sessionStatus: "PENDING",
        minutesRemaining: 43200,
        expiresAt: "2026-10-02T08:00:00+03:00",
      }),
    ],
    "Vouchers created successfully"
  );
}

// ── Customer lifecycle ───────────────────────────────────────────────────────

export function toggleActiveFixture(): ApiResponse<Customer> {
  return envelope(customerFixture({ isActive: false }), "Customer deactivated");
}

export function renewCustomerFixture(): ApiResponse<Customer> {
  return envelope(
    customerFixture({ expiryDate: "2026-09-26T23:59:59+03:00" }),
    "Customer subscription renewed"
  );
}

export function changePasswordFixture(): ApiResponse<string> {
  return envelope("Password updated successfully", "Password updated");
}

export function deleteCustomerFixture(): ApiResponse<null> {
  return envelope(null, "Customer deleted successfully");
}

export const customerLifecycleInteractions: Interaction[] = [
  {
    name: "PUT /api/v1/customers/{idxno}",
    method: "PUT",
    path: "/api/v1/customers/1",
    auth: "bearer",
    status: 200,
    requestBody: { username: "johndoe", firstname: "John", lname: "Doe" },
    responseBody: customerByIdFixture(),
  },
  {
    name: "DELETE /api/v1/customers/{idxno}",
    method: "DELETE",
    path: "/api/v1/customers/1",
    auth: "bearer",
    status: 200,
    responseBody: deleteCustomerFixture(),
  },
  {
    name: "PATCH /api/v1/customers/{idxno}/toggle-active",
    method: "PATCH",
    path: "/api/v1/customers/1/toggle-active",
    auth: "bearer",
    status: 200,
    responseBody: toggleActiveFixture(),
  },
  {
    name: "PATCH /api/v1/customers/{idxno}/renew duration+unit",
    method: "PATCH",
    path: "/api/v1/customers/1/renew",
    query: { duration: "30", unit: "DAYS" },
    auth: "bearer",
    status: 200,
    responseBody: renewCustomerFixture(),
  },
  {
    name: "PATCH /api/v1/customers/{idxno}/change-password",
    method: "PATCH",
    path: "/api/v1/customers/1/change-password",
    query: { newPassword: "NewPass123!" },
    auth: "bearer",
    status: 200,
    responseBody: changePasswordFixture(),
  },
];

// ── Tickets ──────────────────────────────────────────────────────────────────

export function ticketFixture(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    idxno: 41,
    ticketNumber: "TCK-2026-0041",
    title: "No internet at home",
    description: "Customer reports no connectivity since morning",
    status: "OPEN",
    priority: "MEDIUM",
    customerName: "Grace Wanjiru",
    assignedAgentName: "",
    creatorName: "Grace Wanjiru",
    pppoeAccountId: null,
    pppoeUsername: null,
    pppoeRouterIp: null,
    pppoeNetworkDeviceId: null,
    pppoeAccountStatus: null,
    createdAt: "2026-08-26T09:00:00+03:00",
    updatedAt: "2026-08-26T09:00:00+03:00",
    slaDeadline: "2026-08-27T09:00:00+03:00",
    isEscalated: false,
    stationId: "1",
    companyId: "1",
    ...overrides,
  };
}

export function ticketsFixture(): ApiResponse<Record<string, unknown>[]> {
  return envelope(
    [
      ticketFixture(),
      ticketFixture({
        idxno: 42,
        ticketNumber: "TCK-2026-0042",
        title: "Billing query",
        priority: "LOW",
        status: "ASSIGNED",
        assignedAgentName: "Joseph Mwangi",
      }),
    ],
    "Tickets fetched successfully"
  );
}

export function ticketByIdFixture(): ApiResponse<Record<string, unknown>> {
  return envelope(ticketFixture(), "Ticket fetched successfully");
}

export function ticketCommentsFixture(): ApiResponse<Record<string, unknown>[]> {
  return envelope(
    [
      { idxno: 1001, authorName: "Grace Wanjiru", comment: "Please escalate.", createdAt: "2026-08-26T09:30:00+03:00" },
      { idxno: 1002, authorName: "Joseph Mwangi", comment: "Onsite visit scheduled.", createdAt: "2026-08-26T10:00:00+03:00" },
    ],
    "Comments fetched successfully"
  );
}

export function ticketCommentFixture(): ApiResponse<Record<string, unknown>> {
  return envelope(
    { idxno: 1003, authorName: "Joseph Mwangi", comment: "Ticket closed.", createdAt: "2026-08-26T11:00:00+03:00" },
    "Comment added successfully"
  );
}

export function ticketMetricsFixture(): ApiResponse<Record<string, number>> {
  return envelope(
    {
      totalOpen: 3,
      inProgress: 5,
      resolved: 42,
      escalated: 1,
      breachedSla: 0,
    },
    "Ticket metrics fetched successfully"
  );
}

export function ticketsSearchPageFixture(): ApiResponse<PageResponse<Record<string, unknown>>> {
  return envelope(
    {
      content: [ticketFixture(), ticketFixture({ idxno: 43, ticketNumber: "TCK-2026-0043", priority: "HIGH" })],
      pageable: {
        pageNumber: 0,
        pageSize: 10,
        sort: { unsorted: false, sorted: true, empty: false },
        offset: 0,
        unpaged: false,
        paged: true,
      },
      totalElements: 2,
      totalPages: 1,
      last: true,
      first: true,
      numberOfElements: 2,
      size: 10,
      number: 0,
      sort: { unsorted: false, sorted: true, empty: false },
      empty: false,
    },
    "Tickets search completed"
  );
}

export const ticketInteractions: Interaction[] = [
  {
    name: "GET /api/v1/tickets",
    method: "GET",
    path: "/api/v1/tickets",
    auth: "bearer",
    status: 200,
    responseBody: ticketsFixture(),
  },
  {
    name: "POST /api/v1/tickets",
    method: "POST",
    path: "/api/v1/tickets",
    auth: "bearer",
    status: 200,
    requestBody: { title: "No internet", description: "Down since morning", priority: "HIGH" },
    responseBody: ticketByIdFixture(),
  },
  {
    name: "GET /api/v1/tickets/{id}",
    method: "GET",
    path: "/api/v1/tickets/41",
    auth: "bearer",
    status: 200,
    responseBody: ticketByIdFixture(),
  },
  {
    name: "GET /api/v1/tickets/{id}/comments",
    method: "GET",
    path: "/api/v1/tickets/41/comments",
    auth: "bearer",
    status: 200,
    responseBody: ticketCommentsFixture(),
  },
  {
    name: "POST /api/v1/tickets/{id}/comments",
    method: "POST",
    path: "/api/v1/tickets/41/comments",
    auth: "bearer",
    status: 200,
    requestBody: { comment: "Please escalate." },
    responseBody: ticketCommentFixture(),
  },
  {
    name: "PATCH /api/v1/tickets/{id}/status",
    method: "PATCH",
    path: "/api/v1/tickets/41/status",
    query: { status: "RESOLVED" },
    auth: "bearer",
    status: 200,
    responseBody: ticketByIdFixture(),
  },
  {
    name: "PATCH /api/v1/tickets/{id}/assign/{agentId}",
    method: "PATCH",
    path: "/api/v1/tickets/41/assign/7",
    auth: "bearer",
    status: 200,
    responseBody: ticketByIdFixture(),
  },
  {
    name: "GET /api/v1/tickets/search pageable",
    method: "GET",
    path: "/api/v1/tickets/search",
    query: { page: "0", size: "10", keyword: "internet" },
    auth: "bearer",
    status: 200,
    responseBody: ticketsSearchPageFixture(),
  },
  {
    name: "GET /api/v1/tickets/metrics",
    method: "GET",
    path: "/api/v1/tickets/metrics",
    auth: "bearer",
    status: 200,
    responseBody: ticketMetricsFixture(),
  },
];

// ── Net packages (system/packages CRUD) ──────────────────────────────────────

export function netPackageFixture(overrides: Partial<NetPackage> = {}): NetPackage {
  return {
    idxno: 1,
    packageName: "Home Hotspot 10Mbps",
    price: 1500,
    packageCategory: "HOTSPOT",
    validityType: "MONTHLY",
    validityValue: 30,
    bandwidthType: "SHARED",
    activeStatus: true,
    speedDownload: 10,
    speedUpload: 5,
    rateLimit: "10M/5M",
    ...overrides,
  };
}

export function netPackagesFixture(): ApiResponse<NetPackage[]> {
  return envelope(
    [
      netPackageFixture(),
      netPackageFixture({ idxno: 2, packageName: "PPPoE Unlimited 8M", packageCategory: "PPPOE", price: 2000, speedDownload: 8, speedUpload: 8, rateLimit: "8M/8M" }),
    ],
    "Packages fetched successfully"
  );
}

export function netPackageByIdFixture(): ApiResponse<NetPackage> {
  return envelope(netPackageFixture(), "Package fetched successfully");
}

export const packageInteractions: Interaction[] = [
  {
    name: "GET /api/v1/system/packages",
    method: "GET",
    path: "/api/v1/system/packages",
    auth: "bearer",
    status: 200,
    responseBody: netPackagesFixture(),
  },
  {
    name: "POST /api/v1/system/packages",
    method: "POST",
    path: "/api/v1/system/packages",
    auth: "bearer",
    status: 200,
    requestBody: { packageName: "Home Hotspot 10Mbps", price: 1500 },
    responseBody: netPackageByIdFixture(),
  },
  {
    name: "PATCH /api/v1/system/packages/{idxno}",
    method: "PATCH",
    path: "/api/v1/system/packages/1",
    auth: "bearer",
    status: 200,
    requestBody: { price: 1600 },
    responseBody: netPackageByIdFixture(),
  },
  {
    name: "DELETE /api/v1/system/packages/{idxno}",
    method: "DELETE",
    path: "/api/v1/system/packages/1",
    auth: "bearer",
    status: 200,
    responseBody: envelope(null, "Package deleted successfully"),
  },
  {
    name: "PATCH /api/v1/system/packages/{idxno}/deactivate",
    method: "PATCH",
    path: "/api/v1/system/packages/1/deactivate",
    auth: "bearer",
    status: 200,
    responseBody: envelope(netPackageFixture({ activeStatus: false }), "Package deactivated"),
  },
];

// ── System-setup (roles / menus / role users) ────────────────────────────────

export function roleFixture(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    idxno: 1,
    roleCode: "SYSADMIN",
    name: "System Administrator",
    description: "Full system access",
    createdAt: "2026-01-01T00:00:00+03:00",
    ...overrides,
  };
}

export function rolesFixture(): ApiResponse<Record<string, unknown>[]> {
  return envelope(
    [
      roleFixture(),
      roleFixture({ idxno: 2, roleCode: "TECH", name: "Field Technician", description: "Field support role" }),
    ],
    "Roles fetched successfully"
  );
}

export function menusFixture(): ApiResponse<Record<string, unknown>[]> {
  return envelope(
    [
      { idxno: 1, label: "Dashboard", route: "/dashboard", icon: "LayoutDashboard", sortOrder: 1 },
      { idxno: 2, label: "Customers", route: "/customers", icon: "Users", sortOrder: 2 },
    ],
    "Menus fetched successfully"
  );
}

export function roleMenusFixture(): ApiResponse<Record<string, unknown>[]> {
  return envelope(
    [
      { label: "Dashboard", route: "/dashboard", icon: "LayoutDashboard", sortOrder: 1, canView: true, canCreate: true, canEdit: true, canDelete: true },
      { label: "Customers", route: "/customers", icon: "Users", sortOrder: 2, canView: true, canCreate: false, canEdit: false, canDelete: false },
    ],
    "Role menus fetched successfully"
  );
}

export function roleUsersFixture(): ApiResponse<Record<string, unknown>[]> {
  return envelope(
    [
      { idxno: 7, username: "jmwangi", userId: "7", role: "TECH", createdAt: "2026-02-01T00:00:00+03:00", isactive: true, fname: "Joseph", middleName: "", otherName: "", fullName: "Joseph Mwangi", email: "jmwangi@outlook.com", phoneNumber: "0712884551", canLogin: true },
    ],
    "Role users fetched successfully"
  );
}

export const systemSetupInteractions: Interaction[] = [
  {
    name: "GET /api/v1/system-setup/all-roles",
    method: "GET",
    path: "/api/v1/system-setup/all-roles",
    auth: "bearer",
    status: 200,
    responseBody: rolesFixture(),
  },
  {
    name: "GET /api/v1/system-setup/all-menus",
    method: "GET",
    path: "/api/v1/system-setup/all-menus",
    auth: "bearer",
    status: 200,
    responseBody: menusFixture(),
  },
  {
    name: "GET /api/v1/system-setup/{roleCode}/menus",
    method: "GET",
    path: "/api/v1/system-setup/TECH/menus",
    auth: "bearer",
    status: 200,
    responseBody: roleMenusFixture(),
  },
  {
    name: "POST /api/v1/system-setup/{roleCode}/menus",
    method: "POST",
    path: "/api/v1/system-setup/TECH/menus",
    auth: "bearer",
    status: 200,
    requestBody: { permissions: [{ menuItemId: 1, canView: true, canCreate: true, canEdit: true, canDelete: true }] },
    responseBody: envelope("Permissions updated", "Permissions updated successfully"),
  },
  {
    name: "POST /api/v1/system-setup/add-role",
    method: "POST",
    path: "/api/v1/system-setup/add-role",
    auth: "bearer",
    status: 200,
    requestBody: { roleCode: "SUPPORT", name: "Support Agent", description: "Billing support" },
    responseBody: envelope(roleFixture({ idxno: 3, roleCode: "SUPPORT", name: "Support Agent" }), "Role created successfully"),
  },
  {
    name: "PUT /api/v1/system-setup/update-role/{id}",
    method: "PUT",
    path: "/api/v1/system-setup/update-role/2",
    auth: "bearer",
    status: 200,
    requestBody: { roleCode: "TECH", name: "Field Technician", description: "Field support role" },
    responseBody: envelope(roleFixture({ roleCode: "TECH", name: "Field Technician v2" }), "Role updated successfully"),
  },
  {
    name: "GET /api/v1/system-setup/{roleCode}/users",
    method: "GET",
    path: "/api/v1/system-setup/TECH/users",
    auth: "bearer",
    status: 200,
    responseBody: roleUsersFixture(),
  },
];

// ── System users ─────────────────────────────────────────────────────────────

export function staffUsersFixture(): ApiResponse<Record<string, unknown>[]> {
  return envelope(
    [
      { idxno: 7, username: "jmwangi", userId: "7", role: "TECH", roleName: "Field Technician", roleDescription: "", fname: "Joseph", middleName: "", otherName: "", fullName: "Joseph Mwangi", email: "jmwangi@outlook.com", phoneNumber: "0712884551", isactive: true, canLogin: true, createdAt: "2026-02-01T00:00:00+03:00" },
      { idxno: 8, username: "gwanjiru", userId: "8", role: "SUPPORT", roleName: "Support Agent", roleDescription: "", fname: "Grace", middleName: "", otherName: "", fullName: "Grace Wanjiru", email: "gwanjiru@gmail.com", phoneNumber: "0703247179", isactive: true, canLogin: true, createdAt: "2026-02-03T00:00:00+03:00" },
    ],
    "Staff users fetched successfully"
  );
}

export function systemUserFixture(): ApiResponse<Record<string, unknown>> {
  return envelope(
    { idxno: 9, username: "mwaniki", userId: "9", role: "TECH", roleName: "Field Technician", roleDescription: "", fname: "Peter", middleName: "", otherName: "", fullName: "Peter Mwaniki", email: "pmwaniki@gmail.com", phoneNumber: "0722111333", isactive: true, canLogin: true, createdAt: "2026-09-01T00:00:00+03:00" },
    "User created successfully"
  );
}

export const systemUserInteractions: Interaction[] = [
  {
    name: "GET /api/v1/system/users/staff",
    method: "GET",
    path: "/api/v1/system/users/staff",
    auth: "bearer",
    status: 200,
    responseBody: staffUsersFixture(),
  },
  {
    name: "POST /api/v1/system-setup/user/register",
    method: "POST",
    path: "/api/v1/system-setup/user/register",
    auth: "bearer",
    status: 200,
    requestBody: { username: "mwaniki", password: "StrongPass1!", role: "TECH", fname: "Peter" },
    responseBody: systemUserFixture(),
  },
  {
    name: "PUT /api/v1/system/users/{idxno}",
    method: "PUT",
    path: "/api/v1/system/users/9",
    auth: "bearer",
    status: 200,
    requestBody: { username: "mwaniki", fname: "Peter", isactive: true, canLogin: true },
    responseBody: systemUserFixture(),
  },
  {
    name: "PUT /api/v1/system/users/{idxno}/role",
    method: "PUT",
    path: "/api/v1/system/users/9/role",
    auth: "bearer",
    status: 200,
    requestBody: { roleCode: "TECH" },
    responseBody: systemUserFixture(),
  },
];

// ── Statements ───────────────────────────────────────────────────────────────

export function statementFixture(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "st-2026-08-100",
    customerId: "c-2085",
    startDate: "2026-08-01",
    endDate: "2026-08-31",
    pdfUrl: "/statements/st-2026-08-100.pdf",
    totalCharges: 1500,
    totalPayments: 1500,
    balanceDue: 0,
    createdAt: "2026-09-01T00:00:00+03:00",
    stationId: "1",
    companyId: "1",
    lineItems: [
      { description: "Monthly subscription", amount: 1500 },
    ],
    ...overrides,
  };
}

export function statementsPageFixture(): ApiResponse<PageResponse<Record<string, unknown>>> {
  return envelope(
    {
      content: [statementFixture(), statementFixture({ id: "st-2026-07-99", startDate: "2026-07-01", endDate: "2026-07-31" })],
      pageable: {
        pageNumber: 0,
        pageSize: 10,
        sort: { unsorted: false, sorted: true, empty: false },
        offset: 0,
        unpaged: false,
        paged: true,
      },
      totalElements: 2,
      totalPages: 1,
      last: true,
      first: true,
      numberOfElements: 2,
      size: 10,
      number: 0,
      sort: { unsorted: false, sorted: true, empty: false },
      empty: false,
    },
    "Statements fetched successfully"
  );
}

export const statementInteractions: Interaction[] = [
  {
    name: "POST /api/v1/statements/generate",
    method: "POST",
    path: "/api/v1/statements/generate",
    auth: "bearer",
    status: 200,
    requestBody: { customerId: "c-2085", startDate: "2026-08-01", endDate: "2026-08-31" },
    responseBody: envelope(statementFixture(), "Statement generated successfully"),
  },
  {
    name: "GET /api/v1/statements/customer/{customerId}",
    method: "GET",
    path: "/api/v1/statements/customer/c-2085",
    query: { page: "0", size: "10" },
    auth: "bearer",
    status: 200,
    responseBody: statementsPageFixture(),
  },
];

// ── Expenses ─────────────────────────────────────────────────────────────────

export function expenseFixture(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "0c5d80f1-3b9a-4c6e-8f2a-7d1e9b3a4c55",
    amount: 12000,
    description: "Backhaul router replacement",
    category: "EQUIPMENT",
    expenseDate: "2026-08-10",
    receiptUrl: "",
    createdById: 7,
    createdByUsername: "jmwangi",
    createdAt: "2026-08-10T09:00:00+03:00",
    updatedAt: "2026-08-10T09:00:00+03:00",
    stationId: "1",
    companyId: "1",
    ...overrides,
  };
}

function expensePage(): PageResponse<Record<string, unknown>> {
  return {
    content: [
      expenseFixture(),
      expenseFixture({ id: "a4e6b291-8c2d-4f7a-9b3e-5f8a1d2e6c77", amount: 3500, description: "Power backup fuel", category: "MAINTENANCE", expenseDate: "2026-08-12" }),
    ],
    pageable: {
      pageNumber: 0,
      pageSize: 20,
      sort: { unsorted: false, sorted: true, empty: false },
      offset: 0,
      unpaged: false,
      paged: true,
    },
    totalElements: 2,
    totalPages: 1,
    last: true,
    first: true,
    numberOfElements: 2,
    size: 20,
    number: 0,
    sort: { unsorted: false, sorted: true, empty: false },
    empty: false,
  };
}

export function expensesPageFixture(): ApiResponse<PageResponse<Record<string, unknown>>> {
  return envelope(expensePage(), "Expenses fetched successfully");
}

export function expenseByIdFixture(): ApiResponse<Record<string, unknown>> {
  return envelope(expenseFixture(), "Expense fetched successfully");
}

export function expensesSummaryFixture(): ApiResponse<Record<string, unknown>> {
  return envelope(
    {
      startDate: "2026-08-01",
      endDate: "2026-08-31",
      totalExpenses: 15500,
      expenseCount: 2,
      expensesByCategory: { EQUIPMENT: 12000, MAINTENANCE: 3500 },
    },
    "Expense summary fetched successfully"
  );
}

export const expenseInteractions: Interaction[] = [
  {
    name: "GET /api/v1/expenses date range",
    method: "GET",
    path: "/api/v1/expenses",
    query: { startDate: "2026-08-01", endDate: "2026-08-31", page: "0", size: "20" },
    auth: "bearer",
    status: 200,
    responseBody: expensesPageFixture(),
  },
  {
    name: "GET /api/v1/expenses/summary date range",
    method: "GET",
    path: "/api/v1/expenses/summary",
    query: { startDate: "2026-08-01", endDate: "2026-08-31" },
    auth: "bearer",
    status: 200,
    responseBody: expensesSummaryFixture(),
  },
  {
    name: "POST /api/v1/expenses",
    method: "POST",
    path: "/api/v1/expenses",
    auth: "bearer",
    status: 200,
    requestBody: { amount: 12000, description: "Backhaul router replacement", category: "EQUIPMENT", expenseDate: "2026-08-10" },
    responseBody: expenseByIdFixture(),
  },
  {
    name: "DELETE /api/v1/expenses/{id}",
    method: "DELETE",
    path: "/api/v1/expenses/0c5d80f1-3b9a-4c6e-8f2a-7d1e9b3a4c55",
    auth: "bearer",
    status: 200,
    responseBody: envelope(null, "Expense deleted successfully"),
  },
];

// ── Notification providers ───────────────────────────────────────────────────

export function notificationProviderFixture(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    idxno: 1,
    channel: "SMS",
    providerName: "Africa's Talking",
    apiUrl: "https://api.africastalking.com",
    apiKey: "at-api-key",
    senderId: "BEESMART",
    fromEmail: "",
    fromName: "",
    isActive: true,
    createdAt: "2026-05-01T00:00:00+03:00",
    updatedAt: "2026-05-01T00:00:00+03:00",
    ...overrides,
  };
}

export function notificationProvidersFixture(): ApiResponse<Record<string, unknown>[]> {
  return envelope(
    [
      notificationProviderFixture(),
      notificationProviderFixture({ idxno: 2, channel: "EMAIL", providerName: "SMTP", apiUrl: "smtp.beesmart.local", senderId: "", fromEmail: "billing@beesmartbedak.com", fromName: "Beesmart Billing" }),
    ],
    "Notification providers fetched successfully"
  );
}

export const notificationProviderInteractions: Interaction[] = [
  {
    name: "GET /api/v1/notification-providers",
    method: "GET",
    path: "/api/v1/notification-providers",
    auth: "bearer",
    status: 200,
    responseBody: notificationProvidersFixture(),
  },
  {
    name: "POST /api/v1/notification-providers",
    method: "POST",
    path: "/api/v1/notification-providers",
    auth: "bearer",
    status: 200,
    requestBody: { channel: "SMS", providerName: "Africa's Talking" },
    responseBody: envelope(notificationProviderFixture(), "Notification provider created"),
  },
  {
    name: "PUT /api/v1/notification-providers/{id}",
    method: "PUT",
    path: "/api/v1/notification-providers/1",
    auth: "bearer",
    status: 200,
    requestBody: { channel: "SMS", providerName: "Africa's Talking", isActive: false },
    responseBody: envelope(notificationProviderFixture({ isActive: false }), "Notification provider updated"),
  },
  {
    name: "DELETE /api/v1/notification-providers/{id}",
    method: "DELETE",
    path: "/api/v1/notification-providers/1",
    auth: "bearer",
    status: 200,
    responseBody: envelope("Provider deleted", "Notification provider deleted"),
  },
];

// ── Analytics ────────────────────────────────────────────────────────────────

export function profitLossDashboardFixture(): ApiResponse<Record<string, unknown>> {
  return envelope(
    {
      startDate: "2026-08-01",
      endDate: "2026-08-31",
      totalRevenue: 137000,
      totalExpenses: 45000,
      netProfitLoss: 92000,
      revenueBreakdown: { PPPOE: 95000, HOTSPOT: 42000 },
      expenseBreakdown: { OPERATING: 45000 },
    },
    "Profit & loss dashboard fetched successfully"
  );
}

export const analyticsInteractions: Interaction[] = [
  {
    name: "GET /api/v1/analytics/profit-and-loss/dashboard",
    method: "GET",
    path: "/api/v1/analytics/profit-and-loss/dashboard",
    auth: "bearer",
    status: 200,
    responseBody: profitLossDashboardFixture(),
  },
];

// ── Audit ────────────────────────────────────────────────────────────────────

export function auditLogsFixture(): ApiResponse<Record<string, unknown>[]> {
  return envelope(
    [
      {
        idxno: 501,
        username: "jmwangi",
        module: "SYSTEM-SETUP",
        subModule: "ROLES",
        actionDescription: "Updated role TECH",
        action: "UPDATE",
        accessTime: "2026-09-01T12:00:00+03:00",
        accessTo: "/system/access",
        stationId: "1",
        companyId: "1",
      },
      {
        idxno: 500,
        username: "gwanjiru",
        module: "CUSTOMERS",
        subModule: "LIFECYCLE",
        actionDescription: "Renewed customer A2085",
        action: "RENEW",
        accessTime: "2026-09-01T11:00:00+03:00",
        accessTo: "/customers",
        stationId: "1",
        companyId: "1",
      },
    ],
    "Audit logs fetched successfully"
  );
}

export const auditInteractions: Interaction[] = [
  {
    name: "GET /api/v1/systemsetup/audit-logs",
    method: "GET",
    path: "/api/v1/systemsetup/audit-logs",
    auth: "bearer",
    status: 200,
    responseBody: auditLogsFixture(),
  },
];

// ── Payments ─────────────────────────────────────────────────────────────────

export function triggerPaymentFixture(): ApiResponse<Record<string, unknown>> {
  return envelope(
    {
      id: "pay-2026-09-02-001",
      packageId: 1,
      packageName: "Home Hotspot 10Mbps",
      customerNumber: "0726837210",
      paymentmode: "MPESA",
      issuccessfull: true,
      datecreated: "2026-09-02T09:00:00+03:00",
      voucherCode: "ADR4F2K7X9",
      checkoutRequestId: "ws_CO_010920261248346682",
      status: "SUCCESS",
    },
    "Payment triggered successfully"
  );
}

export const paymentInteractions: Interaction[] = [
  {
    name: "POST /api/v1/payments/trigger",
    method: "POST",
    path: "/api/v1/payments/trigger",
    auth: "public",
    status: 200,
    requestBody: { packageId: 1, customerNumber: "0726837210", paymentmode: "MPESA" },
    responseBody: triggerPaymentFixture(),
  },
];

// ── Network routers (hyphenated controller) ──────────────────────────────────

export function networkRouterFixture(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    idxno: 3,
    name: "ADRNOLDNETWORKS",
    ipAddress: "192.168.1.1",
    macAddress: "32:A2:F1:9C:4D:02",
    routerType: "MIKROTIK",
    location: "Ukunda",
    status: true,
    lastOnline: "2026-09-02T08:00:00+03:00",
    uptime: "30d 04:12",
    firmwareVersion: "7.15.2",
    model: "RouterOS RB5009UG+S+",
    serialNumber: "SN-2026-0001",
    capacity: 100,
    currentLoad: 42,
    hierarchyLevel: 1,
    stationIdxno: 1,
    pppoeEnabled: true,
    hotspotEnabled: true,
    nodeStatus: "ACTIVE",
    ...overrides,
  };
}

export function pendingRoutersFixture(): ApiResponse<Record<string, unknown>[]> {
  return envelope(
    [
      networkRouterFixture(),
      networkRouterFixture({ idxno: 4, name: "Pending-site router", ipAddress: "10.10.0.9", status: false, nodeStatus: "PENDING" }),
    ],
    "Pending routers fetched successfully"
  );
}

export function routerActionFixture(): ApiResponse<Record<string, unknown>> {
  return envelope(
    {
      routerId: 3,
      routerName: "ADRNOLDNETWORKS",
      ipAddress: "192.168.1.1",
      action: "REBOOT",
      nodeStatus: "ACTIVE",
      executionStatus: "SUCCESS",
      message: "Command dispatched",
      error: "",
      timestamp: "2026-09-02T09:00:00+03:00",
    },
    "Router action executed successfully"
  );
}

export const networkRouterInteractions: Interaction[] = [
  {
    name: "GET /api/v1/network-routers/pending",
    method: "GET",
    path: "/api/v1/network-routers/pending",
    auth: "bearer",
    status: 200,
    responseBody: pendingRoutersFixture(),
  },
  {
    name: "GET /api/v1/network-routers/{id}",
    method: "GET",
    path: "/api/v1/network-routers/3",
    auth: "bearer",
    status: 200,
    responseBody: envelope(networkRouterFixture(), "Router details fetched successfully"),
  },
  {
    name: "PATCH /api/v1/network-routers/{id}",
    method: "PATCH",
    path: "/api/v1/network-routers/3",
    auth: "bearer",
    status: 200,
    requestBody: { name: "ADRNOLDNETWORKS" },
    responseBody: envelope(networkRouterFixture(), "Router updated successfully"),
  },
  {
    name: "PATCH /api/v1/network-routers/{id}/action",
    method: "PATCH",
    path: "/api/v1/network-routers/3/action",
    auth: "bearer",
    status: 200,
    requestBody: { action: "REBOOT", notes: "Scheduled maintenance" },
    responseBody: routerActionFixture(),
  },
  {
    name: "POST /api/v1/network-routers/{id}/finalize",
    method: "POST",
    path: "/api/v1/network-routers/3/finalize",
    auth: "bearer",
    status: 200,
    requestBody: { name: "ADRNOLDNETWORKS" },
    responseBody: envelope(networkRouterFixture(), "Router finalized successfully"),
  },
];

// ── Regions / locations / stations ───────────────────────────────────────────

export function regionFixture(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    idxno: 5,
    regionCode: "COAST",
    name: "Coast",
    description: "Coastal region",
    isActive: true,
    createdAt: "2026-01-10T00:00:00+03:00",
    locations: [],
    ...overrides,
  };
}

export function regionsFixture(): ApiResponse<Record<string, unknown>[]> {
  return envelope(
    [
      regionFixture(),
      regionFixture({ idxno: 6, regionCode: "NYANZA", name: "Nyanza", description: "Western region" }),
    ],
    "Regions fetched successfully"
  );
}

export function locationFixture(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    idxno: 11,
    regionIdxno: 5,
    regionName: "Coast",
    name: "Ukunda",
    latitude: -4.2833,
    longitude: 39.5667,
    isActive: true,
    createdAt: "2026-01-11T00:00:00+03:00",
    stations: [],
    ...overrides,
  };
}

export function locationsFixture(): ApiResponse<Record<string, unknown>[]> {
  return envelope(
    [locationFixture(), locationFixture({ idxno: 12, name: "Diani" })],
    "Locations fetched successfully"
  );
}

export function stationFixture(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    idxno: 21,
    locationIdxno: 11,
    locationName: "Ukunda",
    name: "ADRNOLDNETWORKS",
    powerType: "GRID",
    backhaulType: "FIBER",
    isActive: true,
    createdAt: "2026-01-12T00:00:00+03:00",
    ...overrides,
  };
}

export function stationsFixture(): ApiResponse<Record<string, unknown>[]> {
  return envelope(
    [stationFixture(), stationFixture({ idxno: 22, name: "Diani Beach" })],
    "Stations fetched successfully"
  );
}

export const geoInteractions: Interaction[] = [
  {
    name: "GET /api/v1/network/regions",
    method: "GET",
    path: "/api/v1/network/regions",
    auth: "bearer",
    status: 200,
    responseBody: regionsFixture(),
  },
  {
    name: "POST /api/v1/network/regions",
    method: "POST",
    path: "/api/v1/network/regions",
    auth: "bearer",
    status: 200,
    requestBody: { regionCode: "EAST", name: "Eastern", description: "Eastern region" },
    responseBody: envelope(regionFixture({ idxno: 7, regionCode: "EAST", name: "Eastern" }), "Region created successfully"),
  },
  {
    name: "DELETE /api/v1/network/regions/{id}",
    method: "DELETE",
    path: "/api/v1/network/regions/5",
    auth: "bearer",
    status: 200,
    responseBody: envelope(null, "Region deleted successfully"),
  },
  {
    name: "GET /api/v1/network/locations/region/{regionId}",
    method: "GET",
    path: "/api/v1/network/locations/region/5",
    auth: "bearer",
    status: 200,
    responseBody: locationsFixture(),
  },
  {
    name: "POST /api/v1/network/locations",
    method: "POST",
    path: "/api/v1/network/locations",
    auth: "bearer",
    status: 200,
    requestBody: { regionIdxno: 5, name: "Msambweni" },
    responseBody: envelope(locationFixture({ idxno: 13, name: "Msambweni" }), "Location created successfully"),
  },
  {
    name: "DELETE /api/v1/network/locations/{id}",
    method: "DELETE",
    path: "/api/v1/network/locations/11",
    auth: "bearer",
    status: 200,
    responseBody: envelope(null, "Location deleted successfully"),
  },
  {
    name: "GET /api/v1/network/stations/location/{locationId}",
    method: "GET",
    path: "/api/v1/network/stations/location/11",
    auth: "bearer",
    status: 200,
    responseBody: stationsFixture(),
  },
  {
    name: "POST /api/v1/network/stations",
    method: "POST",
    path: "/api/v1/network/stations",
    auth: "bearer",
    status: 200,
    requestBody: { locationIdxno: 11, name: "Beachcomber" },
    responseBody: envelope(stationFixture({ idxno: 23, name: "Beachcomber" }), "Station created successfully"),
  },
  {
    name: "DELETE /api/v1/network/stations/{id}",
    method: "DELETE",
    path: "/api/v1/network/stations/21",
    auth: "bearer",
    status: 200,
    responseBody: envelope(null, "Station deleted successfully"),
  },
];

// ── Network provisioning ─────────────────────────────────────────────────────

export function stationLoadFixture(): ApiResponse<Record<string, unknown>[]> {
  return envelope(
    [
      { id: 3, name: "ADRNOLDNETWORKS", ipAddress: "192.168.1.1", currentSessions: 49, maxSessions: 100, cpuUsage: 42, loadFactor: 0.49, healthStatus: "HEALTHY" },
      { id: 4, name: "Pending-site router", ipAddress: "10.10.0.9", currentSessions: 0, maxSessions: 100, cpuUsage: 5, loadFactor: 0.0, healthStatus: "IDLE" },
    ],
    "Station load fetched successfully"
  );
}

export const provisioningInteractions: Interaction[] = [
  {
    name: "GET /api/v1/network/provisioning/station/{stationId}/load",
    method: "GET",
    path: "/api/v1/network/provisioning/station/1/load",
    auth: "bearer",
    status: 200,
    responseBody: stationLoadFixture(),
  },
  {
    name: "POST /api/v1/network/provisioning/pppoe",
    method: "POST",
    path: "/api/v1/network/provisioning/pppoe",
    auth: "bearer",
    status: 200,
    requestBody: { routerId: 3, customerId: "c-2085", username: "A2085-ppp" },
    responseBody: envelope(null, "Subscriber line provisioned successfully"),
  },
];

// ── Network devices ──────────────────────────────────────────────────────────

export function deviceFixture(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 1,
    name: "ADRNOLDNETWORKS",
    ipAddress: "192.168.1.1",
    port: 8728,
    location: "Ukunda",
    active: true,
    createdAt: "2026-01-01T00:00:00+03:00",
    deviceType: "ROUTER",
    site: "UKUNDA",
    region: "COAST",
    online: true,
    apiAuthenticated: true,
    healthDetail: "Healthy",
    lastCheckedAt: "2026-09-02T08:00:00+03:00",
    lastSeenAt: "2026-09-02T08:00:00+03:00",
    cpuLoad: "42%",
    uptime: "30d 04:12",
    stationId: "1",
    companyId: "1",
    ...overrides,
  };
}

export function devicesFixture(): ApiResponse<Record<string, unknown>[]> {
  return envelope(
    [deviceFixture(), deviceFixture({ id: 2, name: "Adrinold Ukunda", ipAddress: "10.10.0.2", location: "Diani" })],
    "Devices fetched successfully"
  );
}

export function deviceInterfacesFixture(): ApiResponse<Record<string, string>[]> {
  return envelope(
    [
      { name: "ether1", "default-name": "ether1", mtu: "1500", running: "true" },
      { name: "bridge-local", "default-name": "bridge-local", mtu: "1500", running: "true" },
    ],
    "Interfaces fetched successfully"
  );
}

export const networkDeviceInteractions: Interaction[] = [
  {
    name: "GET /api/v1/network-devices",
    method: "GET",
    path: "/api/v1/network-devices",
    auth: "bearer",
    status: 200,
    responseBody: devicesFixture(),
  },
  {
    name: "POST /api/v1/network-devices",
    method: "POST",
    path: "/api/v1/network-devices",
    auth: "bearer",
    status: 200,
    requestBody: { name: "New Site Router", ipAddress: "10.20.0.1", deviceType: "ROUTER" },
    responseBody: envelope(deviceFixture({ id: 5, name: "New Site Router", ipAddress: "10.20.0.1" }), "Device added successfully"),
  },
  {
    name: "GET /api/v1/network-devices/{id}/interfaces",
    method: "GET",
    path: "/api/v1/network-devices/1/interfaces",
    auth: "bearer",
    status: 200,
    responseBody: deviceInterfacesFixture(),
  },
];

// ── Bootstrap ────────────────────────────────────────────────────────────────

export function bootstrapTokenFixture(): ApiResponse<Record<string, unknown>> {
  return envelope(
    {
      routerId: 5,
      identity: "ADRNOLDNETWORKS",
      allocatedVpnIp: "10.9.0.50",
      fetchCommand: "curl -s http://10.9.0.1/bootstrap?token=abc | /bin/sh",
      expiresAt: "2026-09-03T09:00:00+03:00",
      status: "PENDING",
    },
    "Bootstrap token created successfully"
  );
}

export const bootstrapInteractions: Interaction[] = [
  {
    name: "POST /api/v1/provision/bootstrap-tokens",
    method: "POST",
    path: "/api/v1/provision/bootstrap-tokens",
    auth: "bearer",
    status: 200,
    requestBody: {
      identity: "ADRNOLDNETWORKS",
      ipAddress: "192.168.1.1",
      apiUsername: "admin",
      apiPassword: "secret",
      snmpCommunity: "public",
      acknowledgeDestructiveReset: true,
    },
    responseBody: bootstrapTokenFixture(),
  },
];

// ── PPPoE ────────────────────────────────────────────────────────────────────

export function pppoePackageFixture(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "pppoe-pkg-001",
    name: "PPPoE Unlimited 8M",
    uploadSpeed: 8,
    downloadSpeed: 8,
    durationDays: 30,
    mikrotikRateLimit: "8M/8M",
    maxDevices: 2,
    idleTimeoutSeconds: 300,
    acctInterimIntervalSeconds: 600,
    dataCapMb: 0,
    loginTimeWindow: "",
    ...overrides,
  };
}

export function pppoePackagesFixture(): ApiResponse<Record<string, unknown>[]> {
  return envelope(
    [
      pppoePackageFixture(),
      pppoePackageFixture({ id: "pppoe-pkg-002", name: "PPPoE Unlimited 20M", uploadSpeed: 20, downloadSpeed: 20, mikrotikRateLimit: "20M/20M" }),
    ],
    "PPPoE packages fetched successfully"
  );
}

export function pppoeAccountFixture(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "pppoe-acct-001",
    customerId: "c-2085",
    username: "A2085-ppp",
    generatedPassword: "Ppp@254-8842",
    routerId: "pppoe-rt-001",
    networkDeviceId: 1,
    routerIp: "192.168.1.1",
    physicalLocation: "Ukunda",
    status: "ACTIVE",
    stationId: "1",
    companyId: "1",
    ...overrides,
  };
}

export function pppoeAccountsFixture(): ApiResponse<Record<string, unknown>[]> {
  return envelope(
    [pppoeAccountFixture(), pppoeAccountFixture({ id: "pppoe-acct-002", username: "A3112-ppp", status: "SUSPENDED" })],
    "PPPoE accounts fetched successfully"
  );
}

export function pppoeSubscriptionFixture(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "pppoe-sub-001",
    customerId: "c-2085",
    accountId: "pppoe-acct-001",
    packageId: "pppoe-pkg-001",
    packageName: "PPPoE Unlimited 8M",
    startDate: "2026-08-02",
    expiryDate: "2026-09-01",
    daysRemaining: 12,
    status: "ACTIVE",
    isActive: true,
    createdAt: "2026-08-02T00:00:00+03:00",
    updatedAt: "2026-08-02T00:00:00+03:00",
    ...overrides,
  };
}

export function pppoeSubscriptionsFixture(): ApiResponse<Record<string, unknown>[]> {
  return envelope(
    [pppoeSubscriptionFixture(), pppoeSubscriptionFixture({ id: "pppoe-sub-002", status: "EXPIRED", expiryDate: "2026-07-01", daysRemaining: 0, isActive: false })],
    "PPPoE subscriptions fetched successfully"
  );
}

export function radiusAuthFixture(): ApiResponse<Record<string, unknown>> {
  return envelope(
    { result: "ACCEPT", reason: "Valid credentials", mikrotikRateLimit: "8M/8M", routerIp: "192.168.1.1" },
    "RADIUS authentication attempt processed"
  );
}

export const pppoeInteractions: Interaction[] = [
  {
    name: "GET /api/v1/pppoe/packages",
    method: "GET",
    path: "/api/v1/pppoe/packages",
    auth: "bearer",
    status: 200,
    responseBody: pppoePackagesFixture(),
  },
  {
    name: "POST /api/v1/pppoe/packages",
    method: "POST",
    path: "/api/v1/pppoe/packages",
    auth: "bearer",
    status: 200,
    requestBody: { name: "PPPoE Unlimited 8M", uploadSpeed: 8, downloadSpeed: 8, durationDays: 30 },
    responseBody: envelope(pppoePackageFixture(), "PPPoE package created successfully"),
  },
  {
    name: "GET /api/v1/pppoe/packages/{id}",
    method: "GET",
    path: "/api/v1/pppoe/packages/pppoe-pkg-001",
    auth: "bearer",
    status: 200,
    responseBody: envelope(pppoePackageFixture(), "PPPoE package fetched successfully"),
  },
  {
    name: "POST /api/v1/pppoe/accounts",
    method: "POST",
    path: "/api/v1/pppoe/accounts",
    auth: "bearer",
    status: 200,
    requestBody: { customerId: "c-2085", username: "A2085-ppp", password: "Ppp@254-8842", routerId: "pppoe-rt-001", networkDeviceId: 1 },
    responseBody: envelope(pppoeAccountFixture(), "PPPoE account created successfully"),
  },
  {
    name: "GET /api/v1/pppoe/accounts/customer/{customerId}",
    method: "GET",
    path: "/api/v1/pppoe/accounts/customer/c-2085",
    auth: "bearer",
    status: 200,
    responseBody: pppoeAccountsFixture(),
  },
  {
    name: "GET /api/v1/pppoe/accounts/{id}",
    method: "GET",
    path: "/api/v1/pppoe/accounts/pppoe-acct-001",
    auth: "bearer",
    status: 200,
    responseBody: envelope(pppoeAccountFixture(), "PPPoE account fetched successfully"),
  },
  {
    name: "PATCH /api/v1/pppoe/accounts/{id}/suspend",
    method: "PATCH",
    path: "/api/v1/pppoe/accounts/pppoe-acct-001/suspend",
    auth: "bearer",
    status: 200,
    responseBody: envelope(null, "PPPoE account suspended"),
  },
  {
    name: "PATCH /api/v1/pppoe/accounts/{id}/activate",
    method: "PATCH",
    path: "/api/v1/pppoe/accounts/pppoe-acct-001/activate",
    auth: "bearer",
    status: 200,
    responseBody: envelope(null, "PPPoE account activated"),
  },
  {
    name: "GET /api/v1/pppoe/subscriptions/customer/{customerId}",
    method: "GET",
    path: "/api/v1/pppoe/subscriptions/customer/c-2085",
    auth: "bearer",
    status: 200,
    responseBody: pppoeSubscriptionsFixture(),
  },
  {
    name: "POST /api/v1/pppoe/subscriptions/activate",
    method: "POST",
    path: "/api/v1/pppoe/subscriptions/activate",
    auth: "bearer",
    status: 200,
    requestBody: { customerId: "c-2085", packageId: "pppoe-pkg-001", accountId: "pppoe-acct-001" },
    responseBody: envelope(null, "Package assigned successfully"),
  },
  {
    name: "POST /api/v1/pppoe/subscriptions/renew",
    method: "POST",
    path: "/api/v1/pppoe/subscriptions/renew",
    query: { customerId: "c-2085", accountId: "pppoe-acct-001" },
    auth: "bearer",
    status: 200,
    responseBody: envelope(null, "Subscription renewed successfully"),
  },
  {
    name: "POST /api/v1/pppoe/payments/stk-push",
    method: "POST",
    path: "/api/v1/pppoe/payments/stk-push",
    auth: "bearer",
    status: 200,
    requestBody: { customerId: "c-2085", phoneNumber: "0726837210", amount: 2000, accountId: "pppoe-acct-001", subscriptionId: "pppoe-sub-001" },
    responseBody: envelope(null, "STK push initiated successfully"),
  },
  {
    name: "POST /api/v1/pppoe/radius/auth",
    method: "POST",
    path: "/api/v1/pppoe/radius/auth",
    auth: "public",
    status: 200,
    requestBody: { username: "A2085-ppp", password: "Ppp@254-8842", nasIpAddress: "10.0.0.1", routerIp: "192.168.1.1" },
    responseBody: radiusAuthFixture(),
  },
];
export const allInteractions: Interaction[] = [
  ...authInteractions,
  ...hotspotInteractions,
  ...customerInteractions,
  ...customerLifecycleInteractions,
  ...networkInteractions,
  ...sessionInteractions,
  ...ticketInteractions,
  ...packageInteractions,
  ...systemSetupInteractions,
  ...systemUserInteractions,
  ...statementInteractions,
  ...expenseInteractions,
  ...notificationProviderInteractions,
  ...analyticsInteractions,
  ...auditInteractions,
  ...paymentInteractions,
  ...networkRouterInteractions,
  ...geoInteractions,
  ...provisioningInteractions,
  ...networkDeviceInteractions,
  ...bootstrapInteractions,
  ...pppoeInteractions,
];
