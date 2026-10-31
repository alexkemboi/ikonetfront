"use server";

/**
 * actions/investorPortfolio.ts — one investor's month.
 *
 *   getMyPortfolio        the signed-in investor (GET /investor/portfolio, bare object)
 *   getInvestorPortfolio  an administrator looking at one investor
 *                         (GET /investors/{id}/portfolio, ApiResponse envelope): a SYSADMIN
 *                         sees every company or the one selected, a company admin their own
 */
import { auth } from "@/lib/auth";
import { buildApiUrl } from "@/lib/constants";
import { apiFetch } from "@/lib/apiClient";
import type { InvestorPortfolio } from "@/lib/types/investorPortfolio";

export type PortfolioResult = { portfolio: InvestorPortfolio | null; message: string };

const PERIOD = /^\d{4}-(0[1-9]|1[0-2])$/;

export async function getMyPortfolio(period?: string): Promise<PortfolioResult> {
  const session = await auth();
  const token = session?.user?.apiToken;
  if (!token) return { portfolio: null, message: "Not signed in." };
  const qs = period && PERIOD.test(period) ? `?period=${period}` : "";
  try {
    const res = await fetch(buildApiUrl(`/investor/portfolio${qs}`), {
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      return { portfolio: null, message: (json as { message?: string } | null)?.message ?? `Could not load (${res.status})` };
    }
    return { portfolio: json as InvestorPortfolio, message: "" };
  } catch {
    return { portfolio: null, message: "The server could not be reached." };
  }
}

export async function getInvestorPortfolio(investorId: string, period?: string): Promise<PortfolioResult> {
  const qs = period && PERIOD.test(period) ? `?period=${period}` : "";
  const res = await apiFetch<InvestorPortfolio>(`/investors/${encodeURIComponent(investorId)}/portfolio${qs}`, {
    auth: "required",
    cache: "no-store",
  });
  return res.success && res.data
    ? { portfolio: res.data, message: "" }
    : { portfolio: null, message: res.message || "Could not load the investor." };
}
