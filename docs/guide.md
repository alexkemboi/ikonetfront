# Guide — Contract-Driven Frontend Tooling (Ikonex Systems)

This guide explains **what** the contract-driven tooling in this repository is, **how it is meant to be used**, and **how different people** (frontend developers, backend developers, testers/QAs, and code reviewers) make sense of the setup.

It complements:
- [LOCAL_SETUP.md](./LOCAL_SETUP.md) — how to run the app (pnpm, Docker Compose, backend on :8381).
- [BACKEND_CONTRACT.md](./BACKEND_CONTRACT.md) — the verified backend DTO/route inventory the contracts are built from.
- [plan.md](./plan.md) — the original migration plan + ticket references.

---

## 1. What this architecture is

The frontend talks to a Spring Boot billing backend over a single REST surface (`http://localhost:8381/api/v1/` in dev). Historically every server action copied its own fetch code, invented its own type shapes, and carried mock data into real data paths — which is how a dozen 404/415/400 mismatches shipped.

The new architecture makes the **backend contract the single source of truth** and keeps three layers in lock-step:

```
  Type layer            Fixture layer             Execution layer
  ─────────────────┐   ──────────────────┐        ─────────────────────┐
  lib/types/api.ts     │   contracts/        │        lib/apiClient.ts     │
  (canonical        │   catalog.ts        │        (the ONLY fetch      │
  envelope + Page + │   (one fixture per  │        wrapper: auth        │
  DTO shapes)       │   endpoint, shared  │        policy, envelope,    │
                    │   by EVERYTHING)    │        timeout, retry)      │
  ├────┐  ┌─────────┴───┐  ┌─────────────┴──┐  ┌───────────────────────┤
  │    │  │ MSW handlers │  │ Pact consumer  │  │ server actions        │
  │    │  │ (dev tests)  │  │ specs          │  │ (the real callers)    │
  │    │  └──────────────┘  └───────────────┘  └───────────────────────┘
```

The core rule is: **you declare a fixture once in `contracts/catalog.ts`, and MSW (behavioral tests), Pact (contract file), and the action code all stay in sync with it.** If the backend changes a field, you change it in one place (plus the type) and the whole surface re-aligns.

Everything is verified against the real backend source — see `BACKEND_CONTRACT.md` for the inspected controller/DTO evidence behind each endpoint.

---

## 2. File layout that matters

| Path | Purpose |
|---|---|
| `lib/types/api.ts` | Canonical `ApiResponse<T>` (`status/success/message/data/timestamp`), `PageResponse<T>` (Spring `Page`), `NetPackage`, `IpPool`, `IpMappingResponse`. **Every module's types alias this file instead of redeclaring envelopes.** |
| `lib/apiClient.ts` | `apiFetch(path, options)` — the single choke point for backend calls. Handles URL base, auth policy, envelope parsing, 30s timeout, idempotent-GET retry, Next.js cache (`tags`/`revalidate`), typed error envelopes. |
| `lib/constants.ts` | `BASE_URL` / `API_BASE` — the one URL authority (from `BASE_API_URL`, default `http://localhost:8381/api/v1/`). |
| `lib/auth.ts` | NextAuth options + `getValidAccessToken(jwt)` — the **only** JWT refresh entry point, with a per-token single-flight lock (Guardrail 1). |
| `contracts/catalog.ts` | The **fixture registry**. `fixture()` functions (exact DTO shapes) + a Wave-1 matrix of `Interaction[]` (`method`, `path`, `query`, `auth`, `status`, `requestBody`, `responseBody`) exported as `allInteractions`. |
| `mocks/handlers/*.handlers.ts` | MSW request handlers; every body comes from `contracts/catalog.ts`. `auth-guard.ts` enforces the bearer/public posture (401 without `Authorization`). |
| `mocks/server.ts` | MSW Node server (`setupServer(...handlers)`) for Vitest. |
| `vitest.setup.ts` | Global MSW lifecycle (`listen onUnhandledRequest:"error"` → reset → close), plus env stubs for `lib/auth`, `next/navigation`, `next/cache`, `next-auth/react`. |
| `vitest.config.ts` | jsdom env for unit/behavioral tests; **excludes** `__tests__/pact/**`. |
| `vitest.pact.config.ts` | Pure `node` env for Pact specs (no MSW, no jsdom). |
| `__tests__/actions/*.test.ts` | Behavioral tests against MSW: envelope parsing, auth headers, query params, Page unwrapping, revalidation, error envelopes. |
| `__tests__/pact/wave1.spec.ts` | Pact consumer spec — generates the committed contract from `allInteractions` via `__tests__/pact/matchers.ts`. |
| `pacts/IBS_Frontend_NextJS-IBS_Backend_SpringBoot.json` | The **committed** contract file (19 interactions) the backend provider verifies with `@PactFolder`. |
| `.github/workflows/frontend-ci.yml` | CI quality gate: lint → typecheck → tests → Pact freshness. |
| `actions/` | Server actions. All Wave-1 ones go through `apiFetch`. |

---

## 3. The intended way to use it (workflow)

### 3.1 The rule of thumb

> **Never hand-write a fetch against the backend.** Go through `lib/apiClient.ts`. **Never hand-write a response shape.** Take it from `contracts/catalog.ts` and `lib/types/api.ts`. **Never create a polling client thread that calls two actions every 5s** — use the in-flight-guard pattern in `RouterLiveMonitor.tsx`.

### 3.2 Adding / changing an endpoint (the happy path)

1. **Verify the backend DTO + route** (read the Spring controller or check/append to `BACKEND_CONTRACT.md`). Note the exact path, HTTP method, status code, auth posture, and field names.
2. **Add the canonical type** in `lib/types/api.ts` (or the module's `lib/types/*.ts` aliasing it). Use `PageResponse<T>` when the backend paginates; wrap DTOs in `ApiResponse<T>`.
3. **Add a fixture** in `contracts/catalog.ts` (`export function xxxFixture(): ApiResponse<...>`) and register it in the appropriate `*Interactions[]` matrix (auth/hotspot/customer/network/session). This single registration drives both MSW and Pact.
4. **Add / update the MSW handler** in `mocks/handlers/<domain>.handlers.ts` — return the catalog fixture, and add `requireAuth(request)` for anything `auth: "bearer"`.
5. **Write the server action** in `actions/<domain>.ts` using `apiFetch`:
   ```ts
   const res = await apiFetch<MyDto[]>("/network/my-endpoint", {
     auth: "required",          // "required" | "public" | "optional"
     tags: ["my-domain"],       // Next.js cache revalidation tag
     revalidate: 60,            // optional, seconds
   });
   if (!res.success) { /* envelope error, return readable state */ }
   ```
6. **Write/update a behavioral test** in `__tests__/actions/<domain>.test.ts` asserting: auth header presence/absence, query params, status code, Page unwrap vs array unwrap, revalidation calls, and error envelopes.
7. **Run everything**, then commit the **generated** `pacts/*.json` alongside your change (the CI freshness gate enforces this).

### 3.3 Auth posture — the three choices in `apiFetch`

| Policy | When | Behavior |
|---|---|---|
| `auth: "public"` | Captive-portal / login routes (`/hotspot/**`, `/auth/userlogin`) marked `permitAll` in Spring | **Never** attaches `Authorization` — attaching an admin JWT on a public portal would leak it to unauthenticated users and is wrong scoped. |
| `auth: "required"` | Everything authenticated | Attaches `Bearer <session.apiToken>`; returns a 401 envelope without hitting the network if the session token is missing. |
| `auth: "optional"` | Rare dual-mode endpoints | Attaches the token only when present. |

For the refresh call specifically, pass an explicit `authorization: "Bearer <oldJwt>"` — the backend keys refresh off the access JWT, not the login-time `refreshToken`.

### 3.4 Refresh semantics (don't reinvent this)

- The only refresh entry point is `getValidAccessToken(jwt)` in `lib/auth.ts`. It is called from the NextAuth `jwt()` callback when the token is within 60s of expiry.
- It is a **per-token single-flight mutex** (`Map<string, Promise>`): parallel Server Components in one render share one refresh, but two different users' refreshes can never be conflated.
- Never call refresh from `apiClient`'s 401 branch — a 401 envelope is returned and the session layer (signout flow / `SessionGuard`) drives the UI reaction.

### 3.5 Gated features (the "BE ticket" pattern)

If the backend route does not exist yet (ticket tracked, e.g. `BE-AAA-043` CoA disconnect, `BE-AAA-042` voucher activation), the frontend **does not ship a 404 or a fake success**. It:
- returns a readable error envelope (e.g. 503/`"pending backend route"`),
- and/or disables the UI control (see `LiveSessionDataTable.tsx` "Disconnect (pending)", `ActivateTab.tsx`).

When the backend lands the route, remove the gate and let that flow start exercising the contract — the MSW handler, Pact interaction and test can be added at the same time.

---

## 4. For frontend developers

**Day-to-day commands**

```bash
pnpm install                      # first time (pnpm is the only lockfile: pnpm-lock.yaml)
pnpm dev                          # http://localhost:3456 (needs backend on :8381)
pnpm lint                         # eslint — must be 0 errors before push
pnpm typecheck                    # tsc --noEmit
pnpm test                         # Vitest + MSW behavioral tests (jsdom)
pnpm test:watch                   # watch mode while iterating
pnpm test -- <file>               # run one test file
pnpm test:pact                    # Pact consumer spec (node env) → regenerates pacts/
pnpm test:pact:verify-fresh       # spec + guard: contract exists AND is byte-identical to committed
```

**The debugging loop**

1. Write/fix an action → run `pnpm typecheck` → run the targeted `pnpm test -- __tests__/actions/<x>.test.ts`.
2. MSW returns `onUnhandledRequest: "error"`, so an action that fetches an endpoint not registered in `mocks/handlers/` **fails loudly** instead of passing silently against the network. That is by design — it means "you forgot to register the contract".
3. To shape a new fixture quickly, `console.log` the real backend response while running `pnpm dev`, then codify it as a `fixture()` in `contracts/catalog.ts`.

**Where to put things**

- New action file → `actions/`. Keep the `apiFetch` options (auth/tags/revalidate) explicit per call.
- New MSW handler → `mocks/handlers/<domain>.handlers.ts`, then export from `mocks/handlers/index.ts`.
- New behavioral test → `__tests__/actions/`. Component tests go in `__tests__/components/`.
- New canonical type → `lib/types/api.ts`; module-scoped types live in `lib/types/<domain>.ts` and import the base.

---

## 5. For testers / QA

**What the test setup guarantees**

- **Behavioral fidelity, not just unit mocks.** Tests hit real `fetch` through `apiFetch`, MSW answers the wire exactly as the backend would (status codes like `201` for `/hotspot/initiate`, Page envelopes for `/customers` and `/network/ip-mappings`, `401` when the bearer header is missing). If the frontend reads `data.content` where the backend sends `data` (or vice versa), the test catches it.
- **Auth posture is asserted.** Tests verify that public routes receive *no* `Authorization` header and protected routes receive `Bearer ...`.
- **Network-level failure paths are covered.** Error envelopes, 401s, empty pages falling back to demo data, and timeout/network retries are all exercised in `__tests__/actions/*`.
- **The pact contract is deterministic.** `pnpm test:pact:verify-fresh` fails CI if the generated `pacts/` differs from what is committed or if the contract file is missing.

**Roles in the flow**

- *GUI/exploratory tester:* follow `PAGES_GUIDE.md` for the visual flows; use `pnpm dev` with the real backend. The feature gates (disconnect, voucher activation) show explicit "pending backend route" states, not 404s.
- *Automated test author:* add cases to `__tests__/actions/<domain>.test.ts`; never mock `fetch` yourself — extend `mocks/handlers/` (fixtures come from `contracts/catalog.ts`).
- *Pact/contract checker:* run `pnpm test:pact:verify-fresh`, inspect `pacts/IBS_Frontend_NextJS-IBS_Backend_SpringBoot.json` (the machine-readable promise the backend verifies), and cross-check field names against `BACKEND_CONTRACT.md`.

---

## 6. For the backend team (provider side)

The committed `pacts/` folder is the backend's consumer contract:

1. Point your Spring Boot provider verification at the folder: `@PactFolder("pacts")` consuming `IBS_Frontend_NextJS` provider `IBS_Bckend_SpringBoot`.
2. Run it in your CI (e.g. a pact Maven/Gradle profile). It verifies every interaction in `allInteractions` — method, path, query, headers, status, and response shape via matchers (`MatchersV3.like`/`eachLike`).

What backend changes break the frontend contract (and should republish a new `pacts/`):
- Reusing/renaming routes, changing status codes (e.g. `200` → `201`), or changing envelope keys (`data` vs `data.content`).
- Adding a required field to a DTO or changing types.
- Changing security posture of a route (public ↔ bearer).

If you change the backend:
1. Update `BACKEND_CONTRACT.md`.
2. Update the corresponding `fixture()` + `Interaction[]` in `contracts/catalog.ts`.
3. Run `pnpm test` + `pnpm test:pact:verify-fresh` and commit the regenerated `pacts/*.json`.

---

## 7. For code reviewers

A review of this codebase's changes should verify the **contract discipline**, not just the diff:

1. **Every new `fetch(`** — is it going through `lib/apiClient.ts`? (grep `fetch(` in `actions/`; whitelisted exceptions only, e.g. `proxy.ts`, `middleware`, auth flows.)
2. **Every fixture change in `contracts/catalog.ts`** — did the author also update the matching MSW handler and Pact registration? (The `*Interactions[]` matrices are the checklist.)
3. **Auth posture** — public endpoints never attach an `Authorization` header; protected endpoints always get `auth: "required"`; the refresh flow is only touched through `lib/auth.ts`.
4. **Page envelopes** — `GET /network/ip-mappings` and `GET /customers` return a `Page<T>`; the action unwraps `data.content`. If it reads `response.data` directly, it's the old bug.
5. **Behavioral coverage** — did the change add/adjust a `__tests__/actions/*` case mapping to the modified endpoint, including the error path?
6. **Generated artifacts** — are the regenerated `pacts/*.json` committed? CI enforces it, but reviewers should check the diff size of the JSON (a healthy contract change shows only the touched interaction).
7. **Gated/disabled features** — if a control is disabled ("pending"), verify there is a matching BE ticket reference and a readable envelope, not a silent no-op.
8. Run the four gates locally: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:pact:verify-fresh`.

---

## 8. Troubleshooting / FAQ

| Symptom | Cause / fix |
|---|---|
| `[MSW] ... unhandled request ... http://localhost:8381/api/v1/...` | The endpoint isn't registered in `mocks/handlers/`. Add a handler (body from `contracts/catalog.ts`) or the action is calling the wrong path. |
| Pact test says `Request did not match` / status mismatch | The `Interaction[]` in the catalog doesn't match what the HTTP client sends (path, query, header, or request body). Align the action + interaction. |
| `eachLike` `RangeError: n must be a non-negative number` | Calling `eachLike(template, minOptionsObject)` with an object — must pass the count directly (`value.length`). |
| 401 envelope returned for a `required` route | No session token in the test/stub (`vitest.setup.ts` stubs `lib/auth` with `mock-valid-bearer-token`). In real runtime it means the NextAuth session has no `apiToken`. |
| `pnpm test:pact:verify-fresh` fails in CI | Either the contract file is missing (add `pacts/*.json`) or the committed pact is stale (run `pnpm test:pact` and commit the diff). |
| `BASE_URL` wrong in a component | Never use `process.env.BASE_API_URL` directly; import `BASE_URL`/`buildApiUrl` from `lib/constants.ts`. |
| A poller keeps stacking requests on slow links | Use the in-flight-guard pattern from `RouterLiveMonitor.tsx` (skip tick while one is running) and pass a short `timeoutMs` to `apiFetch`. |
| Refresh returns `RefreshAccessTokenError` | Backend rejected the access JWT (`POST /api/v1/auth/refresh-token` with `Bearer <oldJwt>`). Session signout flow in `Middleware`/`SessionGuard` handles it. |

---

## 9. Quick reference — the Wave-1 contract surface

The committed pact covers 19 interactions grouped as:

- **Auth** — `POST /api/v1/auth/userlogin` (public), `POST /api/v1/auth/refresh-token` (bearer, body `{}`), `POST /api/v1/auth/logout` (bearer).
- **Hotspot (public portal)** — `GET /api/v1/hotspot/packages` (public; `HotspotPublicController`), `POST /api/v1/hotspot/initiate` (**201**), `POST /api/v1/hotspot/reconnect`.
- **Customers** — `GET /api/v1/customers` (Page, pagination + RLS query params), `POST /api/v1/customers`, `GET /api/v1/customers/{idxno}`.
- **Network** — routers list, validate-connectivity, onboard (**201**), topology, monitoring `history`/`latest`, device status, ip-pools.
- **Sessions** — `POST /api/v1/customer-devices` (**201**), `GET /api/v1/network/ip-mappings` (**Page envelope**).

The full matrix lives in `contracts/catalog.ts` (`allInteractions`) and is the canonical checklist for any change.