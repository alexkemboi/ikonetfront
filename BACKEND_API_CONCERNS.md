# Backend Integration Concerns and Required Decisions

**Updated:** 2026-09-22  
**Audience:** Backend/API team and frontend integration team  
**Scope:** Concerns found while wiring the frontend to the backend handoff in `tue-monday-frontend.md`.

## Status summary

The frontend has been changed to call the new backend endpoints and the following fabricated frontend data has been removed:

- Demo subscriber rows and subscriber KPI values
- Demo live-session rows
- Hash-generated download/upload counters
- Demo router inventory
- Demo equipment inventory and generated serial numbers
- Demo voucher rows
- Hardcoded company selector values
- Stale voucher package options
- Admin dashboard mock revenue, alerts, operations, and chart values

The remaining items below are not requests to restore fallback data. They are contract decisions or backend corrections required to ensure that the frontend displays truthful data and does not silently assign an incorrect meaning to a backend field.

## How to read each concern

Each item contains:

- **Current frontend behavior:** what the code does today
- **Why this matters:** the user-visible or data-integrity risk
- **Backend decision/request:** the exact response or decision needed
- **Acceptance criteria:** how we will verify that the concern is closed

---

## 1. Admin dashboard response is incomplete

**Priority:** Blocker for a complete admin dashboard  
**Frontend files:**

- `app/(dashboard)/dashboard/admin/page.tsx`
- `app/(dashboard)/dashboard/_components/DashboardShell.tsx`
- `actions/dashboard.ts`

**Endpoint:** `GET /api/v1/dashboard/operations-cockpit`

### Current frontend behavior

The admin dashboard currently receives some live counts from existing calls:

- Customer count from `GET /customers`
- Active customer count from `GET /customers?isActive=true`
- PPPoE customer count from `GET /customers?custtype=pppoe`
- Package count from the package endpoint
- Device count and online-device count from the device endpoint

The following values are not currently provided by the backend response used by the admin dashboard. They now render as zero or an empty chart instead of fabricated values:

- Daily revenue
- Weekly revenue
- Collected revenue
- Outstanding balances
- Failed payments
- Hotspot revenue
- PPPoE revenue
- Suspended revenue loss
- High CPU router count
- High memory router count
- Expiring customer count
- Expired account count
- Failed PPPoE sessions
- Failed Hotspot sessions
- Network congestion alerts
- SLA breaches
- Failed payment callbacks
- SMS failures
- Fraud alerts
- Bandwidth alerts
- Active PPPoE sessions
- Active Hotspot sessions
- Current bandwidth usage
- Peak-hour bandwidth usage
- Uptime percentage
- Churn rate
- Support-ticket count
- Revenue trend chart
- Subscriber growth chart

The current frontend also calculates revenue from package prices for some fields. Package catalog price totals are not actual collected revenue and must not be treated as a financial aggregate.

### Why this matters

The dashboard can show a mixture of live counts and zero-valued unavailable metrics. A zero may be interpreted by an operator as “there were no failures/revenue/alerts,” when the actual meaning is “the API did not provide this field.”

### Backend decision/request

Confirm one of the following:

**Option A: Extend the existing cockpit response.** Add all required fields to `OperationsCockpitResponse`.

**Option B: Add a separate endpoint.** For example:

`GET /api/v1/dashboard/admin`

If a separate endpoint is used, define whether the frontend should call both endpoints or whether the new endpoint replaces the existing admin dashboard data source.

The response must define these sections:

```ts
interface AdminDashboardResponse {
  period: {
    from: string;
    to: string;
    timezone: string;
  };
  customers: {
    total: number;
    active: number;
    inactive: number;
    pppoe: number;
  };
  packages: {
    total: number;
    active: number;
    inactive: number;
  };
  devices: {
    total: number;
    online: number;
    offline: number;
    healthyRouters: number;
  };
  revenue: {
    daily: string;
    weekly: string;
    monthly: string;
    active: string;
    inactive: string;
    expected: string;
    collected: string;
    outstanding: string;
    failedPayments: number;
    hotspot: string;
    pppoe: string;
    suspendedRevenueLoss: string;
    currency: string;
  };
  alerts: {
    offlineRouters: number;
    highCpuRouters: number;
    highMemoryRouters: number;
    expiringCustomers: number;
    expiredAccounts: number;
    failedPppoeSessions: number;
    failedHotspotSessions: number;
    networkCongestion: number;
    slaBreaches: number;
    failedPaymentCallbacks: number;
    smsFailures: number;
    fraudAlerts: number;
    bandwidthAlerts: number;
  };
  operations: {
    activePppoeSessions: number;
    activeHotspotSessions: number;
    currentBandwidthMbps: number;
    peakBandwidthMbps: number;
    uptimePercentage: number;
    churnRate: number;
    supportTickets: number;
  };
  revenueTrend: Array<{
    period: string;
    revenue: string;
    collected: string;
  }>;
  subscriberGrowth: Array<{
    period: string;
    subscriberCount: number;
  }>;
}
```

Money fields should be returned as decimal strings or minor-unit integers, not floating-point JSON numbers.

### Acceptance criteria

- No dashboard revenue is calculated from package catalog prices.
- The API documents whether an unavailable metric is `0`, `null`, or omitted.
- Revenue chart data is returned by the backend and is not generated in `DashboardShell.tsx`.
- Every aggregate includes its date range, timezone, and currency.
- Backend tests verify totals against the ledger/payment source.

---

## 2. Dashboard empty state must be distinguishable from real zero

**Priority:** High  
**Frontend file:** `actions/dashboard.ts`

### Current frontend behavior

When authentication is missing, the request fails, or the response has no data, the frontend returns an object filled with empty strings, zeroes, and empty arrays. This is an intentional non-fabricated fallback, but the UI does not receive a separate `unavailable` indicator.

### Why this matters

The following two conditions look identical to the UI:

1. The backend successfully reports zero failures and zero revenue.
2. The backend is unavailable and the frontend substituted zeros.

### Backend decision/request

Use one of these approaches:

- Return an explicit `available: false` or `dataStatus: "UNAVAILABLE"` field.
- Return a failed `ApiResponse` and allow the frontend to render an error/unavailable state.
- Define `null` semantics for unavailable numeric fields.

### Acceptance criteria

An operator can distinguish “zero” from “not loaded/unavailable” without inspecting logs.

---

## 3. Subscriber lifecycle status is not online status

**Priority:** Blocker for correct subscriber status display  
**Frontend files:**

- `actions/subscribers.ts`
- `lib/types/subscribers.ts`
- `components/subscribers/SubscriberDataTable.tsx`

**Endpoint:** `GET /api/v1/subscribers/hub`

### Current frontend behavior

The backend row contains account lifecycle status:

```text
ACTIVE | GRACE | EXPIRED | SUSPENDED
```

The existing subscriber UI expects an online connection status:

```text
ONLINE | OFFLINE
```

The compatibility adapter currently maps:

- `ACTIVE` or `GRACE` to `ONLINE`
- `EXPIRED` or `SUSPENDED` to `OFFLINE`

This is only a temporary compatibility mapping. It is not logically correct because an active account can be offline, and a grace-period account can be online or offline.

### Why this matters

Operators may see an account as online when it has no active network session, or as offline when it has an active session. Account entitlement and current connectivity are separate concepts.

### Backend decision/request

Add these fields to `SubscriberHubRow`:

```ts
status: "ACTIVE" | "GRACE" | "EXPIRED" | "SUSPENDED";
isOnline: boolean;
lastSeenAt: string | null;
activeSessionId: string | null;
```

If the backend does not want to expose session identity, `isOnline` and `lastSeenAt` are the minimum required fields.

Also confirm whether `onlinePercentage` is calculated from all accounts or only accounts eligible for an active session.

### Acceptance criteria

- The UI displays lifecycle status and connection status separately.
- `ACTIVE` does not imply `ONLINE`.
- Backend tests cover active-but-offline and expired-but-still-connected edge cases.
- `onlineCount` equals the number of rows where `isOnline === true` for the requested scope.

---

## 4. Subscriber pagination and KPI scope need to be explicit

**Priority:** High  
**Endpoint:** `GET /api/v1/subscribers/hub?page=0&size=25&statusFilter=&companyId=&search=`

### Current frontend behavior

The frontend requests only page zero with size 25 and passes the returned rows to a table that historically expected a flat list. The KPI values are taken from the response, while the displayed rows represent only the first page.

### Why this matters

A user may compare the KPI total with the visible rows and assume they refer to the same set. Search, status filter, company scope, and pagination can also produce mismatched KPI interpretation if the KPI scope is not documented.

### Backend decision/request

Document whether `kpis` represent:

- The entire authorized tenant/company scope, or
- Only the filtered/search result set.

Return the applied query values in the response or make the scope rules explicit in the API documentation.

### Acceptance criteria

For the same request, the backend documents the relationship between `kpis`, `rows.totalElements`, `statusFilter`, `companyId`, and `search`.

---

## 5. Unified analytics does not preserve all existing chart/table semantics

**Priority:** High  
**Frontend files:**

- `actions/analytics.ts`
- `lib/types/analytics.ts`
- `components/analytics/PaymentsTrendChart.tsx`
- `components/analytics/PaymentsVsExpensesChart.tsx`
- `components/analytics/RevenueMixDonuts.tsx`
- `components/analytics/RouterPerformanceTable.tsx`

**Endpoint:** `GET /api/v1/analytics/unified`

### Current frontend behavior

The backend contract supplies new fields such as:

- `revenue30d`
- `profit30d`
- `marginPct`
- `date` and `revenue` trend points
- package revenue and new subscriptions
- revenue mix buckets
- payment method totals
- router health score, latency, sessions, and data volume

The existing frontend model expects additional or differently named values:

- Current-period and previous-period trend values per point
- Average session duration
- Per-router revenue amount
- Per-router revenue share
- Donut segment count and average amount
- Numeric values rather than BigDecimal strings

The adapter currently supplies zero or `—` for fields that the new contract does not provide. In particular, previous-period chart values and per-router revenue values are not real backend values.

### Why this matters

A chart that displays zero previous-period values can imply that the previous period had no revenue. A router table displaying zero revenue share can imply that a router generated no revenue. Those are different from “the backend did not provide this measure.”

### Backend decision/request

Choose one:

1. Extend `/analytics/unified` with all fields required by the existing UI.
2. Approve a frontend analytics redesign that removes unsupported measures.

If preserving the existing UI, add:

```ts
paymentsTrend: {
  periodTotal: string;
  previousPeriodTotal: string;
  deltaPercent: string;
  points: Array<{
    date: string;
    currentRevenue: string;
    previousRevenue: string;
  }>;
};

routerPerformance: Array<{
  routerId: number;
  routerName: string;
  revenueAmount: string;
  revenueSharePercent: string;
  activeSessions: number;
  dataTransferredGb: string;
  healthScore: number;
  latencyMs: number;
}>;
```

Otherwise, the frontend should remove the unsupported columns and labels instead of showing zero placeholders.

### Acceptance criteria

- No analytics value is represented as zero merely because the field was absent.
- Every chart series has an explicit unit and period.
- Backend totals reconcile with the ledger and payment source.
- Router revenue attribution is defined by a documented attribution rule.

---

## 6. Analytics money precision and frontend numeric conversion

**Priority:** High  
**Frontend file:** `actions/analytics.ts`

### Current frontend behavior

The backend returns BigDecimal values as strings. The current compatibility adapter converts them with JavaScript `Number` so existing chart components can consume them.

### Why this matters

`Number` is not safe for arbitrary monetary precision. It can round values and produce incorrect totals when values are aggregated or compared.

### Backend decision/request

Confirm one supported representation:

- Decimal strings used only for display, with no frontend arithmetic.
- Minor-unit integers, for example cents/cents-equivalent, with an explicit currency exponent.
- A documented decimal library contract for frontend calculations.

### Acceptance criteria

- A value such as `100000000000000.01` is not rounded silently.
- Currency and scale are documented.
- Frontend aggregation is either removed or uses an approved decimal strategy.

---

## 7. Live-session row counters need a lossless type

**Priority:** High  
**Frontend files:**

- `actions/sessions.ts`
- `lib/types/sessions.ts`
- `components/sessions/LiveSessionDataTable.tsx`

**Endpoint:** `GET /api/v1/sessions/live`

### Current frontend behavior

The KPI totals are strings, but row-level fields are documented as JSON numbers:

```ts
downloadBytes: number | null;
uploadBytes: number | null;
```

The frontend converts those values to JavaScript numbers for formatting.

### Why this matters

Large byte counters can exceed `Number.MAX_SAFE_INTEGER`. RADIUS counters also require rollover handling, which the backend says is handled by `RadacctByteMath`.

### Backend decision/request

Return row-level byte counters as strings:

```ts
downloadBytes: string;
uploadBytes: string;
```

Also document:

- Whether values are cumulative session totals or current interval totals
- Whether they include rollover correction
- Whether zero means “no traffic” or “counter unavailable”
- Whether values are decimal bytes or another unit

### Acceptance criteria

- Frontend formatting does not lose digits.
- Backend tests cover 32-bit rollover.
- A missing counter has a distinct documented representation from a genuine zero.

---

## 8. Live-session pagination and refresh behavior

**Priority:** Medium  
**Endpoint:** `GET /api/v1/sessions/live?page=0&size=50&companyId=&stationId=`

### Current frontend behavior

The frontend requests page zero with size 50 and displays only the returned page. There is no pagination control on the current live-session page.

### Backend decision/request

Confirm whether:

- The product intentionally displays only the first 50 sessions, or
- The frontend must add pagination/infinite loading, or
- The endpoint should return a server-defined capped live monitor list.

Also document refresh expectations: polling interval, cache behavior, and whether KPI totals correspond to all sessions or only the current page.

### Acceptance criteria

The UI label and pagination behavior accurately reflect the number of sessions represented by the table.

---

## 9. Router status detail is currently collapsed

**Priority:** High  
**Frontend files:**

- `actions/provisioning.ts`
- `lib/types/provisioning.ts`
- `app/(dashboard)/network/routers/page.tsx`

**Endpoint:** `GET /api/v1/provisioning/nas-routers`

### Current frontend behavior

The backend supports:

```text
ONLINE | OFFLINE | DEGRADED | NOT_PROVISIONED
```

The existing frontend model supports only:

```text
ONLINE | OFFLINE
```

The adapter currently maps `DEGRADED` and `NOT_PROVISIONED` to `OFFLINE`.

### Why this matters

A degraded router may still serve customers and require different operator action from a completely offline router. A not-provisioned device is also a provisioning problem, not a connectivity failure.

### Backend decision/request

Confirm that the frontend may extend its status model to preserve all four values. The preferred contract is to keep the backend values unchanged and update the UI.

Also define whether `online: boolean` is authoritative when it conflicts with `status`.

### Acceptance criteria

- The UI displays all four statuses distinctly.
- KPI counts define whether degraded routers count as online, offline, or a separate category.
- `NOT_PROVISIONED` rows cannot trigger telemetry actions that require a numeric `routerId`.

---

## 10. Router ID rules must be enforced consistently

**Priority:** High  
**Endpoint:** `GET /api/v1/provisioning/nas-routers`

### Current frontend behavior

The endpoint returns both:

- `routerId`: `network_routers.idxno`, used for telemetry and router actions
- `deviceId`: `network_device.id`, used for provisioning, interfaces, and device operations

The frontend maps one of these into the legacy `id` field for existing UI components.

### Why this matters

Using `deviceId` where an action requires `routerId`, or vice versa, can target the wrong record or produce an invalid-router error.

### Backend decision/request

Keep both fields permanently and document the required ID for every endpoint. Do not require clients to infer the correct ID from IP address, name, or array position.

Recommended endpoint documentation table:

| Operation | Required identifier |
|---|---|
| Router monitoring | `routerId` |
| Router action / CoA / telemetry | `routerId` |
| Device interfaces | `deviceId` |
| Device delete | `deviceId` |
| Provisioning | `deviceId` or explicitly documented provisioning ID |

### Acceptance criteria

- Orphan rows with one missing ID are returned safely.
- Endpoints reject the wrong ID with a clear error code.
- No frontend IP-based ID stitching is required.

---

## 11. Equipment DTO and money fields need a migration decision

**Priority:** High  
**Frontend files:**

- `actions/equipment.ts`
- `lib/types/equipment.ts`
- `components/equipment/EquipmentKpiCards.tsx`
- `components/equipment/EquipmentDataTable.tsx`

**Endpoints:**

- `GET /api/v1/equipment`
- `POST /api/v1/equipment`
- `PATCH /api/v1/equipment/{assetId}`
- `GET /api/v1/equipment/{assetId}/history`

### Current frontend behavior

The backend returns uppercase asset types/statuses, paginated items, and BigDecimal strings. The existing UI expects lowercase values, a flat list, and numeric money values.

The adapter currently converts:

- `INSTALLED` to the legacy UI status `assigned`
- uppercase asset types to legacy lowercase types
- money strings to JavaScript numbers
- `items.content` to the flat array expected by the table

### Backend decision/request

Confirm whether this compatibility mapping is temporary. If temporary, provide a migration deadline. If permanent, document the compatibility DTO expected by the frontend.

Also clarify the meaning of:

- `totalCost`
- `totalUnpaid`
- `paidSoFar`
- `assignedSubscriberName`
- derived flags `returned`, `damaged`, and `sold`

### Acceptance criteria

- Asset type/status values are stable and documented.
- Monetary precision is preserved.
- `PATCH` history records all financial and ownership changes.
- Seeded CPE rows do not contain placeholder asset tags/serials unless explicitly marked as incomplete.

---

## 12. Voucher list, statistics, and batch ledger are separate contracts

**Priority:** High  
**Frontend files:**

- `actions/vouchers.ts`
- `actions/payments.ts`
- `app/(dashboard)/finance/vouchers/page.tsx`
- `components/vouchers/VoucherBatchLedger.tsx`

**Endpoints:**

- `GET /api/v1/hotspot/vouchers`
- `POST /api/v1/hotspot/vouchers/create`
- `GET /api/v1/hotspot/vouchers/statistics`
- Existing batch path: `GET /api/v1/finance/voucher-batches`

### Current frontend behavior

The voucher page loads two independent data sets:

1. Individual vouchers from `/hotspot/vouchers`
2. Batch ledger rows from `/finance/voucher-batches`

The handoff documents field renames for individual vouchers but does not define the statistics response or the batch ledger response in enough detail.

Package selection also comes from the active package catalog. Voucher generation must not continue if that catalog request fails.

### Backend decision/request

Provide complete DTO examples for:

- Individual voucher list, including pagination
- Statistics/KPIs
- Batch ledger rows and totals
- Generation response
- Status enum and expiry semantics

Define whether `voucherBatchId` and `batchNumber` are stable identifiers or display labels.

### Acceptance criteria

- Individual voucher KPIs and batch KPIs have documented scopes.
- Voucher generation validates package ownership and current package version server-side.
- Retry behavior is idempotent or returns the existing generation result.
- No generated-looking voucher code is displayed when the API is unavailable.

---

## 13. TV authentication for captive-portal users is unresolved

**Priority:** Blocker for production TV payments  
**Frontend files:**

- `actions/tv.ts`
- `app/(hotspot)/hotspot/_components/TvDeviceSetup.tsx`
- `app/(hotspot)/hotspot/_components/TvPurchaseReview.tsx`

**Endpoints:**

- `POST /api/v1/tv/devices/verify`
- `GET /api/v1/tv/packages/eligible`
- `POST /api/v1/tv/payments/initiate`
- `GET /api/v1/tv/payments/{transactionRef}/status`

### Current frontend behavior

The frontend calls these actions using the shared authenticated API client. The backend handoff says the endpoints require JWT/role checks and include customer role `05`.

The hotspot portal can be opened through a captive-portal flow where a normal logged-in JWT may not exist.

### Backend decision/request

Document the authentication path for each endpoint:

| Endpoint | Public | Captive session token | Customer JWT | Staff JWT |
|---|---:|---:|---:|---:|
| Device verification | TBD | TBD | TBD | TBD |
| Eligible packages | TBD | TBD | TBD | TBD |
| Payment initiation | TBD | TBD | TBD | TBD |
| Payment status | TBD | TBD | TBD | TBD |

If guest users are supported, define how the backend issues and validates the guest/session token and how the guest is bound to the captive-portal company/station.

### Acceptance criteria

- A real captive-portal user can complete verification and payment without an unavailable JWT error.
- A request cannot be replayed across companies, stations, or devices.
- Staff/admin access remains tenant-authorized.

---

## 14. TV verification requires phone before package selection

**Priority:** High  
**Frontend files:**

- `lib/validation/tv-device.ts`
- `app/(hotspot)/hotspot/_components/TvDeviceSetup.tsx`
- `actions/tv.ts`

### Current frontend behavior

The device setup now collects:

- `customerPhone`
- `macAddress`

The frontend sends both to `/tv/devices/verify`.

The payment review separately collects and normalizes the M-Pesa phone number. There are currently two phone concepts in the flow: the customer phone used during verification and the payment phone used for M-Pesa.

### Backend decision/request

Confirm whether these are required to be the same value. If they can differ, explain the business rule and which phone is associated with:

- Customer lookup
- Guest-user creation
- Payment initiation
- TV entitlement ownership
- Payment receipt and notifications

Also document the accepted phone format. The frontend normalizes Kenyan numbers to `2547...`/`2541...` for payment.

### Acceptance criteria

- The same normalized phone format is accepted by verification and payment.
- The backend documents whether a mismatch between customer phone and payment phone is allowed.
- Guest creation and duplicate-customer behavior are deterministic.

---

## 15. TV payment idempotency and amount mismatch behavior

**Priority:** Blocker for payment safety  
**Frontend files:**

- `actions/tv.ts`
- `app/(hotspot)/hotspot/_components/TvPurchaseReview.tsx`
- `lib/apiClient.ts`

### Current frontend behavior

The frontend:

1. Displays the package price from the package DTO.
2. Sends that displayed value as `submittedAmount`.
3. Sends `Idempotency-Key` with the payment request.
4. Reuses one generated key for retries from the same purchase review component.
5. Polls status through the server action after initiation support is available.

The backend must remain the source of truth for price and payment status.

### Backend decision/request

For amount mismatch, document the exact error envelope. The handoff states that HTTP 409 includes `message = "AMOUNT_MISMATCH"` and `validationOutcome.serverAmount`, but the standard `ApiResponse<T>` error shape must also be confirmed.

Define idempotency scope:

```text
same user + same endpoint + same Idempotency-Key
```

Confirm whether the key is also bound to:

- company
- package ID
- MAC address
- phone number
- request body hash

Define what happens if the same key is reused with a changed request body.

### Acceptance criteria

- A timeout followed by retry with the same key never creates a second payment.
- A changed request with an old key is rejected clearly.
- The frontend can read `serverAmount` from a 409 response and ask the user to confirm the corrected amount.
- No GL posting or provisioning occurs before the committed payment callback, as stated in the handoff.

---

## 16. TV payment status and provisioning state need explicit polling semantics

**Priority:** High  
**Endpoint:** `GET /api/v1/tv/payments/{transactionRef}/status`

### Current frontend behavior

The backend defines payment states:

```text
PENDING | SETTLED | FAILED | TIMED_OUT
```

It also returns `provisionedAt`, which may remain null after settlement. The frontend needs to distinguish:

- Payment still pending
- Payment settled and service provisioned
- Payment settled but provisioning parked
- Payment failed
- Payment timed out

### Backend decision/request

Document:

- Whether status polling requires the same auth/session as initiation
- How long transaction status remains available
- Whether `SETTLED` can transition back to another state
- Whether provisioning failure produces a separate status or only a null `provisionedAt`
- Whether `provisioningAttempts` is cumulative or per recovery cycle

### Acceptance criteria

- `SETTLED` with null `provisionedAt` is stable and queryable until provisioning completes or is permanently failed.
- The response provides an operator/support reference for parked transactions.
- Repeated polling is read-only and has no payment/provisioning side effects.

---

## 17. Package endpoint ownership and ID compatibility

**Priority:** High  
**Frontend files:**

- `actions/packages.ts`
- `actions/vouchers.ts`
- `actions/tv.ts`
- `app/(hotspot)/hotspot/page.tsx`

### Current frontend behavior

The handoff references all of the following package sources:

- `GET /system/packages/active`
- `GET /system/packages/category/{category}`
- `GET /hotspot/packages`
- `GET /tv/packages/eligible`

The frontend currently uses different package actions for admin packages, hotspot packages, voucher generation, and TV packages.

### Backend decision/request

Declare the source of truth for each product:

| Product | Endpoint | Package ID type | Price source |
|---|---|---|---|
| Admin package management | TBD | TBD | TBD |
| Hotspot purchase | TBD | TBD | TBD |
| Voucher generation | TBD | TBD | TBD |
| TV purchase | TBD | TBD | TBD |

Confirm whether an ID from one endpoint can be submitted to another endpoint. Confirm whether package price, validity, speed, and active status are guaranteed to be consistent across endpoints.

### Acceptance criteria

- The frontend does not mix package IDs from unrelated catalogs.
- The backend rejects a package from the wrong product/category with a clear error.
- Price and validity displayed before payment match the package re-fetched by the backend.

---

## 18. IP pool utilization definitions need documentation

**Priority:** Medium  
**Endpoint:** `GET /api/v1/network/ip-pools`

### Current frontend behavior

The frontend now displays the live pool fields supplied by the backend:

- `totalIps`
- `usedIps`
- `availableIps`
- `utilizationPercentage`

### Backend decision/request

Document exactly what counts as used for each pool:

- Active MikroTik lease
- Database reservation
- Expired lease
- Static binding
- WireGuard enabled peer
- Gateway/network/broadcast reserved address
- Quarantined or excluded address

Also document how stale router probes are handled and whether `usedIps` can temporarily exceed `totalIps`.

### Acceptance criteria

- `availableIps = totalIps - usedIps`.
- `0 <= utilizationPercentage <= 100`.
- WireGuard peers are counted only according to the stated `enabled` rule.
- A failed live probe has a documented cache/error behavior.

---

## 19. Timestamp and timezone conventions must be standardized

**Priority:** High  
**Affected endpoints:** dashboard, subscribers, sessions, routers, equipment, vouchers, TV payments

### Current frontend behavior

The handoff uses mixed descriptions:

- UTC ISO-8601 instant for live-session `connectedAt`
- ISO local datetime for router `snapshotAt`
- ISO local datetime for TV settlement/provisioning fields
- Nairobi calendar date for subscriber `expiryDate`

### Why this matters

The frontend formats and compares dates in multiple places. A local datetime without an offset can be interpreted using the server, browser, or deployment timezone.

### Backend decision/request

Standardize timestamp fields as UTC ISO-8601 with an explicit `Z` or offset. For date-only business fields, explicitly mark them as date-only values and document that business-day calculations use `Africa/Nairobi`.

### Acceptance criteria

- No timestamp field changes meaning based on browser timezone.
- Expiry dates near midnight EAT have deterministic behavior.
- Backend API documentation labels every timestamp as instant, local datetime, or date-only.

---

## 20. Equipment seed data is not fully clean

**Priority:** Medium  
**Endpoint:** `GET /api/v1/equipment`

### Current behavior

The handoff states that seeded router rows have real serial numbers, but some CPE rows have placeholder asset tags because no source serial exists. The frontend now displays the backend value directly and no longer creates `S{id}` values.

### Backend decision/request

Expose a clear data-quality state, for example:

```ts
serialNumber: string | null;
assetTag: string;
dataQuality: "VERIFIED" | "PLACEHOLDER" | "MISSING";
```

Do not present a placeholder as a verified physical serial number.

### Acceptance criteria

- Operators can identify records needing correction.
- Asset tag and serial number uniqueness rules are enforced.
- History records the correction and the operator who made it.

---

## 21. Remaining backend caveats from the handoff

### Router analytics throughput

The handoff says `dataTransferredGb` in `/analytics/unified` is zero when SNMP polling is unavailable. Confirm whether zero means no traffic or telemetry unavailable. A nullable value plus a telemetry status would avoid misleading zeroes.

Recommended fields:

```ts
dataTransferredGb: string | null;
telemetryStatus: "LIVE" | "STALE" | "UNAVAILABLE";
telemetrySampledAt: string | null;
```

### TV callback matching

The handoff says callback matching currently uses `checkoutRequestId` and that transaction-reference matching is a future enhancement for non-STK rails. Confirm that the current TV flow always produces a non-null checkout request ID for every supported payment path.

If cash, card, bank, or another non-STK rail is enabled, add transaction-reference matching before exposing that rail in the frontend.

---

## 22. Urgent runtime errors and security findings

These issues were observed while comparing the local development response with the optimized production response. They should be treated as urgent because one breaks live-session functionality, one can expose credentials, and one produces an invalid backend URL.

### 22.1 Live sessions endpoint returns HTTP 500

**Priority:** Critical  
**Endpoint:** `GET /api/v1/sessions/live?page=0&size=50`

#### Observed behavior

The frontend request to `/api/v1/sessions/live` returned:

```text
HTTP 500 Internal Server Error
```

The current frontend action in `actions/sessions.ts` handles this failure by returning an explicit empty state:

```ts
currentlyConnectedCount: 0;
pppoeCount: 0;
hotspotCount: 0;
downloadTrafficGb: 0;
uploadTrafficGb: 0;
totalTrafficGb: 0;
sessions: [];
```

This is why the current UI can show `0 active sessions` and an empty table. It is not evidence that the network has no active sessions; it means the backend request failed.

#### Required backend investigation

Please inspect the server-side exception for this request and identify:

- The controller/service method that throws
- The database query or RADIUS accounting query involved
- Whether the failure is caused by an invalid company/station scope
- Whether a missing table, column, migration, or relation is involved
- Whether BIGINT/RADIUS octet conversion causes the exception
- Whether the endpoint fails only for this user/role or for every authorized request

#### Required success contract

For a successful request, return HTTP 200 with the standard envelope and this shape:

```ts
{
  success: true,
  message: string,
  data: {
    kpis: {
      currentlyConnected: number,
      pppoeCount: number,
      hotspotCount: number,
      downloadBytesTotal: string,
      uploadBytesTotal: string,
      totalBytesTotal: string
    },
    sessions: {
      content: LiveSessionDTO[],
      totalElements: number,
      totalPages: number,
      number: number,
      size: number
    }
  }
}
```

#### Required failure contract

Do not return an HTML error page or an unstructured stack trace. Return the normal API envelope with a stable error code, for example:

```ts
{
  success: false,
  message: "LIVE_SESSIONS_UNAVAILABLE",
  data: {
    requestId: string
  }
}
```

The server must log the full exception internally with the request ID, but must not send stack traces, SQL, credentials, or tokens to the browser.

#### Acceptance criteria

- An authorized request returns HTTP 200 when the live-session data source is healthy.
- The endpoint returns an empty `content` array with zero KPIs for a valid scope with no sessions, not HTTP 500.
- RADIUS octets are returned as lossless decimal strings.
- The endpoint returns a stable sanitized error envelope when its data source is unavailable.
- Backend logs contain a correlation/request ID that support can use to locate the server exception.

---

### 22.2 Raw JWT is written to logs

**Priority:** Critical security issue  
**Frontend file:** `actions/roles.ts`

#### Evidence

The current code contains:

```ts
console.log("Current session in getAuthHeaders:", session?.user?.apiToken);
```

This logs the complete bearer token/JWT. The same file also logs request details and headers while saving role menus. Any server log collector, terminal capture, CI artifact, or debugging stream that receives this output may contain a reusable credential.

#### Required fix

- Remove every log statement that prints `session.user.apiToken` or an `Authorization` header.
- Do not serialize the complete session object in logs.
- Redact credentials in error objects before logging them.
- Rotate/revoke any JWT that may already have been written to shared logs.
- Search the deployed build and runtime logs for the token pattern `eyJ` and remove or restrict access to affected log records according to the incident process.

The following related debug logs should also be reviewed and removed or sanitized:

- Role/menu request logs in `actions/roles.ts`
- Auth-header/base-URL logs in `actions/system.ts`
- Role and user JSON dumps in `app/(dashboard)/system/access/page.tsx`
- User and role dumps in `app/(dashboard)/system/users/page.tsx`

Safe logging may include only metadata such as:

```ts
{
  hasToken: Boolean(session?.user?.apiToken),
  roleCode,
  status: response.status,
  requestId
}
```

#### Acceptance criteria

- No production log contains a raw JWT, bearer token, refresh token, cookie, password, client secret, or full `Authorization` header.
- Automated tests or static checks reject logging expressions that reference `apiToken` in `console.*` calls.
- Existing potentially exposed tokens have been invalidated/rotated.
- Error responses sent to the browser contain no server stack traces or credential material.

---

### 22.3 Malformed role-menu URL

**Priority:** Critical integration issue  
**Frontend file:** `lib/data/nav.ts`

#### Observed behavior

The role-menu request was observed as:

```text
/api/v1system-setup/01/menus
```

The required path is:

```text
/api/v1/system-setup/01/menus
```

The current URL construction concatenates the environment variable directly:

```ts
`${process.env.BASE_API_URL}system-setup/${roleCode}/menus`
```

If `BASE_API_URL` does not end with `/`, the result omits the separator between `v1` and `system-setup`.

#### Impact

- The request can reach the wrong route or fail before backend routing.
- The dashboard may fall back to static navigation instead of server-driven menus.
- A resulting 401/404 can be misdiagnosed as a role or token authorization problem.

#### Required fix

Use the shared URL builder already defined in `lib/constants.ts`:

```ts
buildApiUrl(`/system-setup/${roleCode}/menus`)
```

Do not construct backend URLs by direct string concatenation. Also verify that all deployment values of `BASE_API_URL` work with and without a trailing slash.

#### Backend verification request

After the frontend URL fix, verify that the correctly formed request:

```text
GET /api/v1/system-setup/01/menus
Authorization: Bearer <valid-token>
```

returns the expected menu envelope for role `01`. If it still returns 401, provide the backend authorization reason separately; a malformed URL and an invalid token are different failures.

#### Acceptance criteria

- The final request URL contains exactly one slash between every path segment.
- Role `01` receives HTTP 200 with the expected menu data when authorized.
- Missing/invalid authorization returns a structured 401 without exposing token data.
- Tests cover `BASE_API_URL` with both `/api/v1` and `/api/v1/` forms.

---

## Final backend response requested

Please reply with a decision for each numbered item using this format:

```text
1. Admin dashboard: Option A / Option B
2. Subscriber online status: add isOnline / approve frontend status migration
3. Analytics: extend DTO / redesign frontend
...
```

For every accepted contract, please provide:

- Final endpoint and HTTP method
- Authentication mechanism
- Required headers
- Query parameters
- Complete success DTO
- Complete error DTO and error codes
- Nullability rules
- Numeric precision/unit rules
- Timestamp/timezone rules
- Pagination rules
- Tenant/company scope rules
- Idempotency/retry behavior for mutations
- One success example and one failure example
