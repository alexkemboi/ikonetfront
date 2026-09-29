"use server";

/**
 * actions/investor.ts — investor money-flow reads (SPEC/LIVE, bare payloads).
 *
 * Endpoint source of truth: `api-docs.json` (investor-controller):
 *   GET /investor/revenue?investorId=&period=        → InvestorRevenueSummaryResponse (bare)
 *   GET /investor/billing-snapshots?investorId=       → InvestorBillingSnapshot[] (bare array)
 *   GET /investor/agreements?investorId=              → InvestorAgreement[] (bare array)
 *
 * Deliberately served over the whitelisted RAW fetch path (no ApiResponse
 * envelope) — identical to `/finance/coa*`. `apiFetch`'s envelope parser would
 * null-out these bare payloads, so it is NOT used here.
 *
 * Auth: spec has no security block; runtime SecurityConfig enforces bearer
 * (probe-verified). We attach the session token — `investor/*` probe-override.
 */
import { withCompanyContext } from "@/lib/companyContext";
import { auth } from "@/lib/auth";
import { buildApiUrl } from "@/lib/constants";
import type {
  InvestorAgreement,
  InvestorBillingSnapshot,
  InvestorMoneyFlowData,
  InvestorRevenueSummary,
  InvestorRouterListItem,
} from "@/lib/types/investor";

/** Tolerant auth headers — {} when unauthenticated (mirrors actions/finance.ts). */
async function getAuthHeaders(): Promise<Record<string, string>> {
  const session = await auth();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (session?.user?.apiToken) {
    headers.Authorization = `Bearer ${session.user.apiToken}`;
  }
  // Forward the SYSADMIN-selected company so the backend scopes the call.
  return withCompanyContext(headers as Record<string, string>);
}

/**
 * Defensive unwrap: bare payloads pass through untouched; if the backend ever
 * wraps a body in `{ data: ... }` this still unwraps it (mirrors finance.ts).
 */
function unwrapData<T>(json: unknown): T | null {
  if (typeof json === "object" && json !== null && "data" in json) {
    return (json as { data?: T }).data ?? null;
  }
  return json as T;
}

function defaultPeriod(): string {
  const year = new Date().getFullYear();
  const month = new Date().getMonth() + 1;
  return `${year}-${String(month).padStart(2, "0")}`;
}

async function getRevenueSummary(
  period: string,
  headers: Record<string, string>
): Promise<{ revenue: InvestorRevenueSummary | null; message: string }> {
  try {
    const qs = new URLSearchParams({ period });
    const res = await fetch(buildApiUrl(`/investor/revenue?${qs.toString()}`), {
      headers,
      cache: "no-store",
    });
    if (!res.ok) {
      return { revenue: null, message: `Revenue summary unavailable (HTTP ${res.status}).` };
    }
    const raw = unwrapData<InvestorRevenueSummary>(await res.json());
    if (typeof raw !== "object" || raw === null || typeof raw.netInvestorPayout !== "number") {
      return { revenue: null, message: "Revenue summary returned an unexpected shape." };
    }
    return { revenue: raw, message: "" };
  } catch (error) {
    console.error("[Investor] getRevenueSummary error:", error);
    return { revenue: null, message: "Failed to reach the revenue endpoint." };
  }
}

async function getBillingSnapshots(
  headers: Record<string, string>
): Promise<{ snapshots: InvestorBillingSnapshot[]; message: string }> {
  try {
    const res = await fetch(buildApiUrl("/investor/billing-snapshots"), {
      headers,
      cache: "no-store",
    });
    if (!res.ok) {
      return { snapshots: [], message: `Billing snapshots unavailable (HTTP ${res.status}).` };
    }
    const raw = unwrapData<InvestorBillingSnapshot[]>(await res.json());
    if (!Array.isArray(raw)) {
      return { snapshots: [], message: "Billing snapshots returned an unexpected shape." };
    }
    return { snapshots: raw, message: "" };
  } catch (error) {
    console.error("[Investor] getBillingSnapshots error:", error);
    return { snapshots: [], message: "Failed to reach the billing snapshots endpoint." };
  }
}

async function getAgreements(
  headers: Record<string, string>
): Promise<{ agreements: InvestorAgreement[]; message: string }> {
  try {
    const res = await fetch(buildApiUrl("/investor/agreements"), {
      headers,
      cache: "no-store",
    });
    if (!res.ok) {
      return { agreements: [], message: `Agreements unavailable (HTTP ${res.status}).` };
    }
    const raw = unwrapData<InvestorAgreement[]>(await res.json());
    if (!Array.isArray(raw)) {
      return { agreements: [], message: "Agreements returned an unexpected shape." };
    }
    return { agreements: raw, message: "" };
  } catch (error) {
    console.error("[Investor] getAgreements error:", error);
    return { agreements: [], message: "Failed to reach the agreements endpoint." };
  }
}

/**
 * Aggregate money-flow data for the investor portal. Bare-payload reads are
 * individually tolerant: one failing endpoint degrades that section with an
 * explicit message, never a fabricated figure.
 */
export async function getInvestorMoneyFlowData(
  input: { period?: string } = {}
): Promise<InvestorMoneyFlowData> {
  const period = input.period && /^\d{4}-(0[1-9]|1[0-2])$/.test(input.period)
    ? input.period
    : defaultPeriod();
  const headers = await getAuthHeaders();

  const [{ revenue, message: revenueMessage }, { snapshots, message: snapshotsMessage }, { agreements, message: agreementsMessage }] =
    await Promise.all([
      getRevenueSummary(period, headers),
      getBillingSnapshots(headers),
      getAgreements(headers),
    ]);

  const anyAvailable = revenue !== null || snapshots.length > 0 || agreements.length > 0;

  return {
    period,
    revenue,
    revenueMessage,
    snapshots,
    snapshotsMessage,
    agreements,
    agreementsMessage,
    allAvailable: revenue !== null && snapshots.length > 0 && agreements.length > 0,
    anyAvailable,
  };
}

/**
 * Read-only router inventory for the investor scope — `GET /investor/routers`
 * (bare array). Strictly view-only: no provisioning/management actions exposed.
 */
export async function getInvestorRouters(): Promise<{
  routers: InvestorRouterListItem[];
  message: string;
}> {
  const headers = await getAuthHeaders();
  try {
    const res = await fetch(buildApiUrl("/investor/routers"), {
      headers,
      cache: "no-store",
    });
    if (!res.ok) {
      return { routers: [], message: `Investor routers unavailable (HTTP ${res.status}).` };
    }
    const raw = unwrapData<InvestorRouterListItem[]>(await res.json());
    if (!Array.isArray(raw)) {
      return { routers: [], message: "Investor routers returned an unexpected shape." };
    }
    return { routers: raw, message: "" };
  } catch (error) {
    console.error("[Investor] getInvestorRouters error:", error);
    return { routers: [], message: "Failed to reach the investor routers endpoint." };
  }
}