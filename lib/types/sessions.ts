export type SessionProtocol = "PPPoE" | "Hotspot" | "TV_MAB";

export interface LiveSessionItem {
  id: string;
  subscriberCode: string;
  subscriberName: string;
  protocol: SessionProtocol;
  deviceMac: string;
  assignedIp: string;
  routerName: string;
  routerManagementIp: string;
  downloadBytes: string | null;
  uploadBytes: string | null;
  countersAvailable: boolean;
  onlineDurationFormatted: string;
  connectedAt: string | null;
  expiryDate: string | null;
  expiresAt: string | null;
  expiryFormatted: string;
  sessionId: number | null;
  phone: string | null;
  packageName: string | null;
  voucherCode: string | null;
  mpesaReceipt: string | null;
  amountPaid: string | null;
  nasIp: string | null;
  minutesRemaining: number | null;
  online: boolean;
  lastSeenAt: string | null;
}

export interface LiveSessionKpis {
  currentlyConnected: number;
  pppoeCount: number;
  hotspotCount: number;
  tvCount: number;
  paidNotConnected: number;
  lostContact: number;
  sessionsWithoutCounters: number;
  downloadBytesTotal: string;
  uploadBytesTotal: string;
  totalBytesTotal: string;
}

export interface LiveSessionsPage {
  content: LiveSessionItem[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface LiveSessionsResult {
  success: boolean;
  status?: number;
  requestId?: string;
  message?: string;
  kpis: LiveSessionKpis | null;
  sessions: LiveSessionsPage | null;
  refreshIntervalSeconds: number;
}
