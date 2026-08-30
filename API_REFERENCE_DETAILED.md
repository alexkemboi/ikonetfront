# Complete, Fully-Detailed API Reference — `ibs-api`
> Zero-assumptions version. Every term is defined before it's used. Source: `BACKEND_CONTRACT.md` (2026-08-29).

---

## Part 1 — Vocabulary (read this before anything else)

| Term | Meaning |
|---|---|
| **API** | A fixed set of "doors" (URLs) one program can call to ask another program for data or an action. You can only use doors that exist. |
| **Endpoint** | One specific door: a fixed HTTP method + fixed path + fixed input/output shape. |
| **HTTP method** | The verb of the request. `GET` = "give me data" (read-only). `POST` = "here's data, create or do something with it." |
| **Path / URL** | The door's address, e.g. `/api/v1/customers/{idxno}`. Anything in `{curly braces}` is a placeholder you fill in with a real value. |
| **Query parameter** | Extra info tacked onto a URL after `?`, e.g. `/api/v1/customers?page=2&size=20`. |
| **Request body** | Data sent along with a `POST`, written in JSON. |
| **Response** | What comes back: a status code + a body (usually JSON). |
| **HTTP status code** | `200` success. `201` success + something created. `401` "I don't know who you are." `403` "I know who you are, you're not allowed." `503` "not available right now" (used deliberately here for unbuilt features). `501` "not implemented" (used for the fake live-monitoring route). |
| **JSON** | Plain-text structured data format: `{ "key": "value" }`. |
| **JWT (JSON Web Token)** | A long encoded, signed string proving "this user logged in." It carries its own data inside it (**claims**) and isn't looked up in a database — it's self-contained and tamper-evident. |
| **Bearer token** | How you present your JWT: header `Authorization: Bearer <the long token string>`. Like a train ticket — whoever holds it is treated as authenticated. |
| **Claims** | Data encoded inside a JWT: here, `sub, role, stationId, companyId, companyScope, investorScope, regionScope, userId, iat, exp`. |
| **Envelope** | The fixed wrapper shape EVERY response uses: `{ status, success, message, data, timestamp }`. The real content is always inside `data`. |
| **Pagination** | Sending large lists in chunks ("pages") instead of all at once. `Page<T>` means the real array is at `data.content`, and `data.totalElements` is the grand total count. |
| **Role / RBAC** | Every user has one `role` baked into their JWT (e.g. `ADMIN`, `CUSTOMER`). Endpoints check if your role is allowed; if not, `403`. |
| **RLS (Row-Level Security)** | Even if your role can use an endpoint, you may only see rows belonging to your own region/station/company — filtered server-side in the database query itself, not by the frontend hiding rows after the fact. |
| **CORS** | Browser rule: a website can't call an API unless the API explicitly allowlists that website's address. |
| **MAC address** | A unique hardware ID burned into a network device's network card, e.g. `AA:BB:CC:11:22:33`. Doesn't normally change. |
| **IP address** | A device's routable network address, e.g. `192.168.1.5`. CAN change unless "statically bound." |
| **MikroTik / RouterOS** | MikroTik = router hardware brand. RouterOS = the OS on it, with its own scripting/command language (`/tool fetch`, `/import`, etc.), run directly on the router, not in a browser. |
| **RADIUS** | An industry-standard protocol (not built by this company) used by ISPs/WiFi networks to authenticate users and log sessions. |
| **`radacct`** | The specific RADIUS accounting database table where session logs are stored. When an endpoint's data source is "`radacct`," it's reading directly from this log table, not computing anything fresh. |
| **CoA (Change of Authorization)** | A RADIUS extension (RFC 5176) whose job is to forcibly change/kill an active session. It does NOT speak HTTP — it speaks its own protocol over raw **UDP port 3799**. A translator/bridge would be needed to trigger it from a website, and none exists yet here. |
| **SSE (Server-Sent Events)** | A technology letting a server continuously push updates to a webpage over one open connection — like a phone call that stays open. |
| **Polling** | The alternative to SSE: the webpage just re-asks "anything new?" on a repeating timer. Looks similar to the user, technically different, never truly instant. |
| **ZTP (Zero-Touch Provisioning)** | A new device configures itself automatically from a downloaded script — no manual typing. |
| **Ticket ID (e.g. BE-AAA-042)** | An internal bug/task tracker reference. No functional meaning to your code — just a human pointer to "why this endpoint behaves this way." |

---

## Part 2 — Section 1 of the original doc, fully unpacked: Envelope & Conventions

- Every URL starts with exactly `/api/v1/`.
- Envelope fields:
  - `status` — mirrors the HTTP status, included in the JSON body itself.
  - `success` — a **boxed** `Boolean` in Java, meaning it can be `true`, `false`, **or `null`**. Your frontend code must handle the `null` case, not assume only two possible values.
  - `message` — human-readable string.
  - `data` — the actual payload; shape depends on the endpoint.
  - `timestamp` — Java `LocalDateTime` with **no timezone suffix**. It will not end in `Z` or `+03:00`. You must already know the server's timezone from elsewhere — the string itself won't tell you, so displaying it wrong (off by however many hours) is an easy mistake if this isn't handled explicitly.
- Pagination params `page`/`size`/`sort` come from Spring's `Pageable`. `page` is **zero-indexed** (page `0` = first page). Paginated response data always needs `data.content` unwrapped for the array, and `data.totalElements` for the total count.
- Public endpoints must **never** receive an `Authorization` header — this needs to be an explicit rule in your HTTP client, not a default-on-every-request behavior.
- `401` comes from `JwtAuthenticationEntryPoint` = "no valid token at all → reject before reaching endpoint logic." Should trigger a redirect to login.
- `403` comes from `JwtAccessDeniedHandler` = "valid token, wrong role." Should trigger a "not permitted" message, NOT a re-login prompt.
- Roles, exact list: `SYSADMIN`, `ADMIN` (alias `01`), `02`, `03`, `04`, `05` (alias `CUSTOMER`). Roles `02`/`03`/`04` have no human name given in this doc — check `lib/data/nav.ts` for that mapping.
- Path-level role gates:
  | Path prefix | Allowed roles |
  |---|---|
  | `/api/v1/network/**` | `SYSADMIN`, `ADMIN`/`01` |
  | `/api/v1/network-routers/**` | any authenticated user — **no role check at all** (flagged in the source doc as a known hardening gap, not an intentional design choice) |
  | `/api/v1/finance/**`, `/api/v1/expenses/**`, `/api/v1/statements/**` | `SYSADMIN`, `ADMIN`/`01`, `03` |

---

## Part 3 — Every endpoint, maximally detailed

### 3.1 Authentication

**`POST /api/v1/auth/userlogin`**
- Auth: public.
- Body: `{ "username": "...", "password": "..." }`
- Response `data`: `{ token, username, role, stationId?, companyId?, companyScope?, ... }` — fields ending in `?` are optional, present or absent depending on the user's role.
- What to do with it: store `token` as your Bearer credential for all future calls; store `role` to drive UI/menus.

**`POST /api/v1/auth/forgot-password`**
- Auth: public.
- Body: `{ "email": "..." }`
- Implied (not stated explicitly): triggers a reset email if that address exists.

**`POST /api/v1/auth/reset-password`**
- Auth: public.
- Body: `{ "token": "...", "newPassword": "..." }`
- The `token` here is a separate, one-time reset token — NOT the login JWT.

**`POST /api/v1/auth/refresh-token`**
- Auth: Bearer (must already hold a valid, not-yet-expired token).
- Body: none.
- Response `data`: `{ token }`.
- Critical logic: refresh reuses your **current access JWT itself** as proof, sent via the Bearer header — it does NOT use a separate `refreshToken` value. This differs from many systems that use a distinct long-lived refresh token.

**`POST /api/v1/auth/logout`**
- Auth: Bearer.
- Response `data`: `{ message }`.

### 3.2 Public hotspot portal

**`GET /api/v1/hotspot/packages`**
- Auth: public.
- Response `data`: `List<NetPackageResponse>`.
- Migration note: replaces the old, now-dead `/system/packages/active` route (ticket BE-AAA-042, shipped). Never call the old route.

**`POST /api/v1/hotspot/initiate`**
- Auth: public.
- Body (`HotspotPaymentRequest`): `{ packageId, phone, paymentMode, macAddress, clientMac, clientIp }`
  - Note: `macAddress` and `clientMac` are two separate fields in the same body — the doc does not clarify how they differ; don't assume they're duplicates without checking the backend DTO source.
- Success status: `201` (not generic `200`) — a session was newly created.
- Response `data`: `HotspotSessionResponse`.

**`POST /api/v1/hotspot/reconnect`**
- Auth: public.
- Body (`HotspotConnectRequest`): `{ macAddress, clientIp }`
- Response `data`: `{ hasActiveSession, message, session: HotspotSessionResponse | null }`
- `session` is `null` when there's no active session — always check `hasActiveSession` (or null-check `session`) before reading its fields.

**`POST /api/v1/hotspot/sessions/{sessionId}/disconnect`**
- Auth: Bearer (this one IS authenticated, unlike the three above).
- Path param: `{sessionId}`.
- Fully functional endpoint — but currently **orphaned**: the admin "who's online" screen is built from `ip-mappings` data (§3.4), which has no `sessionId` field, so there's no current path from "click a row" to "call this endpoint."

### 3.3 Customers

**`GET /api/v1/customers`**
- Auth: Bearer.
- Query params: `page`, `size`, `sort`, plus RLS scope `regionId`, `stationId`, `locationId` (normally auto-injected by `getRlsScopeParams()`, not manually typed per call).
- Response `data`: `Page<Customer>` — unwrap `data.content` for the array, `data.totalElements` for the count.

**`POST /api/v1/customers`**
- Auth: Bearer.
- Response: returns the **same page-envelope shape** (`CustomerApiResponse`) as the list endpoint — NOT a single bare `Customer` object. This is called out explicitly because "create one thing, expect one thing back" fails here.

**`GET /api/v1/customers/{idxno}`**
- Auth: Bearer.
- Path param: `{idxno}` — exact field name is `idxno`, not `id`.
- Response `data`: `ApiResponse<Customer>` — a single object this time, not paginated.

### 3.4 Network / NOC Monitoring

**`GET /api/v1/network/routers`**
- Auth: Bearer, roles `SYSADMIN`/`ADMIN`/`01` only.
- Query params: RLS scope params.

**`POST /api/v1/network/routers/validate-connectivity`**
- Auth: Bearer.
- Body (`RouterConnectionRequest`): connection details (host/credentials — exact fields not given in source doc).
- Purpose: actively test reachability right now, before trusting/onboarding a router. Does NOT save anything.

**`POST /api/v1/network/routers/onboard`**
- Auth: Bearer.
- Body (`RouterOnboardRequest`): router details.
- Purpose: permanently register a router as managed. Distinct from validate-connectivity, which only tests and doesn't persist.

**`GET /api/v1/network-routers/topology`**
- Auth: Bearer, generic authentication only (no specific role called out).
- **Hyphenated path** — a distinct resource from `/network/routers` (slash) above; easy to confuse, do not treat as the same endpoint.
- Purpose: network discovery/topology map data.

**`GET /api/v1/network/monitoring/router/{routerId}/history`**
- Auth: Bearer.
- Path param: `{routerId}`.
- Query params: `page` (default `0`), `size` (default `50`).
- Response `data`: `Page<RouterHealthSnapshot>` — unwrap `data.content`.

**`GET /api/v1/network/monitoring/router/{routerId}/latest`**
- Auth: Bearer.
- Path param: `{routerId}`.
- Response `data`: `RouterHealthSnapshot` — single object, not paginated.
- Usage pattern: `RouterLiveMonitor` component calls `/history` once at load ("priming the window" — filling in the initial chart), then polls `/latest` every 5 seconds afterward, with an **in-flight guard**: if a call is still pending when the next 5-second tick fires, no second overlapping call is made — it waits for the current one to finish first.

**`GET /api/v1/network-devices/{id}/status`**
- Auth: Bearer.
- Path param: `{id}` — a device ID, a different concept from a router ID (a device sits behind/connected through a router).
- Response `data`: `MikrotikDeviceStatus`.

**`GET /api/v1/network-devices/{id}/interfaces`**
- Auth: Bearer.
- Path param: `{id}`.
- Response `data`: `List<MikrotikInterface>` (physical ports / wireless radios on that device).

**`GET /api/v1/network/ip-pools`**
- Auth: Bearer, roles `SYSADMIN`/`ADMIN`/`01` only.
- Response `data`: `List<IpPoolResponse>`.
- ⚠️ **Known issue (BE-AAA-046):** returns HTTP `200` and correctly-shaped data, but the actual values are **hardcoded fixtures** on the backend, not real pool state. Safe to build UI against the shape today; do not trust the numbers for real decisions yet.

**`POST /api/v1/customer-devices`**
- Auth: Bearer, roles `SYSADMIN`/`ADMIN`/`01`/`02`/`CUSTOMER` — the widest role list in this document. Notably, plain `CUSTOMER` role IS allowed (self-service), unlike most `/network/` endpoints.
- Body: `{ customerIdxno, macAddress, ipAddress, deviceType }`
- Purpose ("static-binding creation"): after this call, that MAC address will always receive that exact IP address going forward.

**`GET /api/v1/network/ip-mappings`**
- Auth: Bearer, roles `SYSADMIN`/`ADMIN`/`01` only.
- Query params: `serviceType?` (optional filter), `searchIp?` (optional filter).
- Response `data`: `Page<IpMappingResponse>` — unwrap `data.content`.
- Row shape, exact: `{ ipAddress, macAddress, username, serviceType, stationName, status: "ONLINE" | "EXPIRED", lastSeen }`
  - `status` is restricted to exactly those two string literals — no other values are valid.
- Data source: `radacct` (RADIUS accounting log table) — **not a live query to the router**, meaning there can be a delay between something actually happening and it appearing here, depending on how often RADIUS writes to that table.

### 3.5 Confirmed-absent endpoints — do NOT call these

| Frontend expects | Backend reality | Required frontend posture |
|---|---|---|
| `POST /hotspot/activate` (voucher activation) | Does not exist in ANY controller — not partially built, genuinely absent | `activateVoucherAction` deliberately returns a clean `503` itself (rather than a confusing network error); `ActivateTab` UI stays visible but disabled. Related to ticket BE-AAA-042 ("adjacent," i.e. a related but unfinished piece of that feature area) |
| `POST /api/v1/radius/coa/disconnect` (HTTP force-disconnect) | The real mechanism (`RadiusCoaService`) exists and works, but only speaks raw CoA over **UDP port 3799** — no HTTP wrapper was ever built in front of it | `disconnectLiveSession` is gated; its UI control is disabled, labeled "pending BE adapter." Tracked as BE-AAA-043 |
| `GET /api/v1/network/monitoring/router/{routerId}/live` (SSE) | Only `/history` and `/latest` exist — no true streaming endpoint | `RouterLiveMonitor` polls `/latest` every 5s (see §3.4) instead. A separate frontend-only route, `app/api/monitoring/router/[id]/live` (an SSE proxy originally meant to sit between browser and backend), returns a graceful `501` rather than hanging or crashing. Tracked as BE-AAA-045 |

> Also worth noting: `POST /api/v1/hotspot/sessions/{sessionId}/disconnect` (§3.2) DOES exist and works, but can't currently be wired to the live-session grid because that grid is built from `ip-mappings` data, which has no `sessionId` field.

### 3.6 Provisioning (Zero-Touch Provisioning / ZTP)

**`POST /api/v1/provision/bootstrap-tokens`**
- Auth: Bearer, roles `SYSADMIN`/`ADMIN`/`01`/`02`.
- Purpose: mints one single-use secret token tied to a future router setup.

**`GET /api/v1/provision/bootstrap?token=<token>`**
- Auth: public — deliberately, since the calling device (a brand-new router) has never logged in and has no JWT.
- Query param: `token`.
- Response: **not JSON**. `Content-Type: text/plain`; `Content-Disposition: attachment; filename=ibs-init.rsc` instructs the downloader to save it as a file, not display it inline.
- Content: a RouterOS script — plain text commands the router itself will execute.

**Exact bootstrap command, broken down:**
```
/tool fetch mode=https url="{API_BASE}/provision/bootstrap?token=<token>" dst-path=ibs-init.rsc check-certificate=no;:delay 2s;/import ibs-init.rsc;
```
| Piece | Meaning |
|---|---|
| `/tool fetch` | Built-in RouterOS command, downloads a file from a URL — runs directly on the router, not a browser |
| `mode=https` | Use encrypted HTTPS to download |
| `url="..."` | The bootstrap URL with the real token substituted in |
| `dst-path=ibs-init.rsc` | Save the file locally on the router under this exact filename |
| `check-certificate=no` | Skip HTTPS certificate validation — a real security trade-off, likely necessary because a brand-new router may not yet have the correct trusted root certificates installed |
| `:delay 2s` | Pause 2 seconds — lets the file write fully complete before the next step |
| `/import ibs-init.rsc` | Built-in RouterOS command: read the file and execute every line in it, applying the configuration |

**Dead route — absolute rule:** `/api/v1/network/provisioning/{token}` no longer functions. No code anywhere in the frontend should ever generate or reference this URL again, even via old copy-pasted logic.

---

## Part 4 — Session / role data, fully detailed

- **`LoginData`:** `{ token, username, role, refreshToken? }`
  - ⚠️ Note the ambiguity: this includes an optional `refreshToken` field, even though `/auth/refresh-token` explicitly does NOT use a separate refresh token value (it reuses the access JWT itself, per §3.1). This field may be legacy or reserved for a future change — the source doc doesn't resolve this. Treat any code path that actually reads `refreshToken` with suspicion; verify against real usage before relying on it.
- **JWT claims, exact list:** `sub` (standard JWT "subject" field — who the token is about), `role`, `stationId`, `companyId`, `companyScope`, `investorScope`, `regionScope`, `userId`, `iat` (issued-at, Unix timestamp), `exp` (expiration, Unix timestamp).
- **`lib/data/nav.ts`** — frontend file that maps a role short-code (e.g. `01`, `CUSTOMER`) to which navigation items/permissions that role sees.
- **`getRlsScopeParams()`** — frontend function that reads the session token, pulls out `regionId`/`stationId`/`locationId`, and auto-attaches them to relevant API calls, so individual screens don't have to remember to do this manually.

---

## Part 5 — Cross-cutting rules, fully detailed

- **`lib/apiClient.ts`** — the ONE file responsible for unwrapping every response's envelope (checking `success`, extracting `data`, handling `message`). All other frontend code should route through this rather than writing its own parsing logic, to keep behavior consistent everywhere.
- **CORS allowlist, exact:**
  - `https://*.beesmartbedak.com` — the `*` is a wildcard matching ANY subdomain over HTTPS.
  - RFC1918 subnets — the IP ranges reserved for private/local networks (e.g. `192.168.x.x`, `10.x.x.x`) — trusted for internal/testing use.
  - `http://localhost:*` — any port on a developer's own machine, over plain HTTP — standard for local dev.
  - **Action required for new deployments:** a new production frontend domain (e.g. `https://app.beesmartbedak.com`) must be manually added to this allowlist, OR deployed so its requests appear same-origin via a proxy, to avoid needing CORS permission at all.
- **`getValidAccessToken(jwt)` in `lib/auth.ts`:**
  - The single entry point responsible for deciding "is my token still good, or do I need to refresh," and performing that refresh if needed. No other code should independently call the refresh endpoint.
  - **Single-flight lock, precisely:** if multiple parts of the page simultaneously notice the token needs refreshing, only the FIRST triggers the real request; the rest wait for and reuse that one result, instead of each firing their own redundant call.
  - `apiClient`'s behavior on `401`: it does NOT try to fix anything itself (no retry, no self-refresh). Its only job is to emit a "sign the user out" signal for some other, higher-level part of the app to act on.
- **Env vars, field by field:**
  ```env
  BASE_API_URL=https://api.ibs.example.com/api/v1/
  NEXTAUTH_URL=https://app.ibs.example.com
  ```
  - `BASE_API_URL` — backend root address, WITH `/api/v1/` already included, so the rest of the code just appends a path like `customers`.
  - `NEXTAUTH_URL` — the frontend's OWN public address, used by NextAuth (a login/session library) to correctly build callback URLs, cookies, and redirects for the right domain.
  - Both shown values are `example.com` placeholders — must be replaced with real production domains at deploy time.
- **Toolchain sync rule, precisely:** any real backend change requires ALL THREE of the following, together, not just one:
  1. Update `contracts/catalog.ts` (a registry of example/fake data — "fixtures" — used for testing without hitting the real backend).
  2. Update `BACKEND_API_REFERENCE_FOR_NEXTJS.md` (the reference doc itself).
  3. Re-run `pnpm test:pact:verify-fresh`, which regenerates the `pacts/` folder — **Pact** is a contract-testing tool whose job is to automatically verify the frontend's assumptions about the API still match backend reality, catching mismatches before they cause production bugs — and commit the regenerated `pacts/` folder into version control.

---

## Part 6 — Quick lookup table (all endpoints in one place)

| Method | Path | Auth | Role restriction |
|---|---|---|---|
| POST | `/api/v1/auth/userlogin` | public | — |
| POST | `/api/v1/auth/forgot-password` | public | — |
| POST | `/api/v1/auth/reset-password` | public | — |
| POST | `/api/v1/auth/refresh-token` | Bearer | any authenticated |
| POST | `/api/v1/auth/logout` | Bearer | any authenticated |
| GET | `/api/v1/hotspot/packages` | public | — |
| POST | `/api/v1/hotspot/initiate` | public | — |
| POST | `/api/v1/hotspot/reconnect` | public | — |
| POST | `/api/v1/hotspot/sessions/{sessionId}/disconnect` | Bearer | any authenticated |
| GET | `/api/v1/customers` | Bearer | any authenticated (RLS-scoped) |
| POST | `/api/v1/customers` | Bearer | any authenticated |
| GET | `/api/v1/customers/{idxno}` | Bearer | any authenticated |
| GET | `/api/v1/network/routers` | Bearer | SYSADMIN/ADMIN/01 |
| POST | `/api/v1/network/routers/validate-connectivity` | Bearer | SYSADMIN/ADMIN/01 |
| POST | `/api/v1/network/routers/onboard` | Bearer | SYSADMIN/ADMIN/01 |
| GET | `/api/v1/network-routers/topology` | Bearer | any authenticated |
| GET | `/api/v1/network/monitoring/router/{routerId}/history` | Bearer | SYSADMIN/ADMIN/01 |
| GET | `/api/v1/network/monitoring/router/{routerId}/latest` | Bearer | SYSADMIN/ADMIN/01 |
| GET | `/api/v1/network-devices/{id}/status` | Bearer | SYSADMIN/ADMIN/01 |
| GET | `/api/v1/network-devices/{id}/interfaces` | Bearer | SYSADMIN/ADMIN/01 |
| GET | `/api/v1/network/ip-pools` | Bearer | SYSADMIN/ADMIN/01 |
| POST | `/api/v1/customer-devices` | Bearer | SYSADMIN/ADMIN/01/02/CUSTOMER |
| GET | `/api/v1/network/ip-mappings` | Bearer | SYSADMIN/ADMIN/01 |
| POST | `/api/v1/provision/bootstrap-tokens` | Bearer | SYSADMIN/ADMIN/01/02 |
| GET | `/api/v1/provision/bootstrap?token=` | public | — |

**Endpoints that do NOT exist — never call:**
- `POST /hotspot/activate`
- `POST /api/v1/radius/coa/disconnect`
- `GET /api/v1/network/monitoring/router/{routerId}/live`
- `GET /system/packages/active` (old, replaced)
- `GET /api/v1/network/provisioning/{token}` (old, replaced)
