/** `/api/v1/subscriber-time/hotspot-sessions/...` — a hotspot session after add time, pause or resume. */
export interface HotspotSessionTime {
  sessionId: number;
  voucherCode: string | null;
  phone: string | null;
  packageName: string | null;
  status: "ACTIVE" | "PAUSED" | string;
  /** When the session ends, UTC; null while paused. */
  expiresAt: string | null;
  /** Time left that is given back on resume; null unless paused. */
  pausedRemainingSeconds: number | null;
  pausedAt: string | null;
  pausesUsed: number;
  /** 0 = this package cannot be paused (one day or shorter). */
  pausesAllowed: number;
}

/** `/api/v1/subscriber-time/pppoe-subscriptions/...` */
export interface PppoeSubscriptionTime {
  subscriptionId: string;
  username: string | null;
  status: string;
  paused: boolean;
  expiryDate: string | null;
  pausedRemainingDays: number | null;
  pausesUsed: number;
  pausesAllowed: number;
}

export type ActionResult<T> = { success: true; data: T; message: string } | { success: false; message: string };
