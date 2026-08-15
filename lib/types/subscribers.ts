export type SubscriberType = "HOTSPOT" | "PPPOE" | "BINDING";

export type OnlineStatus = "ONLINE" | "OFFLINE";

export interface SubscriberItem {
  id: string;
  code: string;
  fullName: string;
  phone: string;
  email?: string;
  type: SubscriberType;
  planName: string;
  planSpeed: string;
  planPrice: number;
  expiryText: string;
  expiryDate?: string;
  isExpiringToday?: boolean;
  status: OnlineStatus;
  nasName: string;
  isDeviceBinding?: boolean;
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
}

export interface OutageCompensationRequest {
  policy: "PAUSE" | "COMPENSATE";
  reason: string;
  routerId: number;
  durationMinutes?: number;
  creditKsh?: number;
}