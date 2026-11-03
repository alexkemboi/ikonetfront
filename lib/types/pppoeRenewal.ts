/** `GET /api/v1/public/pppoe-renew/{accountNumber}`: what the "Renew my internet" page shows. */
export interface PppoeRenewalInfo {
  accountNumber: string;
  /** Masked, e.g. "S***** C." */
  customerName: string | null;
  companyName: string | null;
  packageName: string | null;
  price: number | null;
  /** RUNNING, EXPIRED, PAUSED or NO_PACKAGE */
  status: "RUNNING" | "EXPIRED" | "PAUSED" | "NO_PACKAGE";
  /** The day service stops (at midnight at its start); null while paused. */
  expiryDate: string | null;
  /** Masked registered phone, e.g. "07** *** 972" */
  phoneHint: string | null;
  /** Company paybill number; null when it has only a till (pay by prompt only). */
  paybill: string | null;
  canPayByPrompt: boolean;
}

export interface PppoeRenewalPrompt {
  paymentId: string;
  checkoutRequestId: string | null;
  status: string;
}

export interface PppoeRenewalPaymentStatus {
  id: string;
  status: "PENDING" | "COMPLETED" | "FAILED" | string;
  amount: number | null;
  mpesaReceipt: string | null;
}
