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
  RegionResponse,
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

/**
 * Build a structurally-decodable mock JWT carrying a `role` claim. Used by the
 * login fixture so the hardened MSW `requireAuth` can reproduce real backend
 * 403s for role-gated routes (SYSADMIN/ADMIN/01). Signature is a static mock —
 * providers verify shape/type via Pact matchers, never this literal value.
 */
export function buildRoleJwt(role: string, subject = "1"): string {
  const b64u = (input: string) =>
    (typeof btoa === "function"
      ? btoa(input)
      : Buffer.from(input, "utf8").toString("base64")
    ).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const header = b64u(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = b64u(
    JSON.stringify({ sub: subject, role, iat: 1_700_000_000 })
  );
  return `${header}.${payload}.mock-signature`;
}

export interface LoginFixtureData {
  token: string;
  username: string;
  role: string;
  refreshToken?: string;
}

export function loginFixture(overrides: Partial<LoginFixtureData> = {}): ApiResponse<LoginFixtureData> {
  return envelope(
    {
      token: buildRoleJwt("SYSADMIN"),
      username: "admin",
      role: "SYSADMIN",
      refreshToken: "login-time-refresh-token",
      ...overrides,
    },
    "Login successful"
  );
}

export function accountTypeFixture(overrides: { accountType?: "CUSTOMER" | "SYSADMIN" | "INVALID" } = {}): ApiResponse<{
  accountType: "CUSTOMER" | "SYSADMIN" | "INVALID";
}> {
  return envelope(
    {
      accountType: overrides.accountType ?? "CUSTOMER",
    },
    "Account type resolved"
  );
}

export function refreshTokenFixture(): ApiResponse<{ token: string }> {
  return envelope({ token: buildRoleJwt("SYSADMIN") }, "Token refreshed");
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

/**
 * TV-category active packages served by `GET /api/v1/hotspot/packages?category=TV`
 * (backend filters by `packageCategory = 'TV'`; frontend maps each to `TvPackage`).
 */
export function activeTvPackagesFixture(): ApiResponse<NetPackage[]> {
  return envelope(
    [
      {
        idxno: 7,
        packageName: "TV 24H",
        price: 150,
        packageCategory: "TV",
        validityType: "HOURS",
        validityValue: 24,
        bandwidthType: "SHARED",
        activeStatus: true,
        speedDownload: 15,
        speedUpload: 15,
        rateLimit: "15M/15M",
        maxDevices: 1,
      },
      {
        idxno: 8,
        packageName: "TV 7 DAYS",
        price: 800,
        packageCategory: "TV",
        validityType: "DAYS",
        validityValue: 7,
        bandwidthType: "UNLIMITED",
        activeStatus: true,
        speedDownload: 20,
        speedUpload: 10,
        rateLimit: "20M/10M",
        maxDevices: 2,
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
      stationId: "STN-001",
      companyId: "CMP-BSM-001",
    },
    "Hotspot session initiated successfully",
    201
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

export function regionsTreeFixture(): ApiResponse<RegionResponse[]> {
  return envelope(
    [
      {
        idxno: 1,
        regionCode: "REG-KE-COAST",
        name: "Coast Region",
        description: "Coastal region of Kenya",
        isActive: true,
        createdAt: "2026-01-01T00:00:00.000Z",
        locations: [
          {
            idxno: 1,
            regionIdxno: 1,
            regionName: "Coast Region",
            name: "Mombasa Central",
            latitude: -4.0435,
            longitude: 39.6682,
            isActive: true,
            createdAt: "2026-01-01T00:00:00.000Z",
            stations: [
              {
                idxno: 1,
                locationIdxno: 1,
                locationName: "Mombasa Central",
                name: "Mombasa Station 01",
                powerType: "Grid",
                backhaulType: "Fiber",
                isActive: true,
                createdAt: "2026-01-01T00:00:00.000Z",
              },
            ],
          },
        ],
      },
    ],
    "Regions tree retrieved"
  );
}

/** `PATCH /api/v1/network-routers/{id}/action` response — mirrors backend `RouterActionResponse`. */
export function routerActionFixture(request: {
  action?: string;
  routerId?: number;
  routerName?: string;
  ipAddress?: string;
  nodeStatus?: string;
  executionStatus?: "SUCCESS" | "FAILED";
  message?: string;
}): ApiResponse<{
  routerId: number;
  routerName: string;
  ipAddress: string;
  action: string;
  nodeStatus: string;
  executionStatus: string;
  message: string;
  error?: string;
  timestamp: string;
}> {
  return envelope(
    {
      routerId: request.routerId ?? 1,
      routerName: request.routerName ?? "RTR-BDK-MSA-001",
      ipAddress: request.ipAddress ?? "10.8.1.10",
      action: request.action ?? "REFRESH",
      nodeStatus: request.nodeStatus ?? "ONLINE",
      executionStatus: request.executionStatus ?? "SUCCESS",
      message: request.message ?? "Router action executed successfully",
      timestamp: new Date().toISOString(),
    },
    "Router action executed successfully"
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
    "Router onboarded successfully",
    201
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
  deviceName: string;
  idxno: number;
}> {
  return envelope(
    {
      customerIdxno: 1,
      macAddress: "AA:BB:CC:DD:EE:FF",
      deviceName: "Smart TV",
      idxno: 501,
    },
    "Customer device bound successfully",
    201
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
        routerName: "RTR-BDK-MSA-A",
        status: "ONLINE",
        lastSeen: "2026-08-26T07:59:00+03:00",
      },
      {
        ipAddress: "10.0.19.114",
        macAddress: "D0:9C:0B:7E:33:A1",
        username: "P-114",
        serviceType: "PPPOE",
        stationName: "Adrinold Ukunda",
        routerName: "RTR-BDK-MSA-B",
        status: "ONLINE",
        lastSeen: "2026-08-26T07:58:00+03:00",
      },
      {
        ipAddress: "172.16.0.73",
        macAddress: "70:2F:7C:90:AE:1E",
        username: "A4290",
        serviceType: "HOTSPOT",
        stationName: "ADRNOLDNETWORKS",
        routerName: "RTR-BDK-MSA-A",
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
    name: "POST /api/v1/auth/account-type",
    method: "POST",
    path: "/api/v1/auth/account-type",
    auth: "public",
    status: 200,
    requestBody: { username: "admin", password: "secret" },
    responseBody: accountTypeFixture({ accountType: "SYSADMIN" }),
  },
  {
    name: "POST /api/v1/auth/sysadminlogin (direct bypass)",
    method: "POST",
    path: "/api/v1/auth/sysadminlogin",
    auth: "public",
    status: 200,
    requestBody: { username: "nicanornicolas", password: "secret" },
    responseBody: envelope(
      {
        username: "nicanornicolas",
        role: "SYSADMIN",
        token: buildRoleJwt("SYSADMIN"),
      },
      "SysAdmin login successful"
    ),
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
    name: "GET /api/v1/hotspot/packages?category=TV",
    method: "GET",
    path: "/api/v1/hotspot/packages",
    query: { category: "TV" },
    auth: "public",
    status: 200,
    responseBody: activeTvPackagesFixture(),
  },
  {
    name: "POST /api/v1/hotspot/initiate",
    method: "POST",
    path: "/api/v1/hotspot/initiate",
    auth: "public",
    status: 201,
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
    name: "GET /api/v1/network/regions (tree)",
    method: "GET",
    path: "/api/v1/network/regions",
    query: { tree: "true" },
    auth: "bearer",
    status: 200,
    responseBody: regionsTreeFixture(),
  },
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
    status: 201,
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
    status: 201,
    requestBody: { customerIdxno: 1, macAddress: "AA:BB:CC:DD:EE:FF", deviceName: "Smart TV" },
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

export const allInteractions: Interaction[] = [
  ...authInteractions,
  ...hotspotInteractions,
  ...customerInteractions,
  ...networkInteractions,
  ...sessionInteractions,
];

export const unauthorizedFixture = (status = 401): ApiResponse<null> =>
  errorEnvelope(status, status === 403 ? "Forbidden" : "Unauthorized");

/** Network-level failure (no HTTP response) — used by graceful-degradation tests. */
export function networkErrorFixture(): { name: string; message: string } {
  return { name: "FetchError", message: "Network request failed" };
}