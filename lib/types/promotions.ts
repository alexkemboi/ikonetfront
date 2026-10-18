/** Promotional SMS. Backend: /api/v1/communications/promotions. */
export type PromotionStatus = "DRAFT" | "QUEUED" | "CANCELLED";

export type Promotion = {
  id: number;
  companyId: string;
  name: string;
  message: string;
  optOutLine: string | null;
  status: PromotionStatus;
  recipients: number | null;
  createdBy: string | null;
  createdAt: string;
  queuedBy: string | null;
  queuedAt: string | null;
  cancelledBy: string | null;
  cancelledAt: string | null;
  /** messages waiting or being sent */
  queued: number;
  sent: number;
  failed: number;
  expired: number;
  cancelled: number;
};

export type PromotionPreview = {
  recipients: number;
  optedOut: number;
  optOutLine: string | null;
  fullText: string;
  characters: number;
  smsPerRecipient: number;
  totalSms: number;
  costPerSms: number | null;
  estimatedCost: number | null;
  promotionsPerDay: number | null;
  daysNeeded: number | null;
  sendingHours: string;
  smsEnabled: boolean;
  /** why sending would not work as expected; null when fine */
  problem: string | null;
};

export type OptOutChannel = "CALL" | "WHATSAPP" | "IN_PERSON" | "OTHER";

export type PromotionOptOut = {
  id: number;
  phone: string;
  channel: OptOutChannel;
  note: string | null;
  createdBy: string | null;
  createdAt: string;
};
