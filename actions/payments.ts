"use server";

import { auth } from "@/lib/auth";
import { buildApiUrl } from "@/lib/constants";
import { getPermissionForRoute } from "@/lib/data/nav";
import { todayEatIso } from "@/lib/dates";
import { timeoutSignal, unwrapPostings } from "@/lib/finance/ledger";
import { withCompanyContext } from "@/lib/companyContext";
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
  source: "GL" | "GATEWAY";
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

export async function getInvoicesLedgerData(): Promise<{
  kpis: InvoiceKpis;
  invoices: InvoiceItem[];
}> {
  return { kpis: FALLBACK_INVOICE_KPIS, invoices: [] };
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
  return headers;
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
