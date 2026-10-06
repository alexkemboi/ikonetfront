/**
 * lib/types/investor.ts — DTOs mirrored from the live OpenAPI export
 * (`api-docs.json`, `investor-controller`, lines ~12043–12204).
 *
 * Contract notes:
 * - All three investor reads return BARE payloads — `InvestorRevenueSummaryResponse`
 *   and plain arrays for snapshots/agreements. There is NO `ApiResponse<T>` envelope,
 *   so these reads are deliberately OUT of the pact catalog (inclusion rule §1.3)
 *   and served over the whitelisted raw-fetch path, exactly like `/finance/coa*`.
 * - Spec declares no `security` block (public); runtime SecurityConfig enforces
 *   bearer (probe-verified during the 2026-09-02 audit) — actions attach the
 *   session token, matching the `investor/*` probe-override.
 */
import type { ApiResponse } from "@/lib/types/api";

/** One router's attributed revenue inside the revenue summary (api-docs.json `RouterAttributionItem`). */
export interface RouterAttributionItem {
  routerId: string;
  routerName: string;
  stationName: string;
  hotspotRevenue: number;
  pppoeSubscribers: number;
  totalAttributedRevenue: number;
}

/** `InvestorRevenueSummaryResponse` — bare object, no envelope. */
export interface InvestorRevenueSummary {
  /** Present only for an investor-scoped read; null for company/platform scope. */
  investorId: string | null;
  /** Effective company scope; null for a platform-wide read. */
  companyId: string | null;
  periodYearMonth: string;
  totalGrossRevenue: number;
  hotspotGrossRevenue: number;
  hotspotMaintenanceFee: number;
  activePppoeSubscribers: number;
  pppoeMaintenanceFee: number;
  totalMaintenanceDue: number;
  netInvestorPayout: number;
  routerBreakdown: RouterAttributionItem[];
}

/** `InvestorBillingSnapshot` — one FINALIZED/PAID monthly bill for the investor. */
export interface InvestorBillingSnapshot {
  id: string;
  snapshotNumber: string;
  companyId: string;
  investorId: string;
  periodYearMonth: string;
  hotspotGrossRevenue: number;
  hotspotMaintenanceFee: number;
  activePppoeSubscribers: number;
  pppoeMaintenanceFee: number;
  totalMaintenanceDue: number;
  status: "DRAFT" | "FINALIZED" | "PAID";
  finalizedAt: string | null;
  createdAt: string;
}

/** `InvestorAgreement` — revenue-share agreement. */
export interface InvestorAgreement {
  id: string;
  agreementCode: string;
  companyId: string;
  investorId: string;
  name: string;
  effectiveStartDate: string;
  effectiveEndDate: string | null;
  status: "ACTIVE" | "TERMINATED";
  createdAt: string;
}

/** Latest telemetry snapshot attached to a router (`RouterHealthSnapshot`). */
export interface RouterHealthSnapshot {
  idxno: number;
  routerId: number;
  cpuUsage: number;
  totalMemory: number;
  freeMemory: number;
  temperature: number | null;
  activePppoeSessions: number;
  activeHotspotSessions: number;
  uptime: string;
  latencyMs: number;
  createdAt: string;
}

/**
 * Read-only router inventory row (`InvestorRouterListItem`) — strictly no
 * provisioning/management actions are exposed to investor scope.
 */
export interface InvestorRouterListItem {
  routerId: number;
  routerName: string | null;
  model: string | null;
  ipAddress: string | null;
  stationName: string | null;
  status: boolean | null;
  lastOnline: string | null;
  uptime: string | null;
  snapshotTraits: RouterHealthSnapshot | null;
}

/** Request shape accepted by `getInvestorMoneyFlowData`. */
export interface InvestorPeriodInput {
  /** `YYYY-MM`; defaults to the current calendar month. */
  period?: string;
  /** Optional SYSADMIN-only scope filters. */
  companyId?: string;
  investorId?: string;
}

/** Aggregated, availability-flagged result returned to the investor page. */
export interface InvestorMoneyFlowData {
  period: string;
  revenue: InvestorRevenueSummary | null;
  revenueMessage: string;
  snapshots: InvestorBillingSnapshot[];
  snapshotsMessage: string;
  agreements: InvestorAgreement[];
  agreementsMessage: string;
  /**
   * True only for SYSADMIN: `/agreements` and `/billing-snapshots` are
   * platform-admin-only (RB-5 / D-35), so a Network Partner (role 04) must not
   * fetch or render those sections.
   */
  billingDetailsVisible: boolean;
  /** True when every endpoint returned a usable payload. */
  allAvailable: boolean;
  /** True when any endpoint responded; used with the individual messages otherwise. */
  anyAvailable: boolean;
}

/** Per-section envelope helper for callers that prefer an ApiResponse-shaped contract. */
export function investorSectionError<T>(message: string): ApiResponse<T> {
  return {
    status: 502,
    success: false,
    message,
    data: null,
    timestamp: new Date().toISOString(),
  };
}

/** An investor party offered when creating or linking a Network Partner account. */
export interface InvestorOption {
  investorId: string;
  /** "Name (code)" of the party's agreements; empty when it only owns routers. */
  agreements: string[];
  /** Accounts already linked to this party. */
  usernames: string[];
}
