"use server";

/**
 * actions/investorMessages.ts — the platform writing to investors.
 *
 *   sendInvestorMessage          one investor          POST /investors/{id}/messages  (SYSADMIN)
 *   sendCompanyInvestorsMessage  every investor linked to the selected company
 *                                                      POST /investors/messages       (SYSADMIN)
 *   getInvestorMessages          what one investor was sent  GET /investors/{id}/messages (SYSADMIN)
 *   getMyMessages                what the signed-in investor was sent  GET /investor/messages (bare list)
 */
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { buildApiUrl } from "@/lib/constants";
import { apiFetch } from "@/lib/apiClient";
import type { ApiResponse } from "@/lib/types/api";
import type { InvestorMessageInput, InvestorMessageResult, InvestorMessageSent } from "@/lib/types/investorMessages";

export async function sendInvestorMessage(
  investorId: string,
  input: InvestorMessageInput
): Promise<ApiResponse<InvestorMessageResult>> {
  const res = await apiFetch<InvestorMessageResult>(`/investors/${encodeURIComponent(investorId)}/messages`, {
    method: "POST",
    body: input,
    auth: "required",
    cache: "no-store",
  });
  if (res.success) revalidatePath(`/finance/investors/${investorId}`);
  return res;
}

export async function sendCompanyInvestorsMessage(input: InvestorMessageInput): Promise<ApiResponse<InvestorMessageResult>> {
  return apiFetch<InvestorMessageResult>("/investors/messages", {
    method: "POST",
    body: input,
    auth: "required",
    cache: "no-store",
  });
}

export async function getInvestorMessages(investorId: string): Promise<InvestorMessageSent[]> {
  const res = await apiFetch<InvestorMessageSent[]>(`/investors/${encodeURIComponent(investorId)}/messages`, {
    auth: "required",
    cache: "no-store",
  });
  return res.success && Array.isArray(res.data) ? res.data : [];
}

export async function getMyMessages(): Promise<InvestorMessageSent[]> {
  const session = await auth();
  const token = session?.user?.apiToken;
  if (!token) return [];
  try {
    const res = await fetch(buildApiUrl("/investor/messages"), {
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const json = res.ok ? await res.json().catch(() => null) : null;
    return Array.isArray(json) ? (json as InvestorMessageSent[]) : [];
  } catch {
    return [];
  }
}
