export type PaymentMethod = "M-Pesa" | "Paystack" | "Voucher" | "Cash" | "Bank";
export type ServiceType = "HOTSPOT" | "PPPOE" | "VOUCHER" | "ENTERPRISE" | "TV" | "OTHER";

/**
 * Whether a paid purchase turned into a connection (GET /finance/payments/received).
 * CONNECTED: router accounted traffic for it · CONNECTING: paid < 5 min ago ·
 * NOT_CONNECTED: paid, device bound, never came online (compensation candidate) ·
 * COMPENSATED: a compensation voucher was issued · NO_DEVICE: legacy path, no device ·
 * NOT_APPLICABLE: PPPoE renewal · UNLINKED: ledger line without a payment row.
 */
export type PaymentConnection =
  | "CONNECTED"
  | "CONNECTING"
  | "NOT_CONNECTED"
  | "COMPENSATED"
  | "NO_DEVICE"
  | "NOT_APPLICABLE"
  | "UNLINKED";
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
  // ── Payer identity (GET /finance/payments/received) ──
  paymentId?: string;
  /** Payer phone as M-Pesa reported it (2547XXXXXXXX). */
  phone?: string;
  customerName?: string;
  mpesaReceipt?: string;
  packageName?: string;
  routerName?: string;
  voucherCode?: string;
  sessionId?: number;
  connection?: PaymentConnection;
  compensationVoucher?: string;
}

export interface PaymentLedgerKpis {
  todayAmount: number;
  thisWeekAmount: number;
  mobileMoneyMonthAmount: number;
  voucherMonthAmount: number;
  totalRecordedCount: number;
  /** Paid, never connected, not yet compensated. Present when served by /finance/payments/received. */
  notConnectedCount?: number;
  compensatedCount?: number;
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
  /** Router the batch is minted for; its vouchers are redeemable only there. */
  deviceId?: number;
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


// ── GET /finance/reconciliation/day ──────────────────────────────────────────

export type AttentionKind = "PAID_NOT_CONNECTED" | "LEDGER_NOT_POSTED" | "CHARGED_NOT_RECORDED";
export type AttentionAction = "ISSUE_VOUCHER" | "POST_TO_LEDGER" | "ASSIGN_COMPANY" | "INVESTIGATE";
export type SafaricomCheckStatus = "NOT_RUN" | "CONFIRMED" | "UNAVAILABLE" | "DIFFERENCES";

export interface ReconciliationAttentionItem {
  kind: AttentionKind;
  action: AttentionAction;
  /** One sentence a person can act on. */
  reason: string;
  occurredAt?: string | null;
  paymentId?: string | null;
  phone?: string | null;
  mpesaReceipt?: string | null;
  /** Decimal string (KES). */
  amount?: string | null;
  packageName?: string | null;
  routerName?: string | null;
  voucherCode?: string | null;
  checkoutRequestId?: string | null;
}

export interface ReconciliationDay {
  date: string;
  companyId?: string | null;
  story: {
    /** Decimal string (KES) booked to M-Pesa clearing that day. */
    received: string;
    payments: number;
    customers: number;
    connected: number;
    connecting: number;
    notConnected: number;
    compensated: number;
    needsAttention: number;
    currency: string;
  };
  attention: ReconciliationAttentionItem[];
  safaricomCheck: {
    status: SafaricomCheckStatus;
    explanation: string;
    safaricomTransactions: number;
    ibsPayments: number;
    differences: number;
    lastRunAt?: string | null;
  };
  generatedAt?: string;
}
