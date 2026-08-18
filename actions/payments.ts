"use server";

import { auth } from "@/lib/auth";
import { BASE_URL, buildApiUrl } from "@/lib/constants";
import { getPermissionForRoute } from "@/lib/data/nav";
import type {
  PaymentLedgerItem,
  PaymentLedgerKpis,
  InvoiceItem,
  InvoiceKpis,
} from "@/lib/types/payments";

const FALLBACK_PAYMENT_KPIS: PaymentLedgerKpis = {
  todayAmount: 1485,
  thisWeekAmount: 1485,
  mobileMoneyMonthAmount: 154376,
  voucherMonthAmount: 0,
  totalRecordedCount: 47330,
};

const FALLBACK_PAYMENTS: PaymentLedgerItem[] = [
  {
    id: "pay-1",
    subscriberCode: "A3762",
    subscriberPhone: "0794095112",
    receiptNumber: "UGK3W0IY06",
    paymentMethod: "M-Pesa",
    serviceType: "HOTSPOT",
    isReconciled: true,
    payoutType: "Direct",
    amount: 10,
    currency: "KES",
    dateFormatted: "Jul 20, 09:31 AM",
    latencyText: "1s",
    isFallback: true,
  },
  {
    id: "pay-2",
    subscriberCode: "A5735",
    subscriberPhone: "0794091549",
    receiptNumber: "UGK5J0B2TS",
    paymentMethod: "M-Pesa",
    serviceType: "HOTSPOT",
    isReconciled: true,
    payoutType: "Direct",
    amount: 10,
    currency: "KES",
    dateFormatted: "Jul 20, 09:28 AM",
    latencyText: "9s",
    isFallback: true,
  },
  {
    id: "pay-3",
    subscriberCode: "A6632",
    subscriberPhone: "0792259662",
    receiptNumber: "UGK70BSPLQ",
    paymentMethod: "M-Pesa",
    serviceType: "HOTSPOT",
    isReconciled: true,
    payoutType: "Direct",
    amount: 28,
    currency: "KES",
    dateFormatted: "Jul 20, 09:20 AM",
    latencyText: "2s",
    isFallback: true,
  },
  {
    id: "pay-4",
    subscriberCode: "A1074",
    subscriberPhone: "0711902834",
    receiptNumber: "UGK90AKPLM",
    paymentMethod: "M-Pesa",
    serviceType: "HOTSPOT",
    isReconciled: true,
    payoutType: "Direct",
    amount: 15,
    currency: "KES",
    dateFormatted: "Jul 20, 09:12 AM",
    latencyText: "1s",
    isFallback: true,
  },
];

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
    return { kpis: FALLBACK_PAYMENT_KPIS, payments: FALLBACK_PAYMENTS };
  }

  try {
    const res = await fetch(`${BASE_URL}finance/transactions?limit=50`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return { kpis: FALLBACK_PAYMENT_KPIS, payments: FALLBACK_PAYMENTS };
    }

    const data = await res.json();
    const rawList = Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data)
        ? data
        : FALLBACK_PAYMENTS;

    const payments = (rawList as PaymentLedgerItem[]).map((row) => {
      const r = (row ?? {}) as unknown as Record<string, unknown>;
      const statement = r.statement as Record<string, unknown> | undefined;
      const rawStatementId =
        r.statementId ?? statement?.id ?? statement?.statementId ?? row.statementId;
      const statementId =
        typeof rawStatementId === "number"
          ? rawStatementId
          : typeof rawStatementId === "string" && /^\d+$/.test(rawStatementId)
            ? Number(rawStatementId)
            : undefined;
      return { ...row, statementId };
    });

    return {
      kpis: FALLBACK_PAYMENT_KPIS,
      payments,
    };
  } catch {
    return { kpis: FALLBACK_PAYMENT_KPIS, payments: FALLBACK_PAYMENTS };
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
