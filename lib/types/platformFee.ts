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
