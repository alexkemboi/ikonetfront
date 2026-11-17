# Frontend Handover: Backend Answers to BACKEND_API_CONCERNS.md

**Date:** Monday 2026-09-28
**From:** Backend (Brian)
**For:** Frontend engineer wiring the dashboard, subscribers, sessions, analytics, routers, equipment, IP pools, vouchers, packages and the TV captive-portal flow
**Backend state:** merged into `dev` (upstream PRs #153 to #157, plus teammate follow-ups #159 to #163)

Every numbered concern in `BACKEND_API_CONCERNS.md` now has a backend answer. This file tells you, per concern, **what the backend now returns and what you need to change in the frontend**. The field names and rules below were read from the merged code on `dev`, not from memory.

Swagger (`/swagger-ui` on any running API) has the same contracts in the endpoint and schema descriptions. If this file and Swagger ever disagree, tell Brian; one of them is wrong.

---

## 0. Read this first: rules that apply to every endpoint

These are global. Build them into `lib/apiClient.ts` / shared helpers once, not per page.

### 0.1 Envelope

Every response, success or failure, uses the same envelope:

```ts
interface ApiResponse<T> {
  status: number;        // HTTP status, repeated
  success: boolean;
  message: string;       // human text on success; a STABLE CODE on most errors
  data: T;
  timestamp: string;     // UTC instant, e.g. "2026-09-28T07:15:04Z"
}
```

Unknown paths, 405s and filter-level failures now also return this envelope (no more Spring HTML/whitelabel pages).

### 0.2 Errors: codes, not text

| HTTP | `message` | `data` | Meaning |
|---|---|---|---|
| 503 | `DATA_SOURCE_UNAVAILABLE` | `{ requestId }` | Database or query failed. Show "unavailable", never zeros. |
| 503 | `DASHBOARD_UNAVAILABLE` | `{ requestId }` | `/dashboard/admin` data source down. |
| 503 | `LIVE_SESSIONS_UNAVAILABLE` | `{ requestId }` | `/sessions/live` data source down. |
| 503 | `UPSTREAM_UNAVAILABLE` | `{ requestId }` | An external system (router, M-Pesa) did not answer. |
| 409 | `DATA_CONFLICT` | `{ requestId }` | Unique / FK / check constraint hit. |
| 500 | `INTERNAL_ERROR` | `{ requestId }` | Unclassified bug. Nothing else is leaked. |
| 403 | `Access Denied` / `FORBIDDEN` | | Role not allowed, or asked for another company. |
| 404 | `NOT_FOUND` | `{ requestId }` | Unknown route. |
| 400 | `Validation failed` | `{ field: message }` | Bean validation errors, keyed by field. |

Coded business errors (vouchers, packages, TV) put the code in **both** `message` and `data.code`, plus extra fields (for example `data.serverAmount`). Always branch on `data.code ?? message`, never on the human text.

No response body contains SQL, table names, stack traces or tokens any more.

### 0.3 Request id (support correlation)

- Every response has an `X-Request-Id` header. Every error body has `data.requestId` with the same value.
- You may send your own `X-Request-Id` (8 to 64 chars, `[A-Za-z0-9._-]`); the backend keeps it end to end. Anything else is replaced.
- **Do this:** when you render an error or "unavailable" state, show the request id in small text ("Ref: 3f0c...") so an operator can quote it. Support finds the exact server log line with it.

### 0.4 Money and big counters are strings

- Money: **decimal string, scale 2, KES** (`"12500.00"`). Currency is named in the response where there is one.
- Byte counters: **integer string** (`"8589934597"`).
- `null` stays JSON `null`.
- **Do not** run `Number(...)`, `parseFloat`, `+`, or `reduce` over these. Display them as-is (format with a string formatter), or use a decimal library (`decimal.js` / `big.js`) if you genuinely need arithmetic. Prefer asking the backend for the total; most totals are already returned.
- Concern #6 acceptance test: `"100000000000000.01"` must render exactly that, digit for digit.

### 0.5 Time

| Kind | Format | Example | Rule |
|---|---|---|---|
| Instant | ISO-8601 UTC with `Z` | `"2026-09-28T07:12:00Z"` | Safe to `new Date(...)`, format in the user's zone. |
| Date-only | `YYYY-MM-DD` | `"2026-10-01"` | An Africa/Nairobi business date. **Do not** pass to `new Date()` (it becomes UTC midnight and can shift a day). Render as text, or parse as a plain date. |
| Month | `YYYY-MM` | `"2026-09"` | Chart buckets. |

"Today", "this week", "expiring in 7 days", "this month" are all computed by the backend in `Africa/Nairobi`. Do not recompute them in the browser.

### 0.6 Pagination

Paged endpoints return a Spring `Page`. Rely only on these fields:

```ts
interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;   // zero-based page index
  size: number;
}
```

Ignore `pageable`, `sort`, `first`, `last`, etc.; they are framework output and may change. Query params: `?page=0&size=25&sort=field,desc`. Most endpoints clamp `size` to 1..200.

### 0.7 Null vs zero (concern #2, applies everywhere)

- `0` / `"0.00"` is always a **measured** zero.
- `null` means **not available** (no data source, source failed, or undefined for this data).
- Where a response has `unavailableMetrics`, every null metric is listed there with a reason.
- **Do this:** render `null` as "-" with a tooltip "Not available" (or the reason), never as 0. Kill every `?? 0` / `|| 0` on API values.

### 0.8 Tenancy

- Non-SYSADMIN users are pinned to their JWT company. Sending another `companyId` gives 403. You can drop `companyId` for them entirely.
- SYSADMIN picks a company with the `X-Company-Context` header (or `companyId` query param where listed). No company means "all companies" on read endpoints.
- Most responses echo the **effective** scope back (`companyId`, `scope`, `query`). Show that in the UI when it helps ("All companies" vs "IBS").

---

## 1. Admin dashboard (concerns #1, #2)

**Decision: Option B.** New endpoint. It **replaces** the admin page's multi-call data source (`/customers`, `/customers?isActive=true`, package and device counts). The operations cockpit stays as-is for the operations page.

`GET /api/v1/dashboard/admin?companyId=` (roles SYSADMIN, ADMIN, 01, 02)

```ts
interface AdminDashboardResponse {
  dataStatus: "COMPLETE" | "PARTIAL";
  unavailableMetrics: Array<{ metric: string; reason: string }>; // e.g. {metric:"alerts.fraudAlerts", reason:"NO_DATA_SOURCE"}
  generatedAt: string;          // instant
  companyId: string | null;     // null = all companies (SYSADMIN)
  period: {
    from: string; to: string;   // date-only, month to date
    timezone: "Africa/Nairobi";
    currency: "KES";
    daily:   { from: string; to: string };  // today
    weekly:  { from: string; to: string };  // last 7 days incl. today
    monthly: { from: string; to: string };  // month to date
  };
  customers: { total; active; inactive; pppoe: number | null } | null;
  packages:  { total; active; inactive: number | null } | null;
  devices:   { total; online; offline; healthyRouters; degraded; notProvisioned: number | null } | null;
  revenue: {
    daily: string; weekly: string; monthly: string;       // GL revenue
    active: null; inactive: null;                          // always null, see below
    expected: string;        // invoices due month to date
    collected: string;       // payments actually received month to date
    outstanding: string;     // open invoices now (UNPAID, PENDING, OVERDUE)
    failedPayments: number;
    hotspot: string; pppoe: string; tv: string;            // GL by product, month to date
    suspendedRevenueLoss: null;                            // always null
    currency: "KES";
  } | null;
  alerts: {
    offlineRouters; highCpuRouters; highMemoryRouters;
    expiringCustomers; expiredAccounts;
    failedPppoeSessions; failedHotspotSessions;
    networkCongestion;        // always null (no signal collected)
    slaBreaches;
    failedPaymentCallbacks;   // null for company-scoped callers
    smsFailures;
    fraudAlerts;              // always null
    bandwidthAlerts;          // always null
  } | null;                   // each: number | null
  operations: {
    activePppoeSessions: number | null;
    activeHotspotSessions: number | null;
    currentBandwidthMbps: null; peakBandwidthMbps: null; uptimePercentage: null; // always null
    churnRate: number | null;     // 30-day %, JSON number
    supportTickets: number | null;
  } | null;
  revenueTrend:     Array<{ period: "YYYY-MM"; revenue: string; collected: string }>; // 12 months, oldest first
  subscriberGrowth: Array<{ period: "YYYY-MM"; subscriberCount: number }>;          // 12 months, oldest first
}
```

**Frontend changes**

1. `actions/dashboard.ts`: call `/dashboard/admin` once. Delete the package-price revenue calculation and every derived revenue number.
2. `DashboardShell.tsx`: delete the chart generation. Plot `revenueTrend` and `subscriberGrowth` directly (parse money strings only for chart height, display the string in tooltips).
3. On 503 `DASHBOARD_UNAVAILABLE`: render an "unavailable" state with the request id. **Do not** return the zero-filled fallback object any more (that was concern #2).
4. If `dataStatus === "PARTIAL"`: show a small banner ("Some figures could not be loaded"); the affected fields are `null` and listed in `unavailableMetrics` with `reason: "SOURCE_ERROR"`.
5. Metrics that are **permanently** unavailable (reason `NO_DATA_SOURCE`, `NOT_DEFINED_BY_LEDGER`, etc.): `revenue.active`, `revenue.inactive`, `revenue.suspendedRevenueLoss`, `alerts.networkCongestion`, `alerts.fraudAlerts`, `alerts.bandwidthAlerts`, `operations.currentBandwidthMbps`, `operations.peakBandwidthMbps`, `operations.uptimePercentage`. Recommendation: hide these cards, or show them greyed with "Not tracked yet". Your call with the product owner; just never show 0.
6. Label each card with its window: "Today", "Last 7 days", "Month to date", from `period`.
7. `devices.online` = ONLINE + DEGRADED routers. `healthyRouters` = ONLINE only.

**Revenue meaning:** `daily/weekly/monthly/hotspot/pppoe/tv` = general-ledger revenue (posted after a confirmed payment). `collected` = cash received (payment tables). They can differ briefly while ledger postings are pending. That is expected, not a bug.

---

## 2. Subscriber hub: lifecycle vs online (concerns #3, #4)

`GET /api/v1/subscribers/hub?page=0&size=25&statusFilter=&companyId=&search=`

### Row (`rows.content[]`)

New fields you asked for, all present:

```ts
status: "ACTIVE" | "GRACE" | "EXPIRED" | "SUSPENDED";  // entitlement, NOT connectivity
isOnline: boolean;                  // open RADIUS session or ACTIVE hotspot session right now
lastSeenAt: string | null;          // instant; null = never connected
activeSessionId: string | null;     // Acct-Session-Id, or "HS-<id>" for hotspot; null when offline
ipAddress: string | null;           // null when offline
expiryDate: string | null;          // DATE-ONLY Nairobi; account is ACTIVE through the whole of this date
planPrice: string | null;           // catalog price, NOT revenue
type: "PPPOE" | "HOTSPOT" | "TV_BUNDLED";
```

Other row fields unchanged: `id, code, fullName, phone, email, planName, planSpeed, expiryText, isExpiringToday, nasName, deviceType, macAddress`.

### KPIs and scope (concern #4)

- `kpis` cover **tenant + search**, and **ignore `statusFilter` and pagination**, so the KPI cards stay stable while the table is filtered or paged.
- With no `statusFilter`: `kpis.allUsersCount === rows.totalElements`.
- With a `statusFilter`: `rows.totalElements === kpis.statusCounts[<that status>]`.
- `onlineCount` = rows with `isOnline === true` in scope. `onlinePercentage` = `onlineCount / allUsersCount * 100`, denominator is **all** subscribers in scope.
- `kpis.statusCounts = { active, grace, expired, suspended }` sums to `allUsersCount`. Use it for status filter chips with counts.
- Response has `query` echoing what was applied: `{ page, size, statusFilter, companyId, search, businessDate, kpiScope: "KPIS_IGNORE_STATUS_FILTER_AND_PAGINATION" }`.

**Frontend changes**

1. Delete the `ACTIVE/GRACE -> ONLINE`, `EXPIRED/SUSPENDED -> OFFLINE` adapter mapping.
2. Two separate columns/badges: **Account** (`status`) and **Connection** (`isOnline`, plus "last seen 3h ago" from `lastSeenAt`).
3. Expect and render the edge cases: ACTIVE + offline, EXPIRED + online (NAS has not dropped the session yet).
4. Add real pagination (the table currently shows only page 0 of 25). Use `rows.totalElements` for "Showing 1-25 of N".
5. Label KPI cards so the scope is clear, e.g. "All subscribers (matches search)".

---

## 3. Live sessions (concerns #7, #8, #22.1)

`GET /api/v1/sessions/live?page=0&size=50&companyId=&stationId=`

**The HTTP 500 is fixed.** A scope with no sessions returns 200 with empty `content` and zero KPIs. A data-source failure returns 503 `LIVE_SESSIONS_UNAVAILABLE` with `data.requestId`.

```ts
interface LiveSessionListResponse {
  kpis: {
    currentlyConnected: number;   // pppoe + hotspot + tv, reporting now
    pppoeCount: number;
    hotspotCount: number;
    tvCount: number;              // NEW
    paidNotConnected: number;     // NEW: hotspot paid, unexpired, not online (NOT in currentlyConnected)
    lostContact: number;          // NEW: router stopped reporting (3 missed interim updates, no Stop)
    sessionsWithoutCounters: number; // NEW: > 0 means byte totals are a lower bound
    downloadBytesTotal: string;   // integer string
    uploadBytesTotal: string;
    totalBytesTotal: string;
  };
  sessions: Page<LiveSessionDTO>;  // ordered by connectedAt desc
  scope: { companyId: string | null; stationId: string | null; page: number; size: number };
  generatedAt: string;             // instant
  refreshIntervalSeconds: number;  // 30
}

interface LiveSessionDTO {
  subscriberCode: string; subscriberName: string;
  protocol: "PPPoE" | "Hotspot" | "TV_MAB";
  deviceMac: string; assignedIp: string;
  routerName: string; routerManagementIp: string;
  downloadBytes: string | null;    // CHANGED: was number. Integer string of bytes.
  uploadBytes: string | null;      // CHANGED: was number.
  countersAvailable: boolean;      // false when either counter is null
  onlineDurationFormatted: string;
  connectedAt: string | null;      // instant
  expiryDate: string | null;       // date-only Nairobi
  expiresAt: string | null;        // instant, hotspot only
  expiryFormatted: string;
  // hotspot detail (null for PPPoE / TV)
  sessionId: number | null;        // target of POST /api/v1/hotspot/sessions/{id}/disconnect
  phone: string | null; packageName: string | null; voucherCode: string | null;
  mpesaReceipt: string | null; amountPaid: string | null; nasIp: string | null;
  minutesRemaining: number | null;
  online: boolean;                 // router accounting now; false = paid but not connected / lost contact
  lastSeenAt: string | null;       // instant; last accounting start/interim
}
```

**Byte counter rules (concern #7):** cumulative for the whole session (not an interval), 64-bit and rollover-corrected (`gigawords * 2^32 + octets`), plain bytes (not KiB). `"0"` = reported zero traffic. `null` = counter not reported yet (show "-", not "0 B").

**Frontend changes**

1. `lib/types/sessions.ts`: `downloadBytes`/`uploadBytes` become `string | null`. Format with a BigInt-safe helper, for example:
   ```ts
   function formatBytes(s: string | null): string {
     if (s == null) return "-";
     const n = BigInt(s);
     const units = ["B", "KB", "MB", "GB", "TB", "PB"];
     let i = 0; let whole = n; let rem = 0n;
     while (whole >= 1000n && i < units.length - 1) { rem = whole % 1000n; whole /= 1000n; i++; }
     return i === 0 ? `${whole} B` : `${whole}.${(rem / 100n).toString()} ${units[i]}`;
   }
   ```
   (Decimal units, matching the backend's GB = 10^9 elsewhere.)
2. `actions/sessions.ts`: remove the zero-filled fallback on failure. Render an error state with the request id. The old "0 active sessions" after a 500 was a lie.
3. Pagination (concern #8): the endpoint is paginated by design. Add pager controls, or label the table "Showing 50 of N" using `sessions.totalElements`. KPIs always describe the whole scope, not the page.
4. Poll every `refreshIntervalSeconds` (30). Faster polling only re-reads the same counters. No server cache: each call is live.
5. Show `paidNotConnected` and `lostContact` as their own KPI cards; rows with `online === false` should look different (for example greyed with "Lost contact" / "Paid, not connected").
6. `downloadTrafficGb` / `uploadTrafficGb` / `totalTrafficGb` in the old action shape no longer exist. Use the `*BytesTotal` strings.

---

## 4. Unified analytics (concerns #5, #6, #21 router throughput)

**Decision: extend the DTO** (existing UI is kept). Endpoint unchanged: `GET /api/v1/analytics/unified?companyId=`.

Window: last 30 Nairobi days including today, compared with the 30 days before. Money: decimal strings (KES). Percentages: decimal strings, scale 2.

Top level: `dataStatus`, `unavailableMetrics`, `generatedAt`, `companyId`, `period { from, to, previousFrom, previousTo, timezone, currency }`, `unattributedRevenue`.

What your components need, now provided:

| Component | Field | Notes |
|---|---|---|
| `PaymentsTrendChart` | `paymentsTrend.points[]`: `{ date, currentRevenue, previousDate, previousRevenue, paymentCount, revenue }` | 30 points, oldest first, point i of previous aligned with point i. `revenue` = `currentRevenue` (kept for compatibility). |
| | `paymentsTrend.periodTotal`, `previousPeriodTotal`, `deltaPercent`, `unit: "KES"`, `interval: "DAY"` | `deltaPercent` is **null** when the previous period had no revenue (show "New" or "-", not "+∞%"). |
| `PaymentsVsExpensesChart` | `paymentsVsExpenses.points[]`: `{ date, revenue, expense, profit }`, `interval: "MONTH"` | 12 months, `date` = first day of month. |
| `RevenueMixDonuts` | `revenueMix[]`: `{ code, bucket, totalAmount, sharePct, count, averageAmount }` | `bucket`: `pppoe`, `hotspot`, `tv_revenue`, `other_revenue`. `averageAmount` null when count 0. |
| | `paymentMethodsMix[]`: `{ method, count, totalAmount, sharePct }` | |
| `RouterPerformanceTable` | `routerPerformance[]`: `{ routerId, deviceId, routerName, activeSessions, dataTransferredGb, healthScore, latencyMs, cpuUsage, freeMemory, totalMemory, snapshotAt, telemetryStatus, telemetrySampledAt, revenueAmount, revenueSharePercent }` | see rules below |
| KPI cards | `kpis`: `revenue30d, profit30d, marginPct, subscriberCount, activeSubscriptionCount, churnRate30d, topPackageName, arpu30d, avgDaysToPay, uncollectedInvoices30d, badDebtExpense30d, avgSessionDurationMinutes30d` | `avgSessionDurationMinutes30d` is the average session duration you asked for. Several are nullable, see Swagger. |
| Tables | `topPackages[]`: `{ packageId, packageName, revenue30d, newSubs30d, sharePct }`; `topCustomers[]`: `{ customerId, customerName, totalPaid, paymentCount }` | |

**Router rules**

- `revenueAmount`: GL revenue postings in the window attributed to this row's `deviceId`. `"0.00"` = earned nothing. `null` = row has no `deviceId`, so attribution is impossible (show "-").
- `revenueSharePercent` = `revenueAmount / kpis.revenue30d * 100`; null when `revenueAmount` is null.
- `sum(revenueAmount) + unattributedRevenue = kpis.revenue30d`. Show `unattributedRevenue` as a footer row ("Not attributed to a router").
- `dataTransferredGb` comes from **RADIUS accounting** (not SNMP) for sessions started on that NAS in the window. `null` = router has no NAS IP to attribute to. `"0.00"` = genuinely no traffic.
- `telemetryStatus`: `LIVE` (snapshot < 5 min), `STALE` (older), `UNAVAILABLE` (none). `healthScore`, `cpuUsage`, `latencyMs`, memory are null when UNAVAILABLE. Show a stale badge with `telemetrySampledAt`.

**Frontend changes**

1. `actions/analytics.ts`: delete the adapter that fills zeros and `-` for missing fields; every field it faked now exists.
2. Stop converting with `Number(...)` for display (concern #6). For chart geometry only, `parseFloat` on a string is acceptable (pixel height does not need cents), but tooltips and labels must show the original string.
3. Handle `dataStatus === "PARTIAL"` the same way as the admin dashboard.
4. 503 `DATA_SOURCE_UNAVAILABLE` = error state with request id.

---

## 5. NAS routers: four statuses and the two ids (concerns #9, #10)

`GET /api/v1/provisioning/nas-routers` returns `{ kpis, rows }` (not paged).

**Status (concern #9): approved, keep all four.**

| `status` | Meaning | Suggested UI |
|---|---|---|
| `ONLINE` | reachable and healthy | green |
| `DEGRADED` | reachable, still serving, but LIVE telemetry CPU >= 85% or memory >= 90%, or node reports DEGRADED/WARNING | amber |
| `OFFLINE` | not reachable | red |
| `NOT_PROVISIONED` | device exists but was never onboarded as a router (`routerId` null). A setup task, not an outage. | grey / "Set up" action |

- `status` is **authoritative**. `online: boolean` is the raw reachability signal, informational only. When they disagree, show `status`.
- KPIs: `healthyCount + degradedCount + offlineCount + notProvisionedCount = totalCount`; `onlineCount = healthyCount + degradedCount`. Also `cpuAvg`, `memoryAvg` (over LIVE rows only, null if none), `rowsWithTelemetry`, `activeSessionsTotal`.
- Row telemetry fields (`cpuUsage`, `latencyMs`, `freeMemory`, `totalMemory`, `snapshotAt`) are null when there is no telemetry. `telemetryStatus` is `LIVE | STALE | UNAVAILABLE` as in analytics. `snapshotAt` is now a UTC instant (was local datetime).

**Ids (concern #10): both kept permanently.**

| Operation | Id | Path |
|---|---|---|
| Router detail, action, CoA, telemetry, monitoring | `routerId` (`network_routers.idxno`) | `/api/v1/network-routers/{routerId}`, `/api/v1/network/monitoring/router/{routerId}/...` |
| Device interfaces, status, update, delete, remote access | `deviceId` (`network_device.id`) | `/api/v1/network-devices/{deviceId}/...` |

Each row now carries **ready-made links** with the right id already filled in:

```ts
links: {
  router: string | null;           // GET  (routerId)
  routerAction: string | null;     // PATCH (routerId)
  telemetryLatest: string | null;  // GET  (routerId)
  deviceInterfaces: string | null; // GET  (deviceId)
  deviceStatus: string | null;     // GET  (deviceId)
  deviceDelete: string | null;     // DELETE (deviceId)
}
```

A link is `null` when its id is missing.

**Frontend changes**

1. `lib/types/provisioning.ts`: status type becomes `"ONLINE" | "DEGRADED" | "OFFLINE" | "NOT_PROVISIONED"`. Remove the `DEGRADED/NOT_PROVISIONED -> OFFLINE` mapping.
2. Stop mapping one id into a legacy `id`. Use `links.*` for every action. **Disable (or hide) an action button whenever its link is null.** That guarantees NOT_PROVISIONED rows can never fire telemetry/router actions.
3. Remove any IP-based or array-position id stitching.

---

## 6. Equipment (concerns #11, #20)

Endpoints: `GET /api/v1/equipment`, `POST /api/v1/equipment`, `PATCH /api/v1/equipment/{assetId}`, `GET /api/v1/equipment/{assetId}/history`.

**Decision:** the uppercase enums, string money and paged list are the **permanent** contract. The lowercase/number/flat-array adapter is temporary; please migrate off it (no backend deadline pressure, the old field names are kept, but the adapter must not coerce money to `Number`).

### List

`GET /api/v1/equipment?status=&type=&search=&dataQuality=&page=&size=&sort=` returns `{ kpis, items: Page<AssetItemResponse> }`. KPIs use the same filters as `items`, ignoring pagination. Bad filter values are 422.

**Enums (stable, append-only):**
- `type`: `ROUTER | SWITCH | CPE_MODEM | ONU | ANTENNA | SMART_TV | WIFI_AP | CABLE`
- `status`: `IN_STOCK | INSTALLED | RETURNED | DAMAGED | SOLD | RMA` (`INSTALLED` is the old "assigned")
- `dataQuality`: `VERIFIED | PLACEHOLDER | MISSING`; list filter also accepts `NEEDS_CORRECTION` (= PLACEHOLDER + MISSING)

**Row fields:** `id, name (= assetTag), type, model, serialNumber (nullable), status, costPrice, paidSoFar, createdAt, assignedSubscriberName, returned, damaged, sold` (original) plus `assetTag, dataQuality, needsCorrection, unpaidBalance, acquiredAt (date-only), installedAt, updatedAt, companyId, stationId, assignedToUserIdxno, linkedNetworkDeviceId, linkedNetworkRouterIdxno, linkedCustomerDeviceId`.

**Meanings you asked for:**

| Field | Meaning |
|---|---|
| `costPrice` | purchase cost, KES string |
| `paidSoFar` | paid toward costPrice so far; `0 <= paidSoFar <= costPrice` on every new write |
| `unpaidBalance` | `max(costPrice - paidSoFar, 0)` |
| `kpis.totalCost` / `totalPaid` / `totalUnpaid` | sums over matching assets |
| `assignedSubscriberName` | subscriber's full name, falling back to username; null when unassigned |
| `returned` / `damaged` / `sold` | **current** status only, not history (returned then re-installed = false) |
| `kpis.installedThisMonthCount` | currently INSTALLED and installed in the current Nairobi month |
| `kpis.needsCorrectionCount` | PLACEHOLDER + MISSING |

### Data quality (concern #20)

- Only the **serial** is judged; `assetTag` is an internal label.
- `MISSING` = no serial. `PLACEHOLDER` = stand-in serial (N/A, NONE, UNKNOWN, TBD, `000000`, `XXXX`, `TEMP-...`, etc.) or operator-flagged. `VERIFIED` = real serial.
- **Never display a PLACEHOLDER serial as if it were real.** Show a "Needs correction" badge (`needsCorrection === true`) and a filter chip using `dataQuality=NEEDS_CORRECTION`.
- Correcting a serial via PATCH moves it to VERIFIED and writes a `DATA_QUALITY_CORRECTION` history row with the operator.
- Forcing `dataQuality: "VERIFIED"` on a placeholder-looking serial requires `reason` (else 422). Add a reason textbox when the operator does that.

### Create / patch

- POST body: `assetTag` (required), `type` (required), `status` (required), `model`, `serialNumber`, `costPrice` (string), `paidSoFar` (string), `acquiredAt` (date-only), `companyId`, `stationId`, link ids, `dataQuality`, `reason`. Returns 201.
- PATCH: only send fields that changed. `null`/absent = unchanged. To **clear** a nullable field, list it in `clearFields: ["serialNumber", ...]` (clearable: `model, serialNumber, acquiredAt, stationId, assignedToUserIdxno, linkedNetworkDeviceId, linkedNetworkRouterIdxno, linkedCustomerDeviceId, companyId`). A field both set and cleared is 400.
- Errors: 400 validation; **409 duplicate asset tag or serial** (case and whitespace insensitive, across all companies; the message never says which company holds it); 422 bad enum, `paidSoFar > costPrice`, or a link outside the caller's company; 403 foreign `companyId`; 404 asset outside scope.
- Send money as strings (`"4500.00"`), not numbers.

### History

`GET /{assetId}/history`, oldest first: `{ historyId, assetId, action, status, snapshot, operator, changeTypes, changes, reason, createdAt }`.
- `action`: `CREATE | DATA_QUALITY_CORRECTION | FINANCIAL_CHANGE | ASSIGNMENT_CHANGE | STATUS_CHANGE | UPDATE`.
- `changes`: `{ field: { from, to } }` with API field names; money as strings. Great for a timeline ("paidSoFar 1500.00 → 3000.00 by jdoe").
- Rows written before 2026-09-26 have null `operator`, `changeTypes`, `changes`. Render "Legacy entry".

**Frontend changes:** use `items.content` + real pagination; uppercase enums in `lib/types/equipment.ts`; money stays string; data-quality badge and filter; history timeline from `changes`; remove any leftover `S{id}` serial generation (already removed per your note, double-check).

---

## 7. IP pools (concern #18)

`GET /api/v1/network/ip-pools`. Original fields kept (`poolName, subnet, gateway, totalIps, usedIps, availableIps, utilizationPercentage, serviceType`). New:

```ts
poolId: number;
rawUsedIps: number;          // real count before capping, may exceed totalIps
overCapacity: boolean;       // rawUsedIps > totalIps
probeStatus: "OK" | "FAILED" | "NO_DEVICE" | "INVALID_SUBNET";
stale: boolean;              // usedIps is not a live sample
probeError: "ROUTER_UNREACHABLE" | "ROUTER_AUTH_FAILED" | "PROBE_FAILED" | "USAGE_QUERY_FAILED"
          | "POOL_NOT_LINKED" | "NO_NAS_SCOPE" | "INVALID_SUBNET" | null;
lastProbedAt: string | null; // instant of last successful sample
usageSource: "MIKROTIK_DHCP_LEASES" | "RADIUS_ACTIVE_SESSIONS" | "WIREGUARD_PEERS";
```

**Guaranteed:** `availableIps = totalIps - usedIps`, `0 <= utilizationPercentage <= 100`, `usedIps <= totalIps` (capped; the real number is `rawUsedIps`).

**What counts as used** (put this in a tooltip on the "Used" column, per `usageSource`):
- HOTSPOT / TV / LOOPBACK: bound, non-disabled DHCP leases on the pool's router. Expired/waiting/offered/disabled leases do not count.
- PPPOE_WAN: distinct IPs of live RADIUS sessions on the pool's NAS (updated in the last 60 minutes).
- WIREGUARD: enabled peers inside the subnet.
- Network, broadcast and gateway addresses are never counted and are excluded from `totalIps`.

**Frontend changes:** show a "stale" badge with "last sampled X ago" when `stale` is true, a human message for `probeError` (for example ROUTER_UNREACHABLE → "Router not reachable, showing last known value"), and an "Over capacity (N in use)" warning when `overCapacity`. Probes are cached 30 s (15 s on failure), so polling faster than 30 s gains nothing.

---

## 8. Vouchers (concern #12)

Two independent data sets, as you have them now. Both confirmed and documented.

### 8.1 Individual vouchers

`GET /api/v1/hotspot/vouchers?search=&voucherState=&stationId=&companyId=&source=&issuedOnly=false&page=0&size=20&sort=createdAt,desc` returns `Page<HotspotSessionResponse>`.

- `voucherState`: `UNUSED | USED | EXPIRED | VOID | PENDING | FAILED | ALL`
- `source`: `ALL` (default) | `MINTED` (admin/finance) | `PURCHASED` (paid M-Pesa portal)
- Unpaid PENDING/FAILED purchase attempts are hidden unless you ask for `voucherState=PENDING` or `FAILED`.

Row fields: `sessionId, voucherCode, voucherBatchId, voucherType, voucherState, sessionStatus, packageName, packageSpeedLabel, packageValidityLabel, packageCurrencyAmount (display only, "Ksh 50"), amountPaid (string), macAddress, clientPhone, payerPhone, mpesaReference, startedAt, expiresAt, redeemedAt, createdAt, minutesRemaining, durationSeconds, concurrentUserLimit, dataUploadedBytes (string), dataDownloadedBytes (string), ipAddress, stationId, companyId`. Router credentials are **no longer** in any voucher response.

**Expiry semantics:** the validity clock starts at **first use**. For a freshly minted voucher, `startedAt` and `expiresAt` are `null` until it is redeemed; then `expiresAt = first use + package duration`. Render null as "Starts on first use". (Heads-up: the Swagger text on `HotspotSessionResponse.startedAt/expiresAt` still describes the old mint-time clock. The code does first-use. Trust this file; Brian will fix the Swagger text.)

For an unredeemed minted voucher, `macAddress` is a placeholder equal to the voucher code. Do not show it as a device MAC.

### 8.2 Voucher statistics (KPIs)

`GET /api/v1/hotspot/vouchers/statistics?stationId=&companyId=&from=YYYY-MM-DD&to=YYYY-MM-DD&source=`

```ts
{
  totalVoucherCodes: number;
  usedCodes: number;            // redeemed, or a paid purchase
  unusedCodes: number;          // not used, still ACTIVE
  expiredUnusedCodes: number;   // not used, EXPIRED
  batches: number;              // distinct voucherBatchId
  redemptionRatePercent: number;// round(used*100/total)
  source: string; companyId: string | null; stationId: string | null;
  from: string | null; to: string | null;  // date-only Nairobi, inclusive
}
```

Same row set as the list for the same `source`, so the list's `totalElements` and `totalVoucherCodes` agree when filters match.

### 8.3 Batch ledger (finance)

- `GET /api/v1/finance/voucher-batches?companyId=&page=&size=` → `Page<VoucherBatchResponse>`
- `GET /api/v1/finance/voucher-batches/summary?companyId=` → `{ companyId, batches, vouchers, totalValue }` (ACTIVE batches; `totalValue` = what was posted to GL)
- `GET /api/v1/finance/voucher-batches/{batchId}`

`VoucherBatchResponse`: `batchId (UUID, stable id), batchNumber (display label VB-..., do not parse), sessionBatchId, companyId, stationId, packageId, packageName, quantity, unitPrice, totalValue, channel (CASH | BANK_TRANSFER), status, codePrefix, codeLength, createdByUsername, createdAt, mintedCount, redeemedCount, codes`.

**Ids (you asked):**
- `batchId` (UUID): stable identifier of a ledger row. Use it for `GET /{id}`.
- `batchNumber`: display label only.
- `voucherBatchId` on vouchers: stable filter key (`VBH-yyyyMMdd-HHmmss-XXXXXX` for minted, `HOT-<paymentId>` for purchases).
- `sessionBatchId` on a batch = the `voucherBatchId` of its vouchers. Use it to jump from a batch to its codes: `GET /api/v1/hotspot/vouchers/export/print?voucherBatchId=<sessionBatchId>`. Null for old batches.
- `codes` is only on the POST response (and its replay).

### 8.4 Generating vouchers

Two different buttons, two different endpoints:

| Purpose | Endpoint | Body |
|---|---|---|
| **Sold** vouchers (money, GL posting) | `POST /api/v1/finance/voucher-batches` | `{ packageId, quantity (1..500), codePrefix?, codeLength? (4..12), channel: "CASH" \| "BANK_TRANSFER", stationId?, companyId? (SYSADMIN only), expectedUnitPrice?, confirmDuplicate?, deviceId? }` |
| **Free** stock: DEMO / MIGRATION | `POST /api/v1/hotspot/vouchers/create` | `{ packageId, count (1..500), voucherType: "DEMO" \| "MIGRATION", stationId?, companyId?, expectedUnitPrice?, deviceId?, prefix?, codeLength? }` |

`voucherType: "PAID"` on `/hotspot/vouchers/create` is **refused (400)**. Sold vouchers must go through finance batches.

**Both endpoints:**
- Send `Idempotency-Key: <uuid>` (generate once per form submission, reuse it on retry). A retry with the same key and body returns the original result with 201 and header `Idempotent-Replayed: true`; nothing new is minted. Same key + different body: 422 `IDEMPOTENCY_KEY_REUSED`. Still running: 409 `IDEMPOTENCY_KEY_IN_PROGRESS` (retry shortly with the same key).
- Send `expectedUnitPrice` = the price the operator saw. If it changed: 409 `PACKAGE_CHANGED` with `data.serverUnitPrice`. Show the new price and ask to confirm.
- `deviceId` (optional) locks the vouchers to one router of the tenant. Without it the tenant's first active MikroTik is used. None: 400 `NO_ROUTER_IN_SCOPE`.
- Package errors: 404 `PACKAGE_NOT_FOUND`, 422 `PACKAGE_NOT_SELLABLE_FOR_PRODUCT` (not a HOTSPOT package), 409 `PACKAGE_INACTIVE`, 409 `PACKAGE_NOT_APPROVED`. SYSADMIN with no company selected: 400 `COMPANY_CONTEXT_REQUIRED`.
- Finance batch only: without an Idempotency-Key, an identical batch within 60 s is 409 `POSSIBLE_DUPLICATE_BATCH`. Show "You just created this batch. Create another?" and resend with `confirmDuplicate: true`.

**Frontend changes**

1. Package picker: load from `GET /api/v1/system/packages/category/{category}?includeInactive=false` or `/system/packages/active`, **HOTSPOT packages only**. If that request fails, disable the Generate button (you already planned this; the backend also refuses bad ids now).
2. Add `Idempotency-Key` and `expectedUnitPrice` to both generate calls.
3. When the API is unavailable, show an error, never a generated-looking code.
4. Expiry: "Starts on first use" for null `expiresAt`.

---

## 9. Package catalogs (concern #17)

Source of truth, one id space (`net_packages.idxno`) for all four; the id is only valid for the product its `serviceType` names.

| Product | List | Consume | Price source |
|---|---|---|---|
| Admin package management | `GET/POST/PATCH /api/v1/system/packages` (auth) | same | `net_packages.price` |
| Hotspot purchase (portal) | `GET /api/v1/hotspot/packages?routerIdentity=&clientIp=&companyId=&serviceType=&category=` (public) | `POST /api/v1/hotspot/initiate` | re-read at initiate; that is the STK amount |
| Voucher generation | `GET /api/v1/system/packages/category/{category}?includeInactive=false` or `/system/packages/active` (auth) | `/hotspot/vouchers/create`, `/finance/voucher-batches` | price at mint, snapshotted per voucher and per batch |
| TV purchase | `GET /api/v1/tv/packages/eligible` | `POST /api/v1/tv/payments/initiate` | `submittedAmount` must match |

- Wrong product: 422 `PACKAGE_NOT_SELLABLE_FOR_PRODUCT` (TV: 422 `TV_PACKAGE_NOT_TV`). Another tenant's: 404 `PACKAGE_NOT_FOUND`. Inactive: 409 `PACKAGE_INACTIVE`. Unapproved: 409 `PACKAGE_NOT_APPROVED`.
- Price, validity, speed and active status come from the same row on every request. The only copies are the snapshots taken at sale.
- PPPoE plans live in a separate catalog (`pppoe_packages`), separate id space. Never submit a PPPoE plan id to these endpoints.
- **Public hotspot catalog change:** the portal must now identify the tenant. Send `routerIdentity` (preferred), or `clientIp`, or `companyId`. With none of them: 400 `HOTSPOT_TENANT_UNRESOLVED` (it used to return every tenant's packages). Router/company disagreement: 400 `HOTSPOT_TENANT_MISMATCH`. `serviceType`: `HOTSPOT` (default), `TV`, or `ALL`.
- Public items (`PublicPackageResponse`) keep the admin field names minus staff fields: `idxno, packageName, companyId, price (string), packageCategory, serviceType, validityType, validityValue, bandwidthType, activeStatus, speedDownload, speedUpload, maxDevices, dataCapMb`. `price` is now a string.

**Frontend changes:** keep one package action per product, never share an id list between products; make sure `app/(hotspot)/hotspot/page.tsx` passes `routerIdentity` (from the MikroTik login page params) or `clientIp`; treat `price` as a string.

---

## 10. TV captive-portal flow (concerns #13, #14, #15, #16, #21 callback)

This is the biggest frontend change. The portal no longer needs a JWT.

### 10.1 Auth matrix (concern #13)

| Endpoint | Public | Portal token | Customer JWT (CUSTOMER / 05) | Staff JWT |
|---|:-:|:-:|:-:|:-:|
| `POST /api/v1/tv/devices/verify` | yes | n/a (it issues the token) | yes | yes |
| `GET /api/v1/tv/packages/eligible` | no | yes | yes | yes |
| `POST /api/v1/tv/payments/initiate` | no | yes | yes | yes |
| `GET /api/v1/tv/payments/{ref}/status` | no | yes | yes (own payments) | yes (own tenant) |

**Flow for an anonymous captive-portal user:**

1. `POST /tv/devices/verify` with no Authorization header. Response has `portalToken` and `portalTokenExpiresAt` (30 minutes).
2. Send `X-TV-Portal-Token: <portalToken>` on eligible, initiate and status. Do **not** send the shared authenticated client's `Authorization` header from the portal (when the token header is present it wins anyway, but keep the portal client separate).
3. The token is HMAC-signed and binds company, station, normalized MAC and normalized customer phone. Changing any of them in a later request is 403 `TV_PORTAL_TOKEN_MISMATCH`. It cannot be replayed across companies, stations or devices.
4. Expired token: 401 `TV_PORTAL_TOKEN_EXPIRED`. Re-run verify silently with the same phone and MAC to get a new one, then retry.

**Tenant resolution for anonymous verify:** the backend picks the company **only** from the router serving the client's IP. `routerIdentity` and `companyId` in the body are cross-checks (400 `TV_TENANT_MISMATCH` if they contradict); they never choose the tenant. No router match: 503 `TV_TENANT_UNRESOLVED`. `clientIp` in the body is ignored. Keep sending `routerIdentity` if you have it.

**Staff JWT:** SYSADMIN must select a company (`X-Company-Context` header or `companyCode` param) or gets 400 `TV_TENANT_UNRESOLVED`. Other staff are pinned to their own company (403 `TV_TENANT_FORBIDDEN` otherwise).

### 10.2 Verify

Request: `{ customerPhone, macAddress, routerIdentity?, companyId?, selectedPackageId?, postalAddress? }`

Response:
```ts
{
  eligible: boolean;
  existingCustomer: { id; name; pendingTvCredits: string } | null; // ALWAYS null for anonymous callers
  nearestStationId: number | null;
  recommendedPackages: TvPackageOption[];   // same list as /packages/eligible, saves a call
  softWarnings: string[];                   // DEVICE_NOT_YET_SEEN_ON_NETWORK, PACKAGE_NOT_PURCHASABLE
  portalToken: string;
  portalTokenExpiresAt: string;             // instant
  companyCode: string; stationId: string | null;
  normalizedPhone: string;                  // 254XXXXXXXXX
  normalizedMac: string;                    // AA:BB:CC:DD:EE:FF
}
```

`existingCustomer` is intentionally always null for anonymous users (prevents phone-number enumeration). Do not build UI that depends on it in the portal.

Errors: 422 `TV_INVALID_PHONE`, 422 `TV_INVALID_MAC`, 429 `TV_RATE_LIMITED` (`data.retryAfterSeconds`), 503 `TV_PORTAL_TOKEN_NOT_CONFIGURED` (server env missing; not user-fixable).

### 10.3 Two phones (concern #14)

They **may differ**. Someone else can pay.

| Concept | Field | Used for |
|---|---|---|
| Customer phone | `customerPhone` (verify, initiate) | customer lookup, guest-customer creation, **TV entitlement ownership**. Bound into the portal token. |
| Payer phone | `phone` (initiate) | receives the STK prompt, pays, gets the M-Pesa receipt SMS. |

- On initiate, `customerPhone` defaults to `phone` if omitted. For portal callers it must equal the phone the token was issued for (403 `TV_PORTAL_TOKEN_MISMATCH`). Simplest: always send `customerPhone = verifyResponse.normalizedPhone`.
- Customer JWT callers: always their own account; a different `customerPhone` is 403 `TV_OWNER_MISMATCH`.
- Accepted formats on both: `07XXXXXXXX`, `01XXXXXXXX`, `2547XXXXXXXX`, `2541XXXXXXXX`, `+254...`, with spaces, dashes, dots or parentheses. The backend normalizes to `254XXXXXXXXX`. Your existing `2547/2541` normalization is compatible; keep it.
- A phone registered only with another company is 409 `TV_CUSTOMER_PHONE_OTHER_TENANT` at initiate.

### 10.4 Eligible packages

`GET /tv/packages/eligible?macAddress=` with the token header. Returns `TvPackageOption[]`:
`{ packageId, name, validityLabel, speedLabel, price (string), currency, availableForDevice, unavailableReason, notes }`.

If `availableForDevice === false`, disable that package and show `unavailableReason` (`PRICE_MISSING` or `PRICE_NOT_WHOLE_SHILLINGS`: M-Pesa STK only charges whole shillings).

### 10.5 Initiate: idempotency and amount mismatch (concern #15)

`POST /api/v1/tv/payments/initiate`

Headers: `X-TV-Portal-Token` (or JWT) **and** `Idempotency-Key` (required, 8 to 120 chars `[A-Za-z0-9._:-]`, use a UUID).

Body: `{ phone, customerPhone, macAddress, packageId, submittedAmount: "1500.00", customerId? (staff only) }`

**Idempotency scope:** caller (token binding or JWT username) + endpoint + key, bound to a SHA-256 of the whole canonical body (company, packageId, amount, payer phone, customer phone, MAC, customerId).

| Case | Result |
|---|---|
| Same key, same body (timeout, double click, retry) | Original response replayed, 201 with `replayed: true`. **No second STK push, ever.** |
| Same key, changed body | 422 `IDEMPOTENCY_KEY_REUSED` |
| Same key while the first call is still running | 409 `IDEMPOTENCY_REQUEST_IN_PROGRESS`, retry with same key |
| 422 validation or 409 `AMOUNT_MISMATCH` | key is **not** spent; fix and resend with the same key |

**Key lifecycle in `TvPurchaseReview.tsx`:** generate one key when the user presses Pay for a given (package, phone) choice. Reuse it for retries. Generate a **new** key if the user changes package or phone, or after a 502 `TV_STK_NOT_ACCEPTED`.

**Amount mismatch (exact envelope):**

```json
{
  "status": 409,
  "success": false,
  "message": "AMOUNT_MISMATCH",
  "data": {
    "code": "AMOUNT_MISMATCH",
    "detail": "The package price changed; confirm serverAmount and resubmit",
    "serverAmount": "1500.00",
    "submittedAmount": "1400.00",
    "currency": "KES",
    "packageId": "42",
    "requestId": "3f0c..."
  },
  "timestamp": "2026-09-26T07:15:04Z"
}
```

Show "The price is now KES 1,500.00. Continue?" and resubmit with `submittedAmount = data.serverAmount` (same key is fine).

**Success (201):**
```ts
{
  transactionReference: string;   // "TV-20260926101500-1A2B3C4D"
  mpesaStkPushTriggered: boolean;
  checkoutRequestId: string;      // always non-null (STK is the only TV rail)
  statusUrl: string;              // "/api/v1/tv/payments/<ref>/status"
  replayed: boolean;
  validationOutcome: { valid; serverAmount: string; currency; message };
}
```

**The two 502s are different. Get this right, it is about customers' money:**

| Code | What happened | UI |
|---|---|---|
| 502 `TV_STK_NOT_ACCEPTED` | M-Pesa provably refused the push. No money taken. Key is spent. | "Payment request was not sent. Try again." New key. |
| 502 `TV_STK_OUTCOME_UNKNOWN` | Timeout / M-Pesa 5xx. The prompt **may** have reached the phone. | **Do not** say "no money was taken". **Do not** offer a new payment. Poll `data.statusUrl`; show "Check your phone. If you paid, we will confirm shortly." |

Other initiate errors: 400 `IDEMPOTENCY_KEY_REQUIRED` / `IDEMPOTENCY_KEY_INVALID`; 422 `TV_PACKAGE_*`, `TV_PACKAGE_NOT_TV`, `TV_PACKAGE_PRICE_INVALID`; 429 `TV_RATE_LIMITED` (`data.retryAfterSeconds`); 409 `TV_PAYMENT_ALREADY_PENDING` with `data.transactionReference` (max 1 open payment per MAC, 2 per payer): **resume polling that reference** instead of showing an error.

Nothing is posted to the ledger and nothing is provisioned at initiate. Both happen only after M-Pesa confirms.

### 10.6 Status polling (concern #16)

`GET /api/v1/tv/payments/{transactionRef}/status` with the same token (or JWT). Read-only: polling never calls M-Pesa, posts or provisions. Available as long as the payment exists (no purge). Someone else's reference is 404 `TV_TRANSACTION_NOT_FOUND`.

```ts
{
  transactionReference: string;
  state: "PENDING" | "SETTLED" | "FAILED" | "TIMED_OUT";               // money
  provisioningState: "NOT_APPLICABLE" | "PENDING" | "PROVISIONED" | "RETRYING" | "PARKED"; // entitlement
  settledAt: string | null;
  failedReason: string | null;
  provisionedAt: string | null;
  provisioningAttempts: number;     // cumulative across all retries
  provisioningFailureCode: "DEVICE_MAC_MISSING" | "PROVISIONING_ERROR" | "RETRIES_EXHAUSTED" | null;
  pendingReason: "STK_OUTCOME_UNKNOWN" | "UNDER_REVIEW" | null;
  supportReference: string | null;  // = transactionReference
  mpesaReceipt: string | null;
  amount: string; currency: "KES";
  tvEntitlementExpiresAt: string | null;
}
```

**Screen mapping:**

| state | provisioningState | pendingReason | Show |
|---|---|---|---|
| PENDING | NOT_APPLICABLE | null | "Enter your M-Pesa PIN on your phone" (keep polling) |
| PENDING | NOT_APPLICABLE | STK_OUTCOME_UNKNOWN | "Waiting for M-Pesa confirmation. Do not pay again." + support ref |
| PENDING | NOT_APPLICABLE | UNDER_REVIEW | "Your payment is being checked by support." + support ref |
| SETTLED | PENDING | | "Paid. Activating your TV..." (keep polling) |
| SETTLED | PROVISIONED | | Success, receipt, `tvEntitlementExpiresAt` |
| SETTLED | RETRYING | | "Paid. Activation is retrying automatically." + support ref |
| SETTLED | PARKED | | "Paid. Activation needs support. Quote <supportReference>." Stop polling. |
| FAILED | | | `failedReason`; offer a new payment (new key) |
| TIMED_OUT | | | "We did not get a result from M-Pesa." + support ref. Can still become SETTLED later. |

- `SETTLED` is terminal; it never goes back. `FAILED` and `TIMED_OUT` can still become `SETTLED` if M-Pesa confirms late.
- `SETTLED` with null `provisionedAt` is a stable, queryable state (not an error).
- Suggested polling: every 3 s for the first 2 minutes, then every 10 s, stop on PROVISIONED / PARKED / FAILED, or after ~35 minutes (the reconciliation window).

### 10.7 Callback matching (concern #21)

STK is the only TV payment rail, so `checkoutRequestId` is always non-null. Do not add cash/card/bank rails to the TV UI; they are not supported by the callback matching yet.

**Frontend changes (TV)**

1. `actions/tv.ts`: separate portal client without the staff JWT; attach `X-TV-Portal-Token`.
2. Store `portalToken`, `portalTokenExpiresAt`, `normalizedPhone`, `normalizedMac`, `companyCode` from verify in component/session state (not localStorage across users on a shared device).
3. `TvPurchaseReview.tsx`: key lifecycle as above; `submittedAmount` as the string from `price`; handle `AMOUNT_MISMATCH`, both 502s, `TV_PAYMENT_ALREADY_PENDING`, 429 with `retryAfterSeconds`.
4. New status screen per the mapping table.
5. `lib/validation/tv-device.ts`: keep `customerPhone` + `macAddress`; accept the formats above.

---

## 11. Timestamps (concern #19)

Standardized. Every timestamp is now a UTC instant with `Z` (including router `snapshotAt`, TV `settledAt/provisionedAt`, equipment and voucher timestamps, `ApiResponse.timestamp`). Business dates are date-only Nairobi values (`expiryDate`, `acquiredAt`, `period.from/to`, voucher `from/to`). Each field is labelled in Swagger. See section 0.5 for how to handle each kind.

**Frontend change:** grep for `new Date(` on any date-only field (`expiryDate`, `acquiredAt`, `from`, `to`) and replace with a plain-date formatter.

---

## 12. Frontend-owned security fixes (concerns #22.2, #22.3)

These are **frontend** code. The backend side is done; these still need you.

### 22.2 JWT in logs (critical)

- Remove `console.log("Current session in getAuthHeaders:", session?.user?.apiToken)` in `actions/roles.ts`.
- Remove/sanitize the request and header logs in `actions/roles.ts`, `actions/system.ts`, `app/(dashboard)/system/access/page.tsx`, `app/(dashboard)/system/users/page.tsx`.
- Log only metadata: `{ hasToken: Boolean(token), roleCode, status, requestId }`.
- Add an ESLint rule or a CI grep that fails on `console.*` referencing `apiToken` or `Authorization`, e.g. `grep -rnE "console\.[a-z]+\(.*(apiToken|Authorization)" app actions lib components && exit 1`.
- Tell Brian if any of those logs reached a shared log sink, so tokens can be rotated.

Backend help you can rely on: error bodies now never contain stack traces or credentials, and every error has a `requestId` you can log instead of the token.

### 22.3 Malformed menu URL

- `lib/data/nav.ts`: replace `${process.env.BASE_API_URL}system-setup/${roleCode}/menus` with `buildApiUrl(`/system-setup/${roleCode}/menus`)`.
- Grep for any other `BASE_API_URL}` string concatenation and move it to `buildApiUrl`.
- Add a unit test for `buildApiUrl` with `BASE_API_URL` = `.../api/v1` and `.../api/v1/`, both must produce exactly one slash.
- After the fix, a malformed path now returns a JSON 404 `NOT_FOUND` (not a 401), so the two failures are distinguishable. If the correct `GET /api/v1/system-setup/01/menus` still returns 401 with a valid token, send Brian the `X-Request-Id` from that response.

---

## 13. Concern-by-concern decision list (the reply `BACKEND_API_CONCERNS.md` asked for)

```text
1.  Admin dashboard: Option B, GET /api/v1/dashboard/admin (replaces the multi-call admin source; cockpit unchanged)
2.  Empty vs zero: null + unavailableMetrics + dataStatus PARTIAL; hard failure = 503 with requestId
3.  Subscriber online status: added isOnline, lastSeenAt, activeSessionId (status stays lifecycle)
4.  Hub KPI scope: tenant + search, ignoring statusFilter and pagination; applied query echoed in `query`
5.  Analytics: extended DTO (previous period, per-router revenue, avg session duration, donut count/avg)
6.  Money precision: decimal strings scale 2 KES; no Number arithmetic
7.  Session counters: integer strings, cumulative, rollover-corrected, null = not reported
8.  Session pagination: paginated (default 50, max 200), KPIs cover whole scope, poll every 30 s, no cache
9.  Router status: keep all four; status authoritative over online
10. Router ids: both kept; per-row links with the correct id; null link = action unavailable
11. Equipment: uppercase enums + string money are permanent; meanings documented; full audit history
12. Vouchers: list, statistics, batch ledger, generation and ids documented; idempotent; first-use expiry
13. TV auth: public verify issues a signed portal token; token or JWT on the other three
14. TV phones: may differ; customerPhone owns the entitlement, phone pays; same normalization
15. TV payment safety: body-bound Idempotency-Key; 409 AMOUNT_MISMATCH envelope with serverAmount
16. TV status: state + provisioningState + pendingReason + supportReference; read-only polling
17. Packages: source-of-truth table; one id space, product-checked server side
18. IP pools: used-IP rules per pool type; invariants guaranteed; stale/probe status exposed
19. Timestamps: UTC instants with Z; business dates are date-only Africa/Nairobi
20. Equipment seed data: dataQuality VERIFIED / PLACEHOLDER / MISSING + needsCorrection
21. Router throughput: from RADIUS accounting, null when unattributable, telemetryStatus added; TV callbacks: STK only
22.1 Live sessions 500: fixed; 503 LIVE_SESSIONS_UNAVAILABLE with requestId on data-source failure
22.2 JWT logging: frontend fix required (section 12)
22.3 Menu URL: frontend fix required (section 12)
```

---

## 14. Suggested order of work

1. **Section 12** (security, small, critical).
2. **Section 0** shared helpers: envelope/error parsing by code, request id display, money-as-string formatter, BigInt byte formatter, date-only formatter, `null` → "-".
3. **Live sessions** (was fully broken) and **subscriber hub** (wrong online status on screen today).
4. **Admin dashboard** (new endpoint, delete fake revenue).
5. **TV portal flow** (blocker for production TV payments).
6. **Routers**, **analytics**, **equipment**, **vouchers**, **IP pools**, **packages**.

## 15. Things to know that are not your job, but will affect testing

- The backend needs DB migrations applied by hand on each environment (they are not in the repo). If an endpoint above returns 503 `DATA_SOURCE_UNAVAILABLE` on a fresh environment, send Brian the request id before debugging your code; it is probably a missing migration.
- TV endpoints need the server env var `TV_PORTAL_TOKEN_SECRET`. Without it, verify returns 503 `TV_PORTAL_TOKEN_NOT_CONFIGURED`. That is a deployment issue, not a frontend bug.
- Rate limits are real on the public portal endpoints (TV verify/initiate, voucher lookup/activate: 429). When testing repeatedly from one machine, expect 429s; wait `retryAfterSeconds`.
- `GET /api/v1/network/ip-mappings` is now tenant-filtered; a tenant admin sees only its own NAS sessions. Fewer rows than before is correct.
- Known backend open item (being decided by Brian): client IP detection behind the proxy. It can affect which tenant an anonymous TV verify resolves to on some deployments. If verify returns `TV_TENANT_UNRESOLVED` from a real hotspot, report it with the request id.

## 16. Definition of done for the frontend

- [ ] No API money or byte value passes through `Number()` for display; `"100000000000000.01"` renders exactly.
- [ ] No API `null` renders as `0`; unavailable metrics show "-" or are hidden.
- [ ] Every error/unavailable state shows the `requestId`.
- [ ] Subscriber table shows lifecycle and connection separately; ACTIVE + offline renders correctly.
- [ ] Live sessions page loads (200), paginates, polls at 30 s, and shows lost-contact / paid-not-connected.
- [ ] Admin dashboard uses only `/dashboard/admin`; no revenue computed from package prices; charts come from the API.
- [ ] Routers show four statuses; every action uses `links.*`; null link = disabled button.
- [ ] Equipment shows data quality, uses uppercase enums, string money, real pagination and the history diff.
- [ ] Voucher generation sends `Idempotency-Key` and `expectedUnitPrice`; PAID stock goes through finance batches.
- [ ] TV flow works end to end with no JWT: verify → token → eligible → initiate (with key) → status screens per section 10.6.
- [ ] Both 502 TV cases are handled differently; `STK_OUTCOME_UNKNOWN` never tells the user no money was taken.
- [ ] No raw JWT or `Authorization` header in any log; CI check in place.
- [ ] `buildApiUrl` used for the menu URL; test covers both `BASE_API_URL` forms.

Questions: Brian. Include the `X-Request-Id` of the failing call whenever something looks wrong.
