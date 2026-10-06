"use server";

/**
 * actions/investorRegistry.ts — setting an investor up.
 *
 * Backend: InvestorRegistryController, `/api/v1/investors/**` (ApiResponse envelope).
 *   register         SYSADMIN (belongs to the platform; no company needed)
 *   company link,
 *   agreements,
 *   charge rules     SYSADMIN, inside a selected company
 *   router ownership SYSADMIN or company admin, inside one company
 *
 * The investor's own read-only screens use actions/investor.ts.
 */
import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/apiClient";
import type { ApiResponse } from "@/lib/types/api";
import type {
  AgreementInput,
  BillingRunResult,
  InvestorAgreementDetail,
  InvestorDetail,
  InvestorInput,
  InvestorRule,
  InvestorSummary,
  RouterAssignment,
} from "@/lib/types/investor";

const PAGE = "/finance/investors";

async function write<T>(path: string, method: "POST" | "PUT" | "DELETE", body?: unknown): Promise<ApiResponse<T>> {
  const res = await apiFetch<T>(path, { method, body, auth: "required", cache: "no-store" });
  if (res.success) revalidatePath(PAGE);
  return res;
}

export async function listInvestors(): Promise<InvestorSummary[]> {
  const res = await apiFetch<InvestorSummary[]>("/investors", { auth: "required", cache: "no-store" });
  return res.success && Array.isArray(res.data) ? res.data : [];
}

export async function getInvestor(investorId: string): Promise<ApiResponse<InvestorDetail>> {
  return apiFetch<InvestorDetail>(`/investors/${encodeURIComponent(investorId)}`, {
    auth: "required",
    cache: "no-store",
  });
}

export async function createInvestorAction(input: InvestorInput): Promise<ApiResponse<InvestorDetail>> {
  return write<InvestorDetail>("/investors", "POST", input);
}

export async function updateInvestorAction(
  investorId: string,
  input: InvestorInput
): Promise<ApiResponse<InvestorDetail>> {
  return write<InvestorDetail>(`/investors/${encodeURIComponent(investorId)}`, "PUT", input);
}

/** Links the investor to the selected company (the backend takes the company from the context). */
export async function linkInvestorCompanyAction(investorId: string): Promise<ApiResponse<InvestorDetail>> {
  return write<InvestorDetail>(`/investors/${encodeURIComponent(investorId)}/companies`, "POST", {});
}

export async function unlinkInvestorCompanyAction(
  investorId: string,
  companyCode: string
): Promise<ApiResponse<InvestorDetail>> {
  return write<InvestorDetail>(
    `/investors/${encodeURIComponent(investorId)}/companies/${encodeURIComponent(companyCode)}`,
    "DELETE"
  );
}

/** Creates an agreement in the selected company; the investor is linked to it if not yet. */
export async function createAgreementAction(
  investorId: string,
  input: AgreementInput
): Promise<ApiResponse<InvestorAgreementDetail>> {
  return write<InvestorAgreementDetail>(`/investors/${encodeURIComponent(investorId)}/agreements`, "POST", input);
}

export async function endAgreementAction(
  agreementId: string,
  effectiveEndDate?: string
): Promise<ApiResponse<InvestorAgreementDetail>> {
  return write<InvestorAgreementDetail>(`/investors/agreements/${encodeURIComponent(agreementId)}`, "PUT", {
    status: "TERMINATED",
    ...(effectiveEndDate ? { effectiveEndDate } : {}),
  });
}

export async function replaceAgreementRulesAction(
  agreementId: string,
  rules: InvestorRule[]
): Promise<ApiResponse<InvestorAgreementDetail>> {
  return write<InvestorAgreementDetail>(`/investors/agreements/${encodeURIComponent(agreementId)}/rules`, "PUT", {
    rules: rules.map(({ serviceType, calculationBasis, rateValue }) => ({ serviceType, calculationBasis, rateValue })),
  });
}

export async function listRouterAssignments(params: {
  routerId?: number;
  investorId?: string;
  currentOnly?: boolean;
} = {}): Promise<RouterAssignment[]> {
  const qs = new URLSearchParams();
  if (params.routerId !== undefined) qs.set("routerId", String(params.routerId));
  if (params.investorId) qs.set("investorId", params.investorId);
  if (params.currentOnly) qs.set("currentOnly", "true");
  const res = await apiFetch<RouterAssignment[]>(`/investors/router-assignments?${qs.toString()}`, {
    auth: "required",
    cache: "no-store",
  });
  return res.success && Array.isArray(res.data) ? res.data : [];
}

/** `startDate` is a local date-time (`2026-10-01T00:00:00`); left out, ownership starts now. */
export async function assignRouterAction(input: {
  routerId: number;
  agreementId: string;
  startDate?: string;
  notes?: string;
}): Promise<ApiResponse<RouterAssignment>> {
  return write<RouterAssignment>("/investors/router-assignments", "POST", input);
}

export async function endRouterAssignmentAction(
  assignmentId: string,
  endDate?: string
): Promise<ApiResponse<RouterAssignment>> {
  return write<RouterAssignment>(
    `/investors/router-assignments/${encodeURIComponent(assignmentId)}/end`,
    "POST",
    endDate ? { endDate } : {}
  );
}

/** Month-end statements of the selected company for a month that has ended (`YYYY-MM`). */
export async function runInvestorBillingAction(period: string): Promise<ApiResponse<BillingRunResult>> {
  return write<BillingRunResult>("/investors/billing/run", "POST", { period });
}
