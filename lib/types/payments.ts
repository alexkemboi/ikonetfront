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
  customerIdxno?: number;
  packageName?: string;
  amount: number;
  taxAmount?: number;
  outstanding: number;
  dueDate: string;
  status: "UNPAID" | "PAID" | "OVERDUE" | "CANCELLED" | "PENDING" | "PARTIAL";
  createdAt: string;
  paymentReference?: string;
  paidAt?: string;
  recordedBy?: string;
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

/** One row of the daily reconciliation (`ReconciliationEntryDto`). */
export interface DarajaReconciliationEntry {
  id: string;
  receiptNumber: string;
  amount: number;
  phoneNumber: string | null;
  customerName: string | null;
  transactionDate: string | null;
  checkoutRequestId: string | null;
  serviceType: "HOTSPOT" | "PPPOE" | "UNKNOWN" | null;
  outcome: ReconciliationOutcome;
  notes: string | null;
  canForceReconcile: boolean;
}

/** `ReconciliationSummary` returned by the trigger sweep and the pull endpoint. */
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

/** Outcome-count map returned by `GET /payments/mpesa/reconciliation`. */
export type ReconciliationOutcomeCounts = Record<string, number>;

// ── Track 4 — manual payments, invoices, voucher batches ──────────────
export interface ManualPaymentRequest {
  customerIdxno: number;
  accountId?: string;
  subscriptionId?: string;
  amount: number;
  channel: "CASH" | "BANK_TRANSFER";
  notes?: string;
  invoiceId?: string;
}

export interface ManualPaymentResponse {
  paymentId: string;
  referenceNumber: string;
  amount: number;
  channel: "CASH" | "BANK_TRANSFER";
  expiresAt: string | null;
  recordedAt: string;
}

export interface VoucherBatchItem {
  batchId: string;
  batchNumber: string;
  sessionBatchId: string | null;
  companyId: string | null;
  stationId: string | null;
  packageId: number;
  packageName: string;
  quantity: number;
  unitPrice: string;
  totalValue: string;
  channel: "CASH" | "BANK_TRANSFER";
  status: "ACTIVE" | "EXHAUSTED" | "ARCHIVED";
  codePrefix?: string;
  codeLength?: number;
  createdByUsername: string;
  createdAt: string;
  codes?: string[];
  mintedCount: number;
  redeemedCount: number;
}

export interface VoucherBatchKpis {
  activeCount: number;
  activeValue: string;
  totalValue: string;
  vouchers?: number;
}

export interface GenerateVoucherBatchRequest {
  packageId: number;
  quantity: number;
  codePrefix?: string;
  codeLength?: number;
  channel: "CASH" | "BANK_TRANSFER";
  stationId?: string;
  companyId?: string;
  expectedUnitPrice: string;
  confirmDuplicate?: boolean;
  deviceId?: number;
  idempotencyKey: string;
}

export interface CreateInvoiceRequest {
  customerIdxno: number;
  accountId?: string;
  subscriptionId?: string;
  packageId?: string;
  amount?: number;
  taxAmount?: number;
  packageName?: string;
}

