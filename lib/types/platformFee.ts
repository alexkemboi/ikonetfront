/** System (maintenance) fees — mirrors the backend `/platform-fees` payloads. */

export type FeeStanding = "GOOD" | "DUE" | "OVERDUE" | "SUSPENDED";

export interface FeeTerms {
  hotspotFeePercent: number;
  pppoeFeePerCustomer: number;
  dueDay: number;
  suspendDay: number;
}

export interface FeeAgreementBalance {
  agreementId: string;
  agreementCode: string;
  agreementName: string;
  tenantId: string;
  companyCode: string;
  companyName: string;
  investorId: string;
  investorCode: string;
  investorName: string;
  charged: number;
  paid: number;
  balance: number;
  oldestDueDate: string | null;
  suspendDate: string | null;
  feeStatus: FeeStanding;
  /** Who pays: the investor, or the company itself for the routers no investor holds. */
  kind?: "INVESTOR" | "COMPANY";
}

export interface FeeEntry {
  id: string;
  entryType: "CHARGE" | "PAYMENT" | "ADJUSTMENT";
  /** Positive adds to what is owed; negative (a payment) reduces it. */
  amount: number;
  period: string | null;
  dueDate: string | null;
  reference: string | null;
  method: string | null;
  notes: string | null;
  createdBy: string | null;
  createdAt: string;
}

export interface CompanyFeeStatus {
  companyCode: string;
  companyStatus: string | null;
  suspendedForFees: boolean;
  terms: FeeTerms;
  totalOutstanding: number;
  nextDueDate: string | null;
  nextSuspendDate: string | null;
  standing: FeeStanding;
  agreements: FeeAgreementBalance[];
}

export interface MyFeeAgreement {
  balance: FeeAgreementBalance;
  entries: FeeEntry[];
}

export interface RecordFeePaymentInput {
  agreementId: string;
  amount: number;
  reference: string;
  method?: string;
  notes?: string;
}

/** Where the fee is paid, as the paying side sees it. Null until the platform has chosen an account. */
export interface FeeReceivingAccount {
  accountType: "PAYBILL" | "TILL" | "BANK";
  shortCode: string;
  accountReference: string | null;
  /** False for a bank account: no M-Pesa prompt can be sent to it. */
  promptAvailable: boolean;
}

/** A payment account the platform could choose to be paid into (system administrator only). */
export interface FeeReceivingCandidate {
  paymentAccountId: string;
  accountType: "PAYBILL" | "TILL" | "BANK";
  shortCode: string;
  accountReference: string | null;
  companyCode: string;
  companyName: string;
  current: boolean;
}

/** One "Pay now" prompt. UNCONFIRMED: M-Pesa has not said either way; it is still being checked. */
export interface FeePromptStatus {
  id: string;
  agreementId: string;
  agreementCode: string;
  amount: number;
  phone: string;
  status: "PENDING" | "PAID" | "FAILED" | "UNCONFIRMED";
  message: string;
  receipt: string | null;
  createdAt: string;
}
