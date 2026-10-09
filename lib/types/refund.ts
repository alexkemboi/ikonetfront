/** Refunds raised against hotspot (incl. TV) and PPPoE payments — `/finance/refunds`. */

export type RefundStatus = "PENDING" | "APPROVED" | "PROCESSED";

export interface RefundItem {
  id: string;
  paymentType: "HOTSPOT" | "PPPOE" | null;
  paymentId: string | null;
  serviceType: "HOTSPOT" | "TV" | "PPPOE" | null;
  routerId: number | null;
  customerId: string | null;
  amount: number;
  reason: string;
  status: RefundStatus;
  companyId: string | null;
  requestedBy: string | null;
  processedBy: string | null;
  createdAt: string;
  processedAt: string | null;
}

export interface RefundInput {
  paymentType: "HOTSPOT" | "PPPOE";
  paymentId: string;
  amount: number;
  reason: string;
}
