# Finance Subsystem Guide

Canonical reference for the finance views in this frontend and the
`internet-billing-systemb` Spring Boot backend. One vocabulary, one set of
account codes, one GL reality.

## 1. Canonical Account Code Table

Every GL posting is written with these GAAP numeric codes. The legacy string
aliases on the left are accepted **at write time** only — `AccountingService`
resolves them to the numeric code before the idempotency guard and before
saving, and the `V2026091301__canonicalize_account_postings_codes.sql`
migration rewrites any pre-existing alias rows. Do not introduce new aliases;
a code not in this table is a bug.

| Code | Alias | Type |
| --- | --- | --- |
| `1110` | `M_PESA_RECEIVABLE` | Asset / M-Pesa Clearing |
| `2100` | `M_PESA_SETTLEMENT` | Liability / Accounts Payable |
| `1130` | `PETTY_CASH` | Asset / Petty Cash & Till |
| `4100` | `HOTSPOT_REVENUE` | Income / Hotspot Revenue |
| `4130` | — (no alias) | Income / Hotspot TV & Streaming |
| `4200` | `PPPOE_REVENUE` | Income / PPPoE Revenue |
| `4400` | `REFUND_REVENUE` | Income / Refund Revenue (contra) |
| `5100` | `BANDWIDTH_COST` | Expense / Upstream Bandwidth |
| `6100` | `OPERATING_EXPENSE` | Expense / Office Rent & Utilities |
| `6500` | `WRITE_OFF_EXPENSE` | Expense / Write-Off |

Notes:

- There is **no** `TV_SERVICE_REVENUE` alias. TV revenue is `4130` only.
- Aliases may not be used as read keys. The P&L, funds-flow summary, trial
  balance, and Payments Ledger all read numeric codes.
- `v_account_balance` is a live SQL view over `account_postings` — no view
  recreation is needed when alias rows are renamed in place.

## 2. Page-by-Page Data Sources

| Route | Page | Purpose | Primary data source |
| --- | --- | --- | --- |
| `/finance` | Executive Dashboard | P&L, M-Pesa clearing, trial balance, recent ledger | `GET /finance/reports/profit-loss` + `GET /finance/transactions?page=0&size=10&sort=occurredAt,desc` + `GET /finance/coa/balance` (reads `1110` and legacy `M_PESA_RECEIVABLE` until canonicalization lands) + `GET /finance/coa/trial-balance`. The dashboard does **not** call `/api/v1/finance/revenue` — that endpoint exists on the backend but is unconsumed by the UI. |
| `/finance/ledger` | Chart of Accounts / Ledger Explorer | CoA tree, account balances, postings, trial-balance invariant | `GET /finance/coa`, `GET /finance/coa/balance`, `GET /finance/coa/postings`, `GET /finance/coa/trial-balance` |
| `/finance/billing/payments` (alias `/finance/payments`) | Payments Ledger | Postings against Account 1110 | `GET /finance/transactions?accountCode=1110&page=0&size=50`; gateway fallback `GET /payments?issuccessfull=true` **only** when 1110 has zero postings |
| `/finance/billing/invoices` | Invoices | Invoice register & KPIs | Frontend replicas (`getInvoicesLedgerData`); backend statements module is the wiring point for uploads |
| `/finance/expenses` | Expenses | Expense register & category summary | `GET /expenses?page=&size=&startDate=&endDate=` + `GET /expenses/summary` |
| `/finance/statements` | Statements | Statement explorer & detail | `GET /statements/...` (+ `GET /statements/{id}/download`, `POST /statements/{id}/email`) |
| `/finance/vouchers` | Vouchers | Hotspot voucher inventory & creation | `GET /hotspot/vouchers`, `POST /hotspot/vouchers/create` |
| `/finance/reconciliation` | M-Pesa Reconciliation | Daraja Pull sweep + daily outcome audit | `POST /payments/mpesa/reconciliation/trigger?date=` · `GET /payments/mpesa/reconciliation?date=` · `POST /payments/mpesa/reconciliation/force-post?receiptNo=&date=` |

## 3. Outcome Legend (Audit & Action Guide)

The outcome legend lives in `components/finance/ReconciliationView.tsx`
(collapsed by default under the Day entries table). It is the single shared
vocabulary for engineers and finance managers.

| Outcome | Meaning | Action |
| --- | --- | --- |
| **Matched** | M-Pesa webhook callback received and confirmed against Daraja Pull records. | None required. GL and Account 1110 are balanced. |
| **Auto healed** | Initial Safaricom webhook dropped (network glitch), scheduled Daraja pull sweep recovered it. | Account provisioned retroactively. |
| **Unmatched in Daraja** | IBS received a valid M-Pesa callback, but Daraja Pull API hasn't indexed it yet (settlement lag). | If the customer has a confirmed M-Pesa SMS, click **Force Post to GL**. |
| **Unmatched in IBS** | Money hit the Paybill/Till but no matching checkout order exists in IBS. | Verify the payer's phone number and manually assign an active package/customer account. |

`AMBIGUOUS` (receipt present in both hotspot and PPPoE tables) must be
resolved by data cleanup — the force-post endpoint rejects it rather than
guessing.

## 4. Behavioral Contracts

1. **Writes are canonicalized at posting time.** `AccountingService` resolves
   both legs (receivable + revenue / expense + liability) through
   `CANONICAL_ACCOUNT_CODES` **before** the
   `existsBySourceTypeAndSourceIdAndAccountCode` unique-idempotency guard and
   before save. Post-migration the guard keys are canonical, so duplicate
   callbacks and repeated force-posts are no-ops.
2. **The Payments Ledger is GL-first.** Confirmed gateway payments appear in
   the ledger by virtue of their Account 1110 postings. The
   `/payments?issuccessfull=true` fallback engages only when 1110 has zero
   postings or the GL read itself fails (e.g. migration still in progress),
   and it never fabricates numbers — an empty or failing gateway read yields
   zero KPIs and an empty table.
3. **Force-post is idempotent and safe.** `POST
   /payments/mpesa/reconciliation/force-post` checks `MPESA_HOTSPOT`,
   `MPESA_RECEIPT`, and `MPESA_PPPOE` source types before posting, so a
   receipt already in the ledger returns a no-op. Receipts present in **both**
   hotspot and PPPoE tables are rejected with 422. Missing payments return
   404.
4. **Roles.** `GET/POST /payments/mpesa/reconciliation/**` is gated to
   `SYSADMIN / ADMIN / 01 / 02` in `SecurityConfig` (the POST force-post does
   not include `03`); the sweep trigger retains the historical `03` view
   signature. The frontend self-gates every reconciliation action on
   `/finance/reconciliation` permissions.
5. **Metadata-less callbacks keep real amounts.** When an STK-Query callback
   carries no `CallbackMetadata`, the amount falls back to the package price
   (`price.toBigInteger()`) — same normalization as
   `TriggerPaymentService.triggerPayment` — so the GL post is never silently
   skipped and receipts stay force-postable (`status = PAID_GL_PENDING`).

## 5. Data-Source Ownership

Keep this table honest when the backend changes. If a page's data source moves
(endpoint, envelope, or account code), update this file — it is the single
copy; `internet-billing-systemb/docs/FINANCE_SUBSYSTEM_GUIDE.md` only points
here to prevent drift.