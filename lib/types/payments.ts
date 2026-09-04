export type PaymentMethod = "M-Pesa" | "Paystack" | "Voucher" | "Cash" | "Bank";
export type ServiceType = "HOTSPOT" | "PPPOE" | "VOUCHER" | "ENTERPRISE";
export type PayoutType = "Direct" | "Bank" | "Agent" | "Internal";

export interface PaymentLedgerItem {
  id: string;
  subscriberCode: string;
  subscriberPhone: string;
  receiptNumber: string;
  statementId?: number;
  paymentMethod: PaymentMethod;
  serviceType: ServiceType;
  isReconciled: boolean;
  payoutType: PayoutType;
  amount: number;
  currency: string;
  dateFormatted: string;
  latencyText: string;
  memo?: string;
}

export interface PaymentLedgerKpis {
  todayAmount: number;
  thisWeekAmount: number;
  mobileMoneyMonthAmount: number;
  voucherMonthAmount: number;
  totalRecordedCount: number;
}

export interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerPhone: string;
  amount: number;
  outstanding: number;
  dueDate: string;
  status: "PENDING" | "PAID" | "PARTIAL" | "OVERDUE" | "CANCELLED";
  createdAt: string;
}

export interface InvoiceKpis {
  allInvoicesCount: number;
  pendingAmount: number;
  pendingCount: number;
  overdueCount: number;
  collectedAmount: number;
}

// ── M-Pesa Daraja reconciliation (finance/reconciliation) ──────────────
export type ReconciliationOutcome =
  | "MATCHED"
  | "UNMATCHED_IN_IBS"
  | "UNMATCHED_IN_DARAJA"
  | "AMBIGUOUS"
  | "AUTO_HEALED";

/** One row of the daily reconciliation (`MpesaReconciliationEntry`). */
export interface DarajaReconciliationEntry {
  id: string;
  reconciliationDate: string;
  receiptNo: string;
  checkoutRequestId: string | null;
  amount: number;
  transactionDate: string | null;
  safaricomExists: boolean;
  pppoeExists: boolean;
  hotspotExists: boolean;
  outcome: ReconciliationOutcome;
  resolved: boolean;
  resolutionNotes: string | null;
  createdAt: string;
  updatedAt: string | null;
}

/** `ReconciliationSummary` returned by the trigger sweep. */
export interface DarajaReconciliationSummary {
  day: string;
  totalDaraja: number;
  totalIbs: number;
  matched: number;
  unmatchedInIbs: number;
  unmatchedInDaraja: number;
  ambiguous: number;
  autoHealedCount: number;
}

/** Success data from `POST /payments/mpesa/pull/trigger`. */
export interface DarajaPullTriggerResponse {
  targetDate: string;
  healedCount: number;
  summary: DarajaReconciliationSummary;
}

/** Outcome-count map returned by `GET /payments/mpesa/reconciliation`. */
export type ReconciliationOutcomeCounts = Record<string, number>;

