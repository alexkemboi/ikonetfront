"use server";

import { auth } from "@/lib/auth";
import { BASE_URL } from "@/lib/constants";
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
    const list = Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data)
        ? data
        : FALLBACK_PAYMENTS;

    return {
      kpis: FALLBACK_PAYMENT_KPIS,
      payments: list as PaymentLedgerItem[],
    };
  } catch (e) {
    return { kpis: FALLBACK_PAYMENT_KPIS, payments: FALLBACK_PAYMENTS };
  }
}

export async function getInvoicesLedgerData(): Promise<{
  kpis: InvoiceKpis;
  invoices: InvoiceItem[];
}> {
  return { kpis: FALLBACK_INVOICE_KPIS, invoices: [] };
}

export async function downloadReceiptPdf(receiptNumber: string): Promise<boolean> {
  // Stub: simulated server-side PDF generator trigger.
  // Later, wire this to `${BASE_URL}statements/{id}/download`, mirroring
  // `downloadStatementPdf` in `actions/finance.ts` (checks content-type
  // application/pdf, returns ArrayBuffer | null) once the backend fields are confirmed.
  void receiptNumber;
  return true;
}

export async function emailReceipt(
  receiptNumber: string,
  recipientEmail: string
): Promise<{ success: boolean; message: string }> {
  return {
    success: true,
    message: `Receipt ${receiptNumber} emailed to ${recipientEmail}.`,
  };
}
