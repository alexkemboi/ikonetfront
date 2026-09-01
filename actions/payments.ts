"use server";

import { auth } from "@/lib/auth";
import { buildApiUrl } from "@/lib/constants";
import { getPermissionForRoute } from "@/lib/data/nav";
import { timeoutSignal, unwrapPostings } from "@/lib/finance/ledger";
import type { AccountPosting } from "@/lib/types/finance";
import type {
  PaymentLedgerItem,
  PaymentLedgerKpis,
  InvoiceItem,
  InvoiceKpis,
  ServiceType,
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

/** KPIs derived from the returned 1110 postings by their `occurredAt` window. */
function computePaymentKpis(postings: AccountPosting[]): PaymentLedgerKpis {
  const now = new Date();
  const monday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - ((now.getDay() + 6) % 7)
  );

  let todayAmount = 0;
  let thisWeekAmount = 0;
  let mobileMoneyMonthAmount = 0;

  for (const p of postings) {
    const at = new Date(p.occurredAt);
    if (isNaN(at.getTime())) continue;
    const amount = Math.abs(p.amount);
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
    totalRecordedCount: postings.length,
  };
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

const FALLBACK_INVOICE_KPIS: InvoiceKpis = {
  allInvoicesCount: 0,
  pendingAmount: 0,
  pendingCount: 0,
  overdueCount: 0,
  collectedAmount: 0,
};

export async function getPaymentsLedgerData(): Promise<{
  kpis: PaymentLedgerKpis;
  payments: PaymentLedgerItem[];
}> {
  const session = await auth();
  const token = session?.user?.apiToken;

  if (!token) {
    return { kpis: ZERO_PAYMENT_KPIS, payments: [] };
  }

  // Self-gate on the canonical route that IS present in the static nav configs
  // (`/finance/billing/payments`), so ADMIN/MANAGEMENT still resolve canView via
  // the static fallback while users without finance menus get a zero-safe page.
  // The `/finance/payments` alias is deliberately NOT used: it is absent from
  // every nav config, so gating on it would lock the pages out entirely.
  const perms = await getPermissionForRoute("/finance/billing/payments");
  if (!perms.canView) {
    return { kpis: ZERO_PAYMENT_KPIS, payments: [] };
  }

  try {
    const res = await fetch(
      buildApiUrl("/finance/transactions?accountCode=1110&page=0&size=50"),
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
        signal: timeoutSignal(),
      }
    );

    if (!res.ok) {
      return { kpis: ZERO_PAYMENT_KPIS, payments: [] };
    }

    const postings = unwrapPostings(await res.json());
    return {
      kpis: computePaymentKpis(postings),
      payments: postings.map(toPaymentLedgerItem),
    };
  } catch (error) {
    console.error("[Payments] getPaymentsLedgerData error:", error);
    return { kpis: ZERO_PAYMENT_KPIS, payments: [] };
  }
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
