export type PaymentMethod = "M-Pesa" | "Paystack" | "Voucher" | "Cash" | "Bank";
export type ServiceType = "HOTSPOT" | "PPPOE" | "VOUCHER" | "ENTERPRISE";
export type PayoutType = "Direct" | "Bank" | "Agent" | "Internal";

export interface PaymentLedgerItem {
  id: string;
  subscriberCode: string;
  subscriberPhone: string;
  receiptNumber: string;
  paymentMethod: PaymentMethod;
  serviceType: ServiceType;
  isReconciled: boolean;
  payoutType: PayoutType;
  amount: number;
  currency: string;
  dateFormatted: string;
  latencyText: string;
  memo?: string;
  isFallback?: boolean;
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
