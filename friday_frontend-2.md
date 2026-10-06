# Friday Frontend Handoff: System Users API

## Latest update: 2026-10-04

The latest pull changes platform-admin authorization and adds investor revenue/linkage surfaces. These are backend changes; no frontend flow was changed or browser-verified.

- **Platform admin role:** `SYSADMIN` is now the sole platform-wide administrator role. Treat legacy `ADMIN` / role `01` as a company-scoped admin, not as a platform admin. Do not show platform-wide company, user, investor, or router controls based on `ADMIN` alone. Existing company roles remain `01` admin, `02` management, `03` staff/finance, `04` investor/network partner, and `05` customer.
- **System-user permissions:** `/api/system-users` create/update/delete and role assignment allow `SYSADMIN` or company admin (`ADMIN`/`01`); reads additionally allow roles `02` and `03`. Investor (`04`) and customer (`05`) do not get staff-directory access. The caller's tenant/station scope still limits rows and mutations.
- **Link an investor account:** new `PUT /api/system-users/{id}/investor`, `SYSADMIN` only, accepts `{ "investorId": "<uuid>" }` and returns the standard `ApiResponse<SystemUserResponse>` with `data.investorId`. This links a role-`04` user to an investor party. After linking, the investor needs a fresh login/token for the investor scope to be present in its claims; do not assume an already-issued token updates in place.
- **Investor revenue:** `GET /api/v1/investor/revenue` accepts optional `companyId`, `investorId`, and `period` (`YYYY-MM`). Response is a direct `InvestorRevenueSummaryResponse` (not the standard `ApiResponse` envelope): `investorId`, `companyId`, `periodYearMonth`, `totalGrossRevenue`, `hotspotGrossRevenue`, `hotspotMaintenanceFee`, `activePppoeSubscribers`, `pppoeMaintenanceFee`, `totalMaintenanceDue`, `netInvestorPayout`, and `routerBreakdown`.
  - `SYSADMIN` may request platform-wide data or narrow by company/investor; the dashboard-selected company is used when no company is supplied.
  - Roles `01`–`03` are limited to their own company. A request for another company returns `403`.
  - Role `04` is pinned to its linked investor scope; supplied company/investor IDs do not widen access. An unlinked investor receives `404`.
- **Investor read surfaces:** `GET /api/v1/investor/routers` allows `SYSADMIN` and linked role `04`; `GET /agreements` and `GET /billing-snapshots` are now `SYSADMIN`-only. These return direct JSON lists rather than `ApiResponse` wrappers. Missing effective investor scope returns `404`.
- **Company identity/data migration:** the active BeeSmart company is now `CMP-BST-001`; the retired `CMP-BSM-001` company is merged into it by migration. Use the active company code returned by backend data for tenant selection and avoid treating the retired code as an independently selectable tenant.
- **Database migrations in this pull:** `V2026100401__tenancy_investor_exemption_and_binding_rule.sql` adds the investor tenancy exemption/binding rule; `V2026100402__merge_old_beesmart_into_cmp_bst_001.sql` retires/merges the old BeeSmart company. Deployments need migrations applied before relying on the new investor/company behavior.
- **Verification:** backend scope/controller tests were added in this pull, but no frontend integration or browser flow was changed or verified here.

## Latest update: 2026-10-03

- `/api/system-users/**` is the canonical frontend API for staff user administration. Yesterday's follow-up work tightened the final RBAC and contract edges around this API rather than adding a separate frontend surface.
- API routes worked on yesterday: `POST /api/system-users`, `GET /api/system-users`, `GET /api/system-users/{id}`, `PUT /api/system-users/{id}`, `PUT /api/system-users/{id}/role`, and `DELETE /api/system-users/{id}`.
- URL-level Spring Security guards and controller `@PreAuthorize` guards now align for system-user endpoints. Reads allow `SYSADMIN`, `ADMIN`/`01`, `MANAGEMENT`/`02`, and `FINANCE_MANAGER`/`03`; writes and role changes allow `SYSADMIN` and `ADMIN`/`01`.
- Role input normalization now accepts canonical codes and supported display names before repository lookups. `CUSTOMER_SERVICE` resolves to `02`, `FINANCE_MANAGER` resolves to `03`, `FINANCE_OFFICER`, `NETWORK_PARTNER`, and `INVESTOR` resolve to `04`, and `CUSTOMER` resolves to `05`.
- Staff creation and role assignment reject customer role `05`; customer accounts must continue through the customer flows. This is the fix frontend needs so the Create System User modal can submit display-name roles without role-validation errors.
- Stable system-user error codes are now centralized for authorization, scope, entity-not-found, and duplicate-field cases: `ROLE_ELEVATION_FORBIDDEN`, `CROSS_COMPANY_FORBIDDEN`, `STATION_BOUNDARY`, `ACCESS_DENIED`, `ENTITY_NOT_FOUND`, `USERNAME_ALREADY_EXISTS`, `EMAIL_ALREADY_EXISTS`, and `PHONE_ALREADY_EXISTS`.
- Soft-deleted users are filtered out of staff, customer, subscriber, search, and dashboard metric reads touched by the follow-up. Frontend list totals should treat server totals as authoritative after tenant and deleted-row filtering.
- `RegisterRequest` and `CreateSystemUserRequest` field contracts remain unchanged. The frontend should keep sending the same JSON fields and may send either role codes or the supported display-name strings.
- Full backend verification is not claimed here. Earlier focused RBAC/service checks were green, while the full Maven run was still red from unrelated NAS/device-health tests already noted below.

### SQL migrations found for 2026-10-03

- `src/main/resources/db/migration/V2026100301__canonical_system_user_role_codes.sql` — normalizes existing `users.role` values to the canonical RB-0 role vocabulary, collapses legacy role catalog entries, adds canonical role check constraints, and creates `system_user_role_assignable` for audited staff role-assignment policy.

## Previous update: 2026-10-02

- RBAC now has both URL matchers and controller `@PreAuthorize` guards for `/api/system-users/**`; reads require `SYSADMIN`, `ADMIN`/`01`, `MANAGEMENT`/`02`, or `FINANCE_MANAGER`/`03`. Create, update, and delete require `SYSADMIN` or `ADMIN`.
- Service-level row scope applies consistently to list, get, and mutations. A dashboard-selected company constrains platform-admin access. Investor `04` and customer `05` cannot enumerate the staff directory.
- Role inputs accept canonical codes and display aliases. For example, `FINANCE_OFFICER` and `FINANCE_MANAGER` resolve to stored code `03`; `CUSTOMER_SERVICE` also resolves to `03`. System-user creation rejects `CUSTOMER`/`05`.
- `RegisterRequest` and `CreateSystemUserRequest` JSON field contracts were checked and preserved. The registration endpoint accepts `role: "CUSTOMER_SERVICE"` and returns `201`.
- Authorization and scope errors expose stable `data.code` and `data.requestId`; duplicate username, email, and phone have separate codes. Frontend fetch handlers should read a response body once (for example, `const body = await response.json()`), then reuse `body` rather than consuming the stream again.
- Focused RBAC tests pass: 29 tests; final `SystemUserServiceTest` passes: 10 tests. Full H2 Maven run is not green: 4 existing failures/errors in `DeviceHealthServiceTests` and `NasRouterServiceTests` (2 assertions, 2 unnecessary-stubbing errors).
- No frontend code or live browser flow was changed or verified in this update.

### SQL migrations found for 2026-10-02

- `src/main/resources/db/migration/V2026100201__add_system_user_soft_delete.sql` — adds `deleted_at` support for system-user soft deletion.
- No SQL migration was added for the RBAC changes on this date.

## What shipped in today's workspace

- Added staff system-user CRUD routes at `/api/system-users`, alongside the existing `/api/v1/system/users` routes.
- Added server-side pagination and optional text, role, and active-state filters.
- Added validation, role/tenant checks, password hashing on create, duplicate detection, and soft deletion.
- Added a `deleted_at` database migration and hid soft-deleted rows from normal JPA entity queries.
- Added controller and service tests plus this API handoff. The latest focused RBAC run passed 29 tests; the final service-only rerun passed 10 tests.
- The full Maven suite was run. Four unrelated tests failed in NAS/device-health suites: two assertion failures and two Mockito unnecessary-stubbing errors. No system-user tests failed in that run.

Changes are present in the working tree and have not been committed. The staging attempt required filesystem approval because `.git` is read-only in the current sandbox; that approval request was interrupted.

## Base URL and authentication

Base path: `/api/system-users`.

Send the current access token on every request:

```http
Authorization: Bearer <access-token>
Content-Type: application/json
```

The URL and method guards allow directory reads for `SYSADMIN`, `ADMIN`/`01`, `MANAGEMENT`/`02`, and `FINANCE_MANAGER`/`03`. Writes require `SYSADMIN` or `ADMIN`. Reads and writes are scoped by tenant: platform admins can see all companies or the dashboard-selected company; company users see only their company; station-scoped staff see only their station. Investor `04` and customer `05` are denied directory access. A caller without a company scope sees no list entries and cannot read users outside their scope.

Create, update, and delete require `SYSADMIN` or `ADMIN`. Service checks further restrict which roles an admin can assign and which tenant/station they can manage. Customer role `05` must continue to use customer-management flows and is rejected by this API.

## Endpoints

| Method | Path | Purpose | Success |
| --- | --- | --- | --- |
| `POST` | `/api/system-users` | Create staff system user | `201 Created` |
| `GET` | `/api/system-users` | Search and page through visible users | `200 OK` |
| `GET` | `/api/system-users/{id}` | Fetch one visible user by `idxno` | `200 OK` |
| `PUT` | `/api/system-users/{id}` | Partial update; omitted or null fields stay unchanged | `200 OK` |
| `PUT` | `/api/system-users/{id}/role` | Change only the staff user's role after hierarchy checks | `200 OK` |
| `DELETE` | `/api/system-users/{id}` | Soft delete | `204 No Content` |

### List filters and paging

`GET /api/system-users?q=jane&role=02&active=true&page=0&size=20`

- `q`: optional case-insensitive match on username, first name, email, or phone number.
- `role`: optional role code filter.
- `active`: optional boolean filter on `isactive`.
- `page`: zero-based page number, default `0`.
- `size`: page size, default `20`; accepted range is `1` to `100`.

The `data` object is stable and has this shape:

```json
{
  "content": [],
  "totalElements": 0,
  "totalPages": 0,
  "number": 0,
  "size": 20
}
```

### Create request

Required: `username`, `password`, `fname`, `role`, and `companyId`.

Optional: `middleName`, `otherName`, `email`, `phoneNumber`, `stationId`, `isactive`, and `canLogin`.

```json
{
  "username": "jane.doe",
  "password": "ChangeMe123!secure",
  "fname": "Jane",
  "middleName": "A",
  "otherName": "Doe",
  "email": "jane@example.com",
  "phoneNumber": "+254712345678",
  "role": "02",
  "companyId": "company-01",
  "stationId": "station-01",
  "isactive": true,
  "canLogin": true
}
```

Validation rules: username is 3–50 characters and may contain only letters, digits, `.`, `_`, `@`, and `-`; password is 12–128 characters; names are at most 50 characters; email is at most 100 characters and must be valid; phone is optional `+` followed by 7–15 digits. Role accepts canonical codes or supported display aliases and is stored canonically; `CUSTOMER`/`05` is rejected on this staff path. Username, email, and phone must be unique when supplied. Password is write-only and is never included in responses.

### Partial update request

Send only fields to change. Supported fields are `username`, `fname`, `middleName`, `otherName`, `email`, `phoneNumber`, `role`, `stationId`, `companyId`, `isactive`, and `canLogin`. Null or omitted values are ignored. Use the password-management API for password changes.

```json
{
  "fname": "Janet",
  "phoneNumber": "+254712345679",
  "canLogin": false
}
```

The API returns `409 Conflict` for duplicate username/email/phone. Unknown role codes return `400 Bad Request`. Tenant, role-hierarchy, or station violations return `403 Forbidden`.

### User response fields

Successful create, get, and update return the project response envelope:

```json
{
  "status": 200,
  "success": true,
  "message": "System user loaded",
  "data": {
    "idxno": 123,
    "username": "jane.doe",
    "userId": "generated-id",
    "role": "02",
    "roleName": "...",
    "roleDescription": "...",
    "fname": "Jane",
    "middleName": null,
    "otherName": "Doe",
    "fullName": "Jane Doe",
    "email": "jane@example.com",
    "phoneNumber": "+254712345678",
    "isactive": true,
    "canLogin": true,
    "createdAt": "2026-10-02T12:00:00",
    "stationId": "station-01",
    "companyId": "company-01"
  },
  "timestamp": "2026-10-02T09:00:00Z"
}
```

`data` has the same user shape for create/get/update. The password and internal authentication state are not returned. `DELETE` has an empty body.

## Delete behavior

Delete sets `deleted_at`, `isactive=false`, and `can_login=false`. Rows remain in the database so existing foreign-key references continue to work. Deleted users disappear from normal ORM reads and list results; deleting a user does not cascade-delete related business records. Their unique username/email/phone remain reserved.

## Error handling for the UI

Errors use the project's `ApiResponse` shape with `success=false` and a descriptive `message`. Authorization and scope errors include stable `data.code` and `data.requestId`; validation errors return field messages in `data`.

Stable codes: `ROLE_ELEVATION_FORBIDDEN`, `CROSS_COMPANY_FORBIDDEN`, `STATION_BOUNDARY`, `ACCESS_DENIED`, `ENTITY_NOT_FOUND`, `USERNAME_ALREADY_EXISTS`, `EMAIL_ALREADY_EXISTS`, and `PHONE_ALREADY_EXISTS`.

| HTTP | UI handling |
| --- | --- |
| `400` | Show validation/filter message; keep submitted form values. |
| `401` | Use the existing session-expired flow and request sign-in. |
| `403` | Show an access-denied message; do not retry. |
| `404` | Tell the operator the user is missing or already deleted; refresh the list. |
| `409` | Show duplicate username/email/phone conflict beside the relevant field when possible. |
| `503` | Show a temporary service error and allow retry. |

## Integration notes

- Use `idxno` as the route ID; `userId` is a separate business identifier.
- Use `isactive` and `canLogin` as distinct switches. A user may be active while login is disabled.
- Treat list totals as authoritative; the server applies tenant scope before pagination.
- The legacy endpoints under `/api/v1/system/users` remain available. New frontend work should use `/api/system-users` for CRUD.

## Verification log

1. Cross-checked every route, role gate, query parameter, response field, and delete side effect against the controller, DTOs, service, and entity.
2. Ran the focused RBAC set: 29 passed, 0 failed; reran final system-user service tests: 10 passed, 0 failed.
3. The create/update payload examples were exercised by the MVC validation/request tests; paging response fields were checked against the explicit page response DTO.

The remaining verification gaps are a live PostgreSQL migration and CRUD smoke test and a browser run of the React modal. The full Maven suite remains red because of the four unrelated NAS/device-health test failures listed above.
