"use server";

import { auth } from "@/lib/auth";
import { apiFetch } from "@/lib/apiClient";
import { buildApiUrl } from "@/lib/constants";
import { getPermissionForRoute } from "@/lib/data/nav";
import { todayEatIso } from "@/lib/dates";
import { timeoutSignal, unwrapPostings } from "@/lib/finance/ledger";
import { withCompanyContext } from "@/lib/companyContext";
import { revalidatePath } from "next/cache";
import type { AccountPosting } from "@/lib/types/finance";
import type {
  PaymentLedgerItem,
  PaymentLedgerKpis,
  InvoiceItem,
  InvoiceKpis,
  ServiceType,
  DarajaReconciliationSummary,
  DarajaReconciliationEntry,
  ReconciliationOutcomeCounts,
  ManualPaymentRequest,
  ManualPaymentResponse,
  CreateInvoiceRequest,
  InvoiceItem as InvoiceEntry,
  VoucherBatchItem,
  VoucherBatchKpis,
  PaymentConnection,
  ReconciliationDay,
} from "@/lib/types/payments";

// Zero-safe KPIs — the ledger never fabricates numbers when Account 1110 has
// no postings or the backend is unreachable.
const ZERO_PAYMENT_KPIS: PaymentLedgerKpis = {
  todayAmount: 0,
  thisWeekAmount: 0,
  mobileMoneyMonthAmount: 0,
  voucherMonthAmount: 0,
  totalRecordedCount: 0,
};

function sameCalendarDay(at: Date, ref: Date): boolean {
  return (
    at.getFullYear() === ref.getFullYear() &&
    at.getMonth() === ref.getMonth() &&
    at.getDate() === ref.getDate()
  );
}

interface AmountAt {
  amount: number;
  occurredAt: string;
}

/**
 * KPIs derived from a set of { amount, occurredAt } rows by their calendar
 * windows. Shared by the GL path (postings) and the gateway fallback
 * (TriggerPaymentResponse.datecreated) so both sources compute the same KPIs.
 */
function computeKpis(rows: AmountAt[]): PaymentLedgerKpis {
  const now = new Date();
  const monday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - ((now.getDay() + 6) % 7)
  );

  let todayAmount = 0;
  let thisWeekAmount = 0;
  let mobileMoneyMonthAmount = 0;

  for (const row of rows) {
    const at = new Date(row.occurredAt);
    if (isNaN(at.getTime())) continue;
    const amount = Math.abs(row.amount);
    if (sameCalendarDay(at, now)) todayAmount += amount;
    if (at >= monday) thisWeekAmount += amount;
    if (at.getFullYear() === now.getFullYear() && at.getMonth() === now.getMonth()) {
      mobileMoneyMonthAmount += amount;
    }
  }

  return {
    todayAmount,
    thisWeekAmount,
    mobileMoneyMonthAmount,
    voucherMonthAmount: 0,
    totalRecordedCount: rows.length,
  };
}

/** KPIs derived from the returned 1110 postings by their `occurredAt` window. */
function computePaymentKpis(postings: AccountPosting[]): PaymentLedgerKpis {
  return computeKpis(
    postings.map((p) => ({ amount: Math.abs(p.amount), occurredAt: p.occurredAt }))
  );
}

function toPaymentLedgerItem(p: AccountPosting): PaymentLedgerItem {
  const occurred = new Date(p.occurredAt);
  const dateFormatted = isNaN(occurred.getTime())
    ? p.occurredAt
    : occurred.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });

  return {
    id: String(p.id),
    subscriberCode: p.customerId ? `CUS-${p.customerId}` : "GUEST-USER",
    subscriberPhone: p.memo || "—",
    receiptNumber: p.sourceId ? String(p.sourceId).slice(0, 10).toUpperCase() : "MPESA-CONFIRMED",
    paymentMethod: "M-Pesa",
    serviceType: (p.serviceType as ServiceType) || "HOTSPOT",
    isReconciled: true,
    payoutType: "Direct",
    amount: Math.abs(p.amount),
    currency: p.currency || "KES",
    dateFormatted,
    latencyText: "<1s",
  };
}

/**
 * One TriggerPaymentResponse row from `GET /payments?issuccessfull=true`
 * (envelope `{ data: [...] }`). Used only as the gateway fallback when Account
 * 1110 has zero postings — never as the primary source of truth.
 */
interface GatewayPaymentRow {
  id: number | string;
  customerNumber?: string | null;
  amount?: number | null;
  mpesaReceipt?: string | null;
  checkoutRequestId?: string | null;
  datecreated?: string | null;
}

function toGatewayPaymentLedgerItem(p: GatewayPaymentRow): PaymentLedgerItem {
  const customer = p.customerNumber || "HOTSPOT GUEST";
  const occurred = p.datecreated ? new Date(p.datecreated) : new Date(NaN);
  const dateFormatted = isNaN(occurred.getTime())
    ? p.datecreated || "—"
    : occurred.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
  return {
    id: String(p.id),
    subscriberCode: customer,
    subscriberPhone: p.customerNumber || "—",
    receiptNumber:
      p.mpesaReceipt || p.checkoutRequestId?.slice(0, 10) || "MPESA-CONFIRMED",
    paymentMethod: "M-Pesa",
    serviceType: "HOTSPOT",
    isReconciled: true,
    payoutType: "Direct",
    amount: p.amount ?? 0,
    currency: "KES",
    dateFormatted,
    latencyText: "<1s",
  };
}

const FALLBACK_INVOICE_KPIS: InvoiceKpis = {
  allInvoicesCount: 0,
  pendingAmount: 0,
  pendingCount: 0,
  overdueCount: 0,
  collectedAmount: 0,
};

export async function getPaymentsLedgerData(
  companyScope?: string | null
): Promise<{
  kpis: PaymentLedgerKpis;
  payments: PaymentLedgerItem[];
  source: "GL" | "GATEWAY" | "RECEIVED";
}> {
  const session = await auth();
  const token = session?.user?.apiToken;

  if (!token) {
    return { kpis: ZERO_PAYMENT_KPIS, payments: [], source: "GL" };
  }

  // Self-gate on the canonical route that IS present in the static nav configs
  // (`/finance/billing/payments`), so ADMIN/MANAGEMENT still resolve canView via
  // the static fallback while users without finance menus get a zero-safe page.
  // The `/finance/payments` alias is deliberately NOT used: it is absent from
  // every nav config, so gating on it would lock the pages out entirely.
  const perms = await getPermissionForRoute("/finance/billing/payments");
  if (!perms.canView) {
    return { kpis: ZERO_PAYMENT_KPIS, payments: [], source: "GL" };
  }

  // Gateway fallback — engaged ONLY when Account 1110 has zero postings (e.g.
  // before the canonicalization migration / backfill lands) or the GL read
  // itself fails. Shows real confirmed gateway payments; on any failure it
  // returns zero-safe empty data — it never fabricates a ledger.
  const gatewayFallback = async (): Promise<{
    kpis: PaymentLedgerKpis;
    payments: PaymentLedgerItem[];
    source: "GL" | "GATEWAY";
  }> => {
    const zeroGateway = { kpis: ZERO_PAYMENT_KPIS, payments: [], source: "GATEWAY" as const };
    try {
      const gatewayRes = await fetch(
        buildApiUrl("/payments?issuccessfull=true"),
        {
          headers: await withCompanyContext(
            {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            companyScope
          ),
          cache: "no-store",
          signal: timeoutSignal(),
        }
      );
      if (!gatewayRes.ok) return zeroGateway;
      const rows = unwrapData<GatewayPaymentRow[]>(await gatewayRes.json()) ?? [];
      if (!Array.isArray(rows) || rows.length === 0) return zeroGateway;
      const kpis = computeKpis(
        rows.map((r) => ({
          amount: r.amount ?? 0,
          occurredAt: r.datecreated ?? "",
        }))
      );
      return { kpis, payments: rows.map(toGatewayPaymentLedgerItem), source: "GATEWAY" };
    } catch (error) {
      console.error("[Payments] gateway fallback error:", error);
      return zeroGateway;
    }
  };

  // Primary: M-Pesa receipts traced to the payer (phone, receipt, package, router)
  // and whether the purchase connected. Falls through to the GL/gateway reads
  // below when the endpoint is unavailable (e.g. frontend deployed before backend).
  const received = await fetchPaymentsReceived(token, companyScope);
  if (received) return received;

  let postings: AccountPosting[] = [];
  try {
    const res = await fetch(
      buildApiUrl("/finance/transactions?accountCode=1110&page=0&size=50"),
      {
        headers: await withCompanyContext(
          {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          companyScope
        ),
        cache: "no-store",
        signal: timeoutSignal(),
      }
    );

    if (!res.ok) {
      // GL read failed — fall back to the gateway so the page never goes dark
      // on a GL hiccup. Any fallback failure yields zeros below.
      return gatewayFallback();
    }

    postings = unwrapPostings(await res.json());
  } catch (error) {
    console.error("[Payments] getPaymentsLedgerData error:", error);
    return gatewayFallback();
  }

  // GL-first: Account 1110 postings are the single source of truth whenever
  // they exist.
  if (postings.length > 0) {
    return {
      kpis: computePaymentKpis(postings),
      payments: postings.map(toPaymentLedgerItem),
      source: "GL",
    };
  }

  return gatewayFallback();
}

/**
 * Record a manual cash/bank payment for a PPPoE customer.
 * POST /api/v1/payments/manual — envelope-returning endpoint.
 */
export async function recordManualPayment(
  req: ManualPaymentRequest,
  stepUpToken?: string
): Promise<{ success: boolean; status?: number; data?: ManualPaymentResponse; message: string }> {
  const res = await apiFetch<ManualPaymentResponse>("/payments/manual", {
    method: "POST",
    body: req,
    auth: "required",
    stepUpToken,
  });
  if (!res.success) {
    return { success: false, status: res.status, message: res.message || "Failed to record the payment." };
  }
  revalidatePath("/finance/billing/payments");
  return { success: true, status: res.status, data: res.data ?? undefined, message: res.message };
}

/**
 * Fetch the invoice ledger (page + summary) with envelope-aware unwrapping.
 * Replaces the historical stub with the live /finance/invoices contract.
 */
export async function getInvoicesLedgerData(): Promise<{
  kpis: InvoiceKpis;
  invoices: InvoiceItem[];
}> {
  const session = await auth();
  if (!session?.user?.apiToken) {
    return { kpis: FALLBACK_INVOICE_KPIS, invoices: [] };
  }
  const [pageRes, summaryRes] = await Promise.all([
    apiFetch<{ content: InvoiceEntry[] }>("/finance/invoices?page=0&size=100", { auth: "required" }),
    apiFetch<{
      allInvoicesCount: number;
      pendingAmount: number;
      pendingCount: number;
      overdueCount: number;
      collectedAmount: number;
      paidCount: number;
    }>("/finance/invoices/summary", { auth: "required" }),
  ]);
  const rows = pageRes.data?.content ?? [];
  const invoices = rows.length
    ? rows.map(toInvoiceItem)
    : await fetchInvoicesFallback();
  const summary = summaryRes.data;
  const kpis: InvoiceKpis = summary
    ? {
        allInvoicesCount: summary.allInvoicesCount,
        pendingAmount: summary.pendingAmount ?? 0,
        pendingCount: summary.pendingCount ?? 0,
        overdueCount: summary.overdueCount ?? 0,
        collectedAmount: summary.collectedAmount ?? 0,
      }
    : FALLBACK_INVOICE_KPIS;
  return { kpis, invoices };
}

function toInvoiceItem(row: InvoiceEntry): InvoiceItem {
  const status = row.status as InvoiceItem["status"];
  const amount = Number(row.amount ?? row.outstanding ?? 0);
  const outstanding = Number(row.outstanding ?? (row.status === "PAID" ? 0 : amount));
  return {
    id: String(row.id),
    invoiceNumber: row.invoiceNumber,
    customerName: row.customerName ?? "Customer",
    customerPhone: row.customerPhone ?? "",
    customerIdxno: row.customerIdxno,
    packageName: row.packageName,
    amount: toNumber(row.amount),
    taxAmount: row.taxAmount != null ? Number(row.taxAmount) : 0,
    outstanding,
    dueDate: row.dueDate,
    status,
    createdAt: row.createdAt,
    paymentReference: row.paymentReference,
    paidAt: row.paidAt,
    recordedBy: row.recordedBy,
  };
}

function toNumber(value: unknown): number {
  const n = typeof value === "number" ? value : Number(String(value ?? 0));
  return Number.isFinite(n) ? n : 0;
}

/**
 * Bare fetch fallback for the invoice page (legacy MSW/non-envelope shapes),
 * so the ledger never goes dark when the envelope parse fails.
 */
async function fetchInvoicesFallback(): Promise<InvoiceItem[]> {
  try {
    const res = await fetch(buildApiUrl("/finance/invoices?page=0&size=100"), {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${(await auth())?.user?.apiToken ?? ""}`,
      },
      cache: "no-store",
      signal: timeoutSignal(),
    });
    if (!res.ok) return [];
    const body = (await res.json()) as { data?: { content?: unknown[] }; content?: unknown[] };
    const rows = body?.data?.content ?? body?.content ?? [];
    if (!Array.isArray(rows)) return [];
    return (rows as InvoiceEntry[]).map(toInvoiceItem);
  } catch (error) {
    console.error("[Payments] invoice fallback error:", error);
    return [];
  }
}

/**
 * Create a manual pro-forma invoice (document-only; no AR GL).
 */
export async function createManualInvoice(
  req: CreateInvoiceRequest
): Promise<{ success: boolean; invoice?: InvoiceItem; message: string }> {
  const res = await apiFetch<InvoiceEntry>("/finance/invoices", {
    method: "POST",
    body: req,
    auth: "required",
  });
  if (!res.success || !res.data) {
    return { success: false, message: res.message || "Failed to create the invoice." };
  }
  revalidatePath("/finance/billing/invoices");
  return { success: true, invoice: toInvoiceItem(res.data), message: res.message };
}

/**
 * Mark an invoice PAID (document-level only).
 */
export async function markInvoicePaid(
  id: string,
  paymentReference?: string
): Promise<{ success: boolean; message: string }> {
  const res = await apiFetch<InvoiceEntry>(`/finance/invoices/${id}/paid`, {
    method: "POST",
    body: { paymentReference: paymentReference ?? "" },
    auth: "required",
  });
  if (!res.success) {
    return { success: false, message: res.message || "Failed to mark the invoice paid." };
  }
  revalidatePath("/finance/billing/invoices");
  return { success: true, message: res.message };
}

/**
 * Fetch the voucher-batch ledger (page + KPI derivation).
 */
export async function getVoucherBatches(): Promise<{
  kpis: VoucherBatchKpis;
  batches: VoucherBatchItem[];
}> {
  const session = await auth();
  if (!session?.user?.apiToken) {
    return { kpis: ZERO_VOUCHER_KPIS, batches: [] };
  }
  const res = await apiFetch<{ content: VoucherBatchItem[] }>(
    "/finance/voucher-batches?page=0&size=100",
    { auth: "required" }
  );
  const batches = res.data?.content ?? [];
  let activeCount = 0;
  let activeValue = 0;
  let totalValue = 0;
  for (const b of batches) {
    const v = toNumber(b.totalValue);
    totalValue += v;
    if (b.status === "ACTIVE") {
      activeCount += 1;
      activeValue += v;
    }
  }
  const kpis: VoucherBatchKpis = { activeCount, activeValue, totalValue };
  return { kpis, batches };
}

const ZERO_VOUCHER_KPIS: VoucherBatchKpis = {
  activeCount: 0,
  activeValue: 0,
  totalValue: 0,
};

/**
 * Mint a paid voucher batch through the proven hotspot RADIUS path.
 * POST /api/v1/finance/voucher-batches — envelope-returning endpoint.
 */
export async function generateVoucherBatch(
  req: import("@/lib/types/payments").GenerateVoucherBatchRequest
): Promise<{ success: boolean; data?: VoucherBatchItem; message: string }> {
  const res = await apiFetch<VoucherBatchItem>("/finance/voucher-batches", {
    method: "POST",
    body: req,
    auth: "required",
  });
  if (!res.success) {
    return { success: false, message: res.message || "Failed to mint the voucher batch." };
  }
  revalidatePath("/finance/vouchers");
  return { success: true, data: res.data ?? undefined, message: res.message };
}

export async function downloadReceiptPdf(
  statementId?: number
): Promise<ArrayBuffer | null> {
  const session = await auth();
  if (!session?.user?.apiToken) {
    console.warn("[Payments] Unauthenticated receipt download rejected.");
    return null;
  }
  const perms = await getPermissionForRoute("/finance/payments");
  if (!perms.canView) {
    console.warn("[Payments] User lacks permission to download receipts.");
    return null;
  }
  if (!statementId || statementId <= 0) {
    console.warn("[Payments] No statement id to download a receipt for.");
    return null;
  }
  try {
    const res = await fetch(buildApiUrl(`/statements/${statementId}/download`), {
      headers: await getAuthHeaders(),
    });
    if (
      !res.ok ||
      !res.headers.get("content-type")?.includes("application/pdf")
    ) {
      console.warn(
        "[Payments] Receipt PDF download failed",
        res.status,
        res.statusText
      );
      return null;
    }
    return res.arrayBuffer();
  } catch (error) {
    console.error("[Payments] downloadReceiptPdf error:", error);
    return null;
  }
}

export async function emailReceipt(
  statementId: number | undefined,
  recipientEmail: string
): Promise<{ success: boolean; message: string }> {
  const session = await auth();
  if (!session?.user?.apiToken) {
    return { success: false, message: "You must be signed in to email receipts." };
  }
  const perms = await getPermissionForRoute("/finance/payments");
  if (!perms.canEdit && !perms.canCreate) {
    return { success: false, message: "You don't have permission to email receipts." };
  }
  if (!statementId || statementId <= 0) {
    return {
      success: false,
      message: "This payment is not linked to a statement, so no receipt can be emailed.",
    };
  }
  try {
    const res = await fetch(buildApiUrl(`/statements/${statementId}/email`), {
      method: "POST",
      headers: { ...(await getAuthHeaders()), "Content-Type": "application/json" },
      body: JSON.stringify({ recipientEmail }),
    });
    if (!res.ok) {
      const body: { message?: string } | null = await res.json().catch(() => null);
      return {
        success: false,
        message: body?.message || `Email failed (HTTP ${res.status}).`,
      };
    }
    return {
      success: true,
      message: `Receipt emailed to ${recipientEmail}.`,
    };
  } catch (error) {
    console.error("[Payments] emailReceipt error:", error);
    return {
      success: false,
      message: "Failed to send receipt email.",
    };
  }
}

async function getAuthHeaders(): Promise<HeadersInit> {
  const session = await auth();
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (session?.user?.apiToken) {
    (headers as Record<string, string>)["Authorization"] =
      `Bearer ${session.user.apiToken}`;
  }
  // Forward the SYSADMIN-selected company so the backend scopes the call.
  return withCompanyContext(headers as Record<string, string>);
}

/** Defensive unwrap: bare payloads pass through; wrapped `{ data }` is unwrapped. */
function unwrapData<T>(json: unknown): T | null {
  if (typeof json === "object" && json !== null && "data" in json) {
    return (json as { data?: T }).data ?? null;
  }
  return json as T;
}

function isValidDateString(value: string | undefined): value is string {
  return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/**
 * Run the Daraja PullTransactions sweep for a target date (backend auto-heals
 * orphaned PaymentIntents best-effort). Role-gated on the reconciliation route.
 *
 * Real backend contract: `POST /api/v1/payments/mpesa/reconciliation/trigger?date=YYYY-MM-DD`
 * returns the bare `ReconciliationSummary` record — NOT a wrapped/paged payload.
 */
export async function triggerDarajaPull(
  input: { targetDate?: string } = {}
): Promise<{ success: boolean; data?: DarajaReconciliationSummary; message: string }> {
  const session = await auth();
  if (!session?.user?.apiToken) {
    return { success: false, message: "You must be signed in to run the Daraja pull." };
  }
  const perms = await getPermissionForRoute("/finance/reconciliation");
  if (!perms.canView) {
    return { success: false, message: "You don't have permission to run reconciliation." };
  }
  try {
    const qs = isValidDateString(input.targetDate) ? `?date=${input.targetDate}` : "";
    const res = await fetch(
      buildApiUrl(`/payments/mpesa/reconciliation/trigger${qs}`),
      {
        method: "POST",
        headers: await getAuthHeaders(),
        cache: "no-store",
      }
    );
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      return { success: false, message: `Daraja pull failed (HTTP ${res.status}).` };
    }
    const data = unwrapData<DarajaReconciliationSummary>(json);
    if (
      !data ||
      typeof data.matched !== "number" ||
      typeof data.unmatchedInDaraja !== "number" ||
      typeof data.autoHealedCount !== "number"
    ) {
      return { success: false, message: "Daraja pull returned an unexpected shape." };
    }
    return { success: true, data, message: "" };
  } catch (error) {
    console.error("[Payments] triggerDarajaPull error:", error);
    return { success: false, message: "Failed to reach the Daraja pull endpoint." };
  }
}

/**
 * Fetch the daily reconciliation entries + outcome counts. Bare payload —
 * `GET /payments/mpesa/reconciliation?date=` returns `{ date, entries, summary }`.
 */
export async function getDarajaReconciliation(
  date?: string
): Promise<{
  entries: DarajaReconciliationEntry[];
  summary: ReconciliationOutcomeCounts;
  message: string;
}> {
  const session = await auth();
  if (!session?.user?.apiToken) {
    return { entries: [], summary: {}, message: "You must be signed in." };
  }
  const perms = await getPermissionForRoute("/finance/reconciliation");
  if (!perms.canView) {
    return { entries: [], summary: {}, message: "You don't have permission to view reconciliation." };
  }
  const targetDate = isValidDateString(date) ? date : todayEatIso();
  try {
    const res = await fetch(
      buildApiUrl(`/payments/mpesa/reconciliation?date=${targetDate}`),
      {
        headers: await getAuthHeaders(),
        cache: "no-store",
      }
    );
    if (!res.ok) {
      return { entries: [], summary: {}, message: `Reconciliation unavailable (HTTP ${res.status}).` };
    }
    const json = (await res.json()) as Record<string, unknown>;
    const entries = Array.isArray(json.entries)
      ? (json.entries as DarajaReconciliationEntry[])
      : [];
    const summary =
      typeof json.summary === "object" && json.summary !== null
        ? (json.summary as ReconciliationOutcomeCounts)
        : {};
    return { entries, summary, message: "" };
  } catch (error) {
    console.error("[Payments] getDarajaReconciliation error:", error);
    return { entries: [], summary: {}, message: "Failed to reach the reconciliation endpoint." };
  }
}

/**
 * Force-post a skipped receipt to the general ledger (Account 1110).
 * Bare payload — `POST /payments/mpesa/reconciliation/force-post?receiptNo=...&date=...`
 * returns `{ entry, summary, posted }`.
 */
export async function forcePostReconcile(
  receiptNo: string,
  date: string
): Promise<{ success: boolean; message: string }> {
  const session = await auth();
  if (!session?.user?.apiToken) {
    return { success: false, message: "You must be signed in to force-post to the ledger." };
  }
  const perms = await getPermissionForRoute("/finance/reconciliation");
  if (!perms.canEdit && !perms.canCreate && !perms.canView) {
    return { success: false, message: "You don't have permission to force-post to the ledger." };
  }
  if (!receiptNo.trim() || !isValidDateString(date)) {
    return { success: false, message: "A valid receipt number and date are required." };
  }
  try {
    const res = await fetch(
      buildApiUrl(
        `/payments/mpesa/reconciliation/force-post?receiptNo=${encodeURIComponent(receiptNo.trim())}&date=${date}`
      ),
      {
        method: "POST",
        headers: await getAuthHeaders(),
        cache: "no-store",
      }
    );
    const json = (await res.json().catch(() => null)) as Record<string, unknown> | null;
    if (!res.ok) {
      const detail =
        typeof json?.detail === "string"
          ? (json.detail as string)
          : typeof json?.message === "string"
            ? (json.message as string)
            : `Force-post failed (HTTP ${res.status}).`;
      return { success: false, message: detail };
    }
    if (json === null || typeof json !== "object") {
      return { success: false, message: "Force-post returned an unexpected shape." };
    }
    const posted = json.posted === true;
    return {
      success: true,
      message: posted
        ? `Receipt ${receiptNo.trim()} posted to Account 1110.`
        : `Receipt ${receiptNo.trim()} was already posted to Account 1110 (no-op).`,
    };
  } catch (error) {
    console.error("[Payments] forcePostReconcile error:", error);
    return { success: false, message: "Failed to reach the force-post endpoint." };
  }
}


// ── GET /finance/payments/received ───────────────────────────────────────────

interface PaymentReceivedRow {
  postingId: string;
  paymentId?: string | null;
  occurredAt?: string | null;
  amount?: string | number | null;
  currency?: string | null;
  service?: string | null;
  phone?: string | null;
  customerName?: string | null;
  mpesaReceipt?: string | null;
  packageName?: string | null;
  routerName?: string | null;
  voucherCode?: string | null;
  sessionId?: number | null;
  connection?: PaymentConnection | null;
  compensationVoucher?: string | null;
}

interface PaymentsReceivedPayload {
  kpis?: {
    today?: string | number;
    thisWeek?: string | number;
    thisMonth?: string | number;
    total?: string | number;
    paymentCount?: number;
    notConnectedCount?: number;
    compensatedCount?: number;
  };
  payments?: { content?: PaymentReceivedRow[] };
}

/** 254725134318 → 0725 134 318 (the format staff read and dial). */
function formatKenyanPhone(phone?: string | null): string | undefined {
  if (!phone) return undefined;
  const digits = phone.replace(/\D/g, "");
  const local = digits.startsWith("254") && digits.length === 12 ? `0${digits.slice(3)}` : digits;
  return local.length === 10 ? `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}` : phone;
}

function toServiceType(service?: string | null): ServiceType {
  const s = String(service ?? "").toUpperCase();
  return s === "HOTSPOT" || s === "PPPOE" || s === "TV" ? (s as ServiceType) : "OTHER";
}

function toReceivedLedgerItem(r: PaymentReceivedRow): PaymentLedgerItem {
  const occurred = r.occurredAt ? new Date(r.occurredAt) : new Date(NaN);
  const phone = formatKenyanPhone(r.phone);
  return {
    id: r.postingId,
    subscriberCode: r.customerName || phone || "Unknown payer",
    subscriberPhone: phone ?? "—",
    receiptNumber: r.mpesaReceipt || "—",
    paymentMethod: "M-Pesa",
    serviceType: toServiceType(r.service),
    isReconciled: true,
    payoutType: "Direct",
    amount: Number(r.amount ?? 0),
    currency: r.currency || "KES",
    dateFormatted: isNaN(occurred.getTime())
      ? r.occurredAt || "—"
      : occurred.toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
          timeZone: "Africa/Nairobi",
        }),
    latencyText: "",
    paymentId: r.paymentId ?? undefined,
    phone: r.phone ?? undefined,
    customerName: r.customerName ?? undefined,
    mpesaReceipt: r.mpesaReceipt ?? undefined,
    packageName: r.packageName ?? undefined,
    routerName: r.routerName ?? undefined,
    voucherCode: r.voucherCode ?? undefined,
    sessionId: r.sessionId ?? undefined,
    connection: r.connection ?? undefined,
    compensationVoucher: r.compensationVoucher ?? undefined,
  };
}

async function fetchPaymentsReceived(
  token: string,
  companyScope: string | null | undefined
): Promise<{ kpis: PaymentLedgerKpis; payments: PaymentLedgerItem[]; source: "RECEIVED" } | null> {
  try {
    const res = await fetch(buildApiUrl("/finance/payments/received?page=0&size=200"), {
      headers: await withCompanyContext(
        { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        companyScope
      ),
      cache: "no-store",
      signal: timeoutSignal(),
    });
    if (!res.ok) return null;
    const data = unwrapData<PaymentsReceivedPayload>(await res.json());
    if (!data || !data.kpis) return null;
    const k = data.kpis;
    return {
      kpis: {
        todayAmount: Number(k.today ?? 0),
        thisWeekAmount: Number(k.thisWeek ?? 0),
        mobileMoneyMonthAmount: Number(k.thisMonth ?? 0),
        voucherMonthAmount: 0,
        totalRecordedCount: Number(k.paymentCount ?? 0),
        notConnectedCount: Number(k.notConnectedCount ?? 0),
        compensatedCount: Number(k.compensatedCount ?? 0),
      },
      payments: (data.payments?.content ?? []).map(toReceivedLedgerItem),
      source: "RECEIVED",
    };
  } catch {
    return null;
  }
}


// ── Reconciliation as outcomes (GET /finance/reconciliation/day) ─────────────

/** One Africa/Nairobi day: money in, who connected, and what needs a person. */
export async function getReconciliationDay(
  date?: string
): Promise<{ data: ReconciliationDay | null; message?: string }> {
  const perms = await getPermissionForRoute("/finance/reconciliation");
  if (!perms.canView) {
    return { data: null, message: "You don't have permission to view reconciliation." };
  }
  const targetDate = isValidDateString(date) ? date : todayEatIso();
  const res = await apiFetch<ReconciliationDay>(`/finance/reconciliation/day?date=${targetDate}`, {
    auth: "required",
  });
  if (!res.success || !res.data) {
    return { data: null, message: res.message || "Reconciliation is unavailable." };
  }
  return { data: res.data };
}

/** Book a confirmed payment whose revenue never reached the ledger (idempotent). */
export async function postPaymentToLedgerAction(
  paymentId: string
): Promise<{ success: boolean; message: string; posted?: boolean }> {
  const perms = await getPermissionForRoute("/finance/reconciliation");
  if (!perms.canCreate && !perms.canEdit) {
    return { success: false, message: "You don't have permission to post to the ledger." };
  }
  const res = await apiFetch<{ posted?: boolean; message?: string }>(
    `/finance/reconciliation/post-to-ledger?paymentId=${encodeURIComponent(paymentId)}`,
    { method: "POST", auth: "required" }
  );
  if (!res.success) {
    return { success: false, message: res.message || "Could not post the payment to the ledger." };
  }
  revalidatePath("/finance/reconciliation");
  revalidatePath("/finance/billing/payments");
  return { success: true, posted: res.data?.posted, message: res.message || "Posted to the ledger." };
}
