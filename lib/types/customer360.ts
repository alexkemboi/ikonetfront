import type { Ticket } from "@/lib/types/ticket";

export interface LiveSpeedGauge {
  online: boolean;
  interfaceName: string | null;
  downloadMbps: number;
  uploadMbps: number;
  downloadBps: number;
  uploadBps: number;
  routerName: string | null;
  sampledAt: string | null;
}

export interface ActivityHeatmapPoint {
  date: string;
  uploadBytes: number;
  downloadBytes: number;
  totalBytes: number;
  activityLevel: number;
}

export interface PeakHourDensity {
  /** ISO day of week: 1 = Monday … 7 = Sunday (POSTGRES ISODOW). */
  dayOfWeek: number;
  hourOfDay: number;
  totalBytes: number;
  sessionCount: number;
  /** 0–4 tier against the busiest cell. */
  intensity: number;
}

export interface CustomerNote {
  id: number;
  customerIdxno: number;
  authorUsername: string;
  note: string;
  createdAt: string;
}

export interface PaymentHistoryItem {
  id: string;
  mpesaReceipt: string | null;
  phoneNumber: string | null;
  amount: number;
  status: string | null;
  createdAt: string;
}

export interface SmsHistoryItem {
  id: number;
  phoneNumber: string | null;
  direction: string;
  templateCode: string | null;
  content: string | null;
  status: string;
  sentAt: string;
}

export type TicketSummaryItem = Ticket;

export interface PppoeAccountSummary {
  id: string;
  username: string;
  routerIp: string | null;
  networkDeviceId: number | null;
  status: string | null;
  isActive: boolean | null;
}

export interface PppoeSubscriptionSummary {
  id: string;
  packageId: string | null;
  packageName: string | null;
  status: string | null;
  startDate: string | null;
  expiryDate: string | null;
  isActive: boolean | null;
}

export interface CustomerPppoeOverview {
  accounts: PppoeAccountSummary[];
  subscriptions: PppoeSubscriptionSummary[];
}

/**
 * Maps the backend ISO dayOfWeek (1 = Monday … 7 = Sunday) into the 0-indexed
 * grid used by the peak-hour heatmap row headers (Mon → first row).
 */
export function isoDayOfWeekToGridIndex(isoDay: number): number {
  return ((isoDay - 1) % 7 + 7) % 7;
}

/**
 * Client-side 0–4 activity tier fallback used when a heatmap row arrives
 * without a server-computed activityLevel (mirrors the backend thresholds).
 */
export function activityTierForBytes(totalBytes: number): number {
  if (!Number.isFinite(totalBytes) || totalBytes <= 0) return 0;
  if (totalBytes <= 1_000_000_000) return 1;
  if (totalBytes <= 5_000_000_000) return 2;
  if (totalBytes <= 10_000_000_000) return 3;
  return 4;
}

/** The five-level heatmap color ladder, bound to the tenant brand primary. */
export function heatmapCellColor(level: number): string {
  switch (level) {
    case 1:
      return "hsl(var(--primary) / 0.25)";
    case 2:
      return "hsl(var(--primary) / 0.5)";
    case 3:
      return "hsl(var(--primary) / 0.75)";
    case 4:
      return "hsl(var(--primary))";
    default:
      return "#27272a";
  }
}