export type SubscriberType = "HOTSPOT" | "PPPOE" | "TV_BUNDLED";
export type SubscriberAccountStatus = "ACTIVE" | "GRACE" | "EXPIRED" | "SUSPENDED";

export interface SubscriberItem {
  id: string;
  code: string;
  fullName: string;
  phone: string;
  email?: string;
  type: SubscriberType;
  planName: string;
  planSpeed: string;
  planPrice: string | null;
  expiryText: string;
  expiryDate?: string;
  isExpiringToday?: boolean;
  status: SubscriberAccountStatus;
  isOnline: boolean;
  lastSeenAt: string | null;
  activeSessionId: string | null;
  nasName: string;
  deviceType?: string;
  macAddress?: string;
  ipAddress?: string;
}

export interface SubscriberKpis {
  allUsersCount: number;
  expiringIn7DaysCount: number;
  newThisWeekCount: number;
  onlineCount: number;
  onlinePercentage: number;
  atRiskCount: number;
  statusCounts: Record<SubscriberAccountStatus, number>;
}

export interface SubscriberRowsPage {
  content: SubscriberItem[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface SubscriberHubResult {
  success: boolean;
  message?: string;
  requestId?: string;
  kpis: SubscriberKpis | null;
  rows: SubscriberRowsPage | null;
}

export interface OutageCompensationRequest {
  policy: "PAUSE" | "COMPENSATE";
  reason: string;
  routerId: number;
  durationMinutes?: number;
  creditKsh?: number;
}
