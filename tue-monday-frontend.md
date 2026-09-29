# Backend → Frontend Handoff (2026-09-21 / 2026-09-22)

13 new endpoints shipped. All backend API audit gaps closed (12 area list from frontend document).
Auth: Bearer token on every call (JWT). Every endpoint is behind role checks.
Base path: `/api/v1`
All responses are wrapped in `{ success: bool, message: string, data: <DTO here> }` via `ApiResponse<T>`.

---

## TL;DR: per-file wire-up map

| Frontend file | New endpoint(s) to call | What to DELETE locally |
|---|---|---|
| `actions/dashboard.ts` | `GET /dashboard/operations-cockpit` (existing) | Rename `tenantName` → `companyName`. Delete `EMPTY_DASHBOARD` fallback (or keep for offline mode only). |
| `actions/analytics.ts` | `GET /analytics/unified` | Delete `FALLBACK_ANALYTICS`. 1 call replaces the old partial-analytics endpoints. |
| `actions/subscribers.ts` | `GET /subscribers/hub` | Delete `FALLBACK_KPIS` and `FALLBACK_SUBSCRIBERS`. 1 call returns `{kpis, rows}` joined shape. |
| `actions/sessions.ts` | `GET /sessions/live` | Delete `hashString()` helper + its comment. Use real `downloadBytes`/`uploadBytes` from the response. KPI counters in same response. Delete `FALLBACK_SESSION_KPIS` + `FALLBACK_LIVE_SESSIONS`. |
| `actions/provisioning.ts` | `GET /provisioning/nas-routers` | Delete `FALLBACK_NAS_KPIS`, `FALLBACK_NAS_ROUTERS`, and the dual-id stitching code. Both `routerId` and `deviceId` are now in every row. Use `routerId` (network_routers.idxno) for telemetry/action endpoints; use `deviceId` (network_device.id) for provisioning endpoints. |
| `actions/equipment.ts` | `GET /equipment`, `POST /equipment`, `PATCH /equipment/{id}`, `GET /equipment/{id}/history` | Delete `FALLBACK_EQUIPMENT_KPIS`, `FALLBACK_EQUIPMENT_LIST`, and the `S${device.id}` serial synthesis. Use `costPrice`, `paidSoFar`, `serialNumber` directly. Derived booleans (`returned`, `damaged`, `sold`) are in the response. |
| `actions/vouchers.ts` | (unchanged) `GET /hotspot/vouchers`, `POST /hotspot/vouchers/create`, `GET /hotspot/vouchers/statistics` | Map field renames: `voucherBatchId` → `batchNumber`, `clientPhone` → `redeemedByPhone`, `macAddress` → `redeemedByMac`. Package catalog: `GET /system/packages/active` (still works). Delete `FALLBACK_KPIS`/`FALLBACK_VOUCHERS`. |
| `actions/companies.ts` | (unchanged) `GET /companies` | Delete `FALLBACK_COMPANIES` static array. |
| `actions/network.ts` | (rewritten) `GET /network/ip-pools` | Delete "IP pools are hardcoded fixtures" comment. Pools now return live lease counts from MikroTik + live WireGuard peer counts. |
| `actions/tv.ts` | `POST /tv/devices/verify` → `GET /tv/packages/eligible` → `POST /tv/payments/initiate` → poll `GET /tv/payments/{transactionRef}/status` | Replace every TODO comment with the 4-step call sequence. **Never trust browser amount**; backend returns 409 `AMOUNT_MISMATCH` with correct `serverAmount` if client and backend disagree. |
| `OnboardingWizard.tsx` | `GET /companies` | Delete static `CMP-BSM-001` / `CMP-BDK-001` / `CMP-ADR-001` options. Populate company selector from `/companies`. |
| `AlertsClient.tsx` | (static CHANNELS / NOTIF_CATEGORIES is OK for now) | No backend work required. Leave as-is unless tenant customization is needed. |

---

## ENDPOINT SPECS (copy-paste references)

### 1. IP pools — live utilization (rewrote the hardcoded list)

```
GET /api/v1/network/ip-pools
Roles: SYSADMIN, ADMIN, 01
```

Response body (array wrapped in ApiResponse):

```ts
interface IpPoolResponse {
  poolName: string;                 // "Hotspot Pool" / "PPPoE Pool" / "WireGuard Pool" / "TV Pool"
  subnet: string;                   // CIDR e.g. "10.50.50.0/24"
  gateway: string | null;           // e.g. "10.50.50.1"
  totalIps: number;                 // subnet size minus (network + gateway + broadcast reserved), never 0
  usedIps: number;                  // max(DB cached count, live MikroTik lease count inside subnet)
  availableIps: number;             // totalIps - usedIps
  utilizationPercentage: number;    // (usedIps / totalIps) * 100, 0..100
  serviceType: string;              // enum: "HOTSPOT" | "PPPOE_WAN" | "WIREGUARD" | "TV" | "LOOPBACK"
}
```

Notes:
- WireGuard pool counts `enabled = true` peers from `wg_mikrotik_wireguard_peer` table (no device).
- First call after boot may take ~1-2s due to live router probe; subsequent calls use stored counters updated at read-time.

---

### 2. Live sessions with real RADIUS octets (replaces hashString hack)

```
GET /api/v1/sessions/live?page=0&size=50&companyId=<optional>&stationId=<optional>
Roles: SYSADMIN, ADMIN, 01, 02, 03
```

Response:

```ts
interface LiveSessionListResponse {
  kpis: {
    currentlyConnected: number;
    pppoeCount: number;
    hotspotCount: number;
    downloadBytesTotal: string;      // bigint as string to avoid 32-bit float truncation
    uploadBytesTotal: string;
    totalBytesTotal: string;
  };
  sessions: {
    content: LiveSessionDTO[];
    totalElements: number;
    totalPages: number;
    number: number;                  // current page index
    size: number;
  };
}

interface LiveSessionDTO {
  subscriberCode: string | null;
  subscriberName: string | null;
  protocol: "PPPoE" | "Hotspot" | "TV_MAB";
  deviceMac: string | null;
  assignedIp: string | null;
  routerName: string | null;
  routerManagementIp: string | null;
  downloadBytes: number | null;      // REAL values from radacct acctoutputoctets / hotspot counters
  uploadBytes: number | null;        // REAL values from radacct acctinputoctets / hotspot counters
  onlineDurationFormatted: string;   // "2d 14h 03m" / "34m 12s"
  connectedAt: string;               // ISO-8601 instant UTC
  expiryFormatted: string;           // "3 days left" / "Expires today" / "—"
}
```

Notes:
- `downloadBytes` / `uploadBytes` use RadacctByteMath (handles BIGINT rollover from FreeRADIUS correctly). If a row genuinely has no counters (very rare edge case), value is `0` not `null`.
- Protocol values are EXACT strings above — no casing variants. Use the string directly in UI badges.

---

### 3. Subscriber hub — joined endpoint (replaces FALLBACK_SUBSCRIBERS + FALLBACK_KPIS)

```
GET /api/v1/subscribers/hub?page=0&size=25&statusFilter=<optional>&companyId=<optional>&search=<optional>
Roles: SYSADMIN, ADMIN, 01, 02, 03
```

```ts
interface SubscriberHubResponse {
  kpis: {
    allUsersCount: number;
    expiringIn7DaysCount: number;
    newThisWeekCount: number;         // users with createdAt in [today - 6d, today] inclusive
    onlinePercentage: number;         // e.g. 42.7 (already rounded to 1 decimal)
    onlineCount: number;
    atRiskCount: number;              // rows with status GRACE
  };
  rows: {
    content: SubscriberHubRow[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
  };
}

interface SubscriberHubRow {
  id: number;                         // user.user_idxno
  code: string | null;                // subscriber code / username
  fullName: string | null;
  phone: string | null;
  email: string | null;
  type: "PPPOE" | "HOTSPOT" | "TV_BUNDLED";
  planName: string | null;
  planSpeed: string | null;           // e.g. "50 Mbps" (pre-formatted)
  planPrice: string | null;           // BigDecimal as string to preserve precision
  expiryText: string | null;          // human friendly, use for list display
  expiryDate: string | null;          // ISO yyyy-MM-dd (Africa/Nairobi calendar date)
  isExpiringToday: boolean;           // true if expiryDate == server today EAT
  status: "ACTIVE" | "GRACE" | "EXPIRED" | "SUSPENDED";
  nasName: string | null;             // NAS identifier name
  deviceType: string | null;          // customer device category from primary device
  macAddress: string | null;          // primary / latest customer device MAC
  ipAddress: string | null;           // latest active framed-ip or IP mapping
}
```

Status derivation rules (for reference — already computed server-side):
- ACTIVE: subscription active, not expired, no unpaid balance threshold exceeded
- GRACE: within grace period past expiry (still online)
- EXPIRED: grace passed, no active session
- SUSPENDED: account disabled (no session will authenticate)

Search param matches fullname ILIKE OR username ILIKE OR phone_number ILIKE. Partial match supported.

---

### 4. Unified analytics dashboard shape

```
GET /api/v1/analytics/unified
Roles: SYSADMIN, ADMIN, 01, 02
```

```ts
interface AnalyticsDashboardResponse {
  kpis: {
    revenue30d: string;
    profit30d: string;
    marginPct: string;
    subscriberCount: number;
    activeSubscriptionCount: number;
    churnRate30d: string;
    topPackageName: string | null;
    arpu30d: string;
    avgDaysToPay: string;
    uncollectedInvoices30d: string;
    badDebtExpense30d: string;
  };
  paymentsTrend: { points: { date: string; revenue: string }[] };
  paymentsVsExpenses: { points: { date: string; revenue: string; expense: string; profit: string }[] };
  topPackages: { packageId: number; packageName: string; revenue30d: string; newSubs30d: number; sharePct: number }[];
  topCustomers: { /* shape identical to existing /analytics/payments/top-customers */ }[];
  revenueMix: { bucket: string; amount: string; sharePct: number }[];  // buckets: 4100 PPPoE, 4200 Hotspot, 4130 TV, other_revenue
  paymentMethodsMix: { method: string; count: number; totalAmount: string; sharePct: number }[]; // M-Pesa / Cash / Bank / Other
  routerPerformance: {
    routerName: string;
    activeSessions: number;
    dataTransferredGb: number;
    healthScore: number;              // 0..100 (cpu + mem + latency weighted)
    latencyMs: number;
  }[];
}
```

Notes:
- All `string` numeric values are BigDecimal. Parse to JS `Big` or equivalent for money displays — never `parseFloat` into a display.
- `revenueMix[]` sum equals `kpis.revenue30d` within 0.01 rounding. Unit test on backend guarantees this.

---

### 5. NAS routers — dual-id unified list (no more local ID stitching)

```
GET /api/v1/provisioning/nas-routers
Roles: SYSADMIN, ADMIN, 01, 02, 03
```

```ts
interface NasRouterListResponse {
  kpis: {
    totalCount: number;
    onlineCount: number;
    offlineCount: number;
    healthyCount: number;
    cpuAvg: number;                   // percentage
    memoryAvg: number;                // percentage used
    activeSessionsTotal: number;
  };
  rows: NasRouterRow[];
}

interface NasRouterRow {
  routerId: number | null;            // network_routers.idxno — USE for telemetry and router-action endpoints
  deviceId: number | null;            // network_device.id — USE for provisioning endpoints
  name: string;
  model: string | null;
  serialNumber: string | null;
  status: "ONLINE" | "OFFLINE" | "DEGRADED" | "NOT_PROVISIONED";
  online: boolean;
  managementIp: string | null;
  winboxTunnelAddress: string | null;
  winboxTunnelPort: number | null;
  activeSessions: number | null;      // from latest snapshot (pppoe + hotspot sessions)
  cpuUsage: number | null;            // percentage
  freeMemory: number | null;          // bytes
  totalMemory: number | null;         // bytes
  uptime: string | null;              // human-readable, e.g. "14d 02h"
  snapshotAt: string | null;          // ISO local datetime of last health probe
  companyCode: string | null;
  stationName: string | null;
}
```

Notes:
- Orphan rows ARE intentionally included. Rows from `network_device` without a matching `network_routers` entry have `routerId: null`; router rows without device have `deviceId: null`.
- Dedup is deterministic: name exact match wins over management-IP match. No duplicates.
- **Backend safety rule: always send the right ID for the right endpoint.** Never guess: `routerId` → telemetry actions; `deviceId` → provisioning actions.

---

### 6. Equipment / asset register (4 endpoints)

```
GET    /api/v1/equipment?status=INSTALLED&type=ROUTER&page=0&size=50&search=
POST   /api/v1/equipment
PATCH  /api/v1/equipment/{assetId}
GET    /api/v1/equipment/{assetId}/history
Roles: SYSADMIN, ADMIN, 01, 02
```

List + KPIs:

```ts
interface EquipmentListResponse {
  kpis: {
    totalAssets: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    totalCost: string;
    totalUnpaid: string;
    installedThisMonthCount: number;
    damagedCount: number;
  };
  items: {
    content: AssetItemResponse[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
  };
}

interface AssetItemResponse {
  id: number;
  name: string;                       // asset tag, e.g. "AS-RTR-0021"
  type: "ROUTER" | "SWITCH" | "CPE_MODEM" | "ONU" | "ANTENNA" | "SMART_TV" | "WIFI_AP" | "CABLE";
  model: string;
  serialNumber: string;               // REAL value now, delete local `S${id}` synthesis
  status: "IN_STOCK" | "INSTALLED" | "RETURNED" | "DAMAGED" | "SOLD" | "RMA";
  costPrice: string;                  // BigDecimal as string
  paidSoFar: string;                  // BigDecimal as string
  createdAt: string;                  // ISO local datetime
  assignedSubscriberName: string | null;
  returned: boolean;                  // convenience bool, derived from status
  damaged: boolean;                   // convenience bool
  sold: boolean;                      // convenience bool
}
```

Create / Patch bodies:
- `CreateEquipmentRequest`: mirror AssetItemResponse minus id/createdAt/derived bools + optional FK columns (companyId, stationId, assignedToUserIdxno, linkedNetworkDeviceId, linkedNetworkRouterIdxno, linkedCustomerDeviceId).
- `PatchEquipmentRequest`: same fields all optional; partial update.
- History endpoint returns rows of `{ changedAt, changedBy, fieldName, oldValue, newValue }` covering every field.

Notes:
- `POST` validates asset_tag + serial_number uniqueness. Returns 409 Conflict on duplicate with field name in message.
- Seeded rows from existing routers + CPEs: routers have real serialNumber (from network_routers.serial_number); CPEs got placeholder asset_tags because there's no source serial; operator corrects via PATCH.

---

### 7. TV prepayment flow — 4 endpoints. REPLACE EVERY TODO in actions/tv.ts.

Four-step sequence:

#### Step 1 — Verify device

```
POST /api/v1/tv/devices/verify
Roles: all logged-in users including CUSTOMER (05)
```

```ts
interface TvDeviceVerifyRequest {
  customerPhone: string;              // required in backend validation
  macAddress: string;                 // required
  postalAddress?: string;             // optional
  selectedPackageId?: number;         // optional; if given, backend validates it against TV catalog
}

interface TvDeviceVerifyResponse {
  eligible: boolean;                  // false only on contract-breaking inputs (bad phone format / invalid MAC / nonexistent selectedPackageId)
  existingCustomer: {
    id: number;
    name: string;
    pendingTvCredits: string | null;  // unused/expired TV entitlement balance, if any
  } | null;
  nearestStationId: number | null;
  recommendedPackages: TvPackageOption[];
  softWarnings: string[];             // e.g. ["DEVICE_NOT_YET_SEEN_ON_NETWORK"]
}

interface TvPackageOption {
  packageId: number;
  name: string;
  validityLabel: string;              // "30 days"
  speedLabel: string | null;          // if applicable, for TV speed is usually null
  price: string;
  availableForDevice: boolean;
  notes: string | null;
}
```

Rule: DEVICE_NOT_YET_SEEN_ON_NETWORK does NOT block purchase. The customer hasn't plugged it in yet on install day. Only show as informational warning or inline tooltip.

#### Step 2 — Load eligible packages (or skip if Step 1 recommendedPackages is enough)

```
GET /api/v1/tv/packages/eligible?companyCode=&stationId=&macAddress=
```

Same `TvPackageOption[]` array as Step 1 but without verification context.

#### Step 3 — Initiate payment

```
POST /api/v1/tv/payments/initiate
HEADER: Idempotency-Key: <UUID>       REQUIRED. 400 if missing. Replay returns cached response, NEVER double-charges.
Roles: all logged-in users including CUSTOMER (05)
```

```ts
interface TvPaymentInitiateRequest {
  customerId?: number;                // optional if known; if not, backend creates guest user via existing TvProvisioningService guest-path
  phone: string;                      // REQUIRED
  macAddress: string;                 // REQUIRED (TV_MAB needs a MAC to provision VLAN 30 + IGMP)
  packageId: number;                  // REQUIRED
  submittedAmount: string;            // REQUIRED — BigDecimal as string. Server re-fetches package and compares.
}

interface TvPaymentInitiateResponse {
  transactionReference: string;       // USE for poll step below
  mpesaStkPushTriggered: boolean;     // true if phone is Safaricom and STK went out
  checkoutRequestId: string | null;
  statusUrl: string;                  // convenience: /api/v1/tv/payments/{transactionReference}/status
  validationOutcome: {
    valid: boolean;
    serverAmount: string;             // canonical correct amount
    message: string | null;
  };
}
```

Error response shape on amount mismatch:
- `HTTP 409 Conflict` with `message = "AMOUNT_MISMATCH"` and the response body includes `validationOutcome.serverAmount` set to the correct value. **Never accept the browser's amount as truth.** Always update your UI state with `serverAmount` and resubmit if the user confirms the new figure.

Idempotency rule: same `Idempotency-Key` + same user + same endpoint → cached response returned in `IdempotencyInterceptor` BEFORE controller runs. Controller body never executes twice. Generate a NEW key if the user intentionally retries after correcting the amount.

#### Step 4 — Poll status until SETTLED or FAILED

```
GET /api/v1/tv/payments/{transactionRef}/status
```

```ts
interface TvPaymentStatusResponse {
  transactionReference: string;
  state: "PENDING" | "SETTLED" | "FAILED" | "TIMED_OUT";
  settledAt: string | null;           // ISO local datetime
  failedReason: string | null;
  provisionedAt: string | null;       // null until RADIUS write + entitlement actually happen
  provisioningAttempts: number | null;
  tvEntitlementExpiresAt: string | null;
}
```

Poll strategy: every 3s for the first 60s, then back off to 10s, timeout after 15 min total. When `state === "SETTLED"` AND `provisionedAt !== null`, your job is done. If state is `SETTLED` but `provisionedAt` is still null for > 60s, display inline: "Paid. Service activating — please wait 1-2 min and refresh." (this is the "parked" path; ops auto-recovers it). If it stays parked for > 5 min, show a "Contact support" link with transactionReference in the body.

**CRITICAL SAFETY: TV initiate writes NO GL posting and triggers NO provisioning.** Both happen exclusively in the UnifiedPaymentCallbackService when M-Pesa settlement callback arrives and commits the ledger. This follows the company hard rule: *provisioning is triggered only by a committed financial ledger posting.*

---

## Appendix A — Existing endpoints you can stop wrapping fallbacks around (no code change on backend)

- Dashboard operations cockpit: `GET /dashboard/operations-cockpit` → `OperationsCockpitResponse`. Just rename `tenantName` → `companyName`.
- Voucher list/generate/statistics: `GET /hotspot/vouchers`, `POST /hotspot/vouchers/create`, `GET /hotspot/vouchers/statistics`. Field renames only.
- Package catalog: `GET /system/packages/active` and `GET /system/packages/category/{category}`. Use category=TV for TV voucher modal packages.
- Company list: `GET /companies`. Exact fields: id, code, name, alias.

---

## Appendix B — Known minor caveat (tracked follow-up)

1. **TV callback match-key set**: UnifiedPaymentCallbackService currently matches settled payments by `checkoutRequestId` only. For M-Pesa STK this is fine because the initiate always writes one. For a hypothetical future TV non-STK payment rail (cash, card, bank), a `transaction_reference` OR-match branch would be needed. Not a live bug, not urgent; backend ticket exists to add the additive OR match. Everything works today via existing checkoutRequestId path.
2. **NetworkDevice telemetry `dataTransferredGb` for router performance in `/analytics/unified`**: populated from SNMP throughput counters if SNMP polling is running on that device; otherwise 0 with a code TODO. Once interface-by-interface counters are wired into snapshots, this becomes accurate automatically with no frontend change.

---


