"use server";

/**
 * actions/platformFees.ts — system (maintenance) fees.
 *
 *   GET  /platform-fees/company-status            the caller's company: terms, amount due, dates, standing
 *   GET  /platform-fees/balances                  every agreement (SYSADMIN: all or the selected company; company admin: own)
 *   GET  /platform-fees/agreements/{id}/entries   charges and payments of one agreement
 *   GET  /platform-fees/mine                      the signed-in investor's own agreements
 *   POST /platform-fees/payments                  SYSADMIN records a payment
 */
import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/apiClient";
import type {
  CompanyFeeStatus,
  FeeAgreementBalance,
  FeeEntry,
  MyFeeAgreement,
  RecordFeePaymentInput,
} from "@/lib/types/platformFee";

/** Null when the caller may not see it or no company is selected: the caller simply shows nothing. */
export async function getCompanyFeeStatus(): Promise<CompanyFeeStatus | null> {
  const res = await apiFetch<CompanyFeeStatus>("/platform-fees/company-status", { auth: "required", cache: "no-store" });
  return res.success && res.data ? res.data : null;
}

export async function getFeeBalances(): Promise<FeeAgreementBalance[]> {
  const res = await apiFetch<FeeAgreementBalance[]>("/platform-fees/balances", { auth: "required", cache: "no-store" });
  return res.success && Array.isArray(res.data) ? res.data : [];
}

export async function getFeeEntries(agreementId: string): Promise<FeeEntry[]> {
  const res = await apiFetch<FeeEntry[]>(`/platform-fees/agreements/${encodeURIComponent(agreementId)}/entries`, {
    auth: "required",
    cache: "no-store",
  });
  return res.success && Array.isArray(res.data) ? res.data : [];
}

export async function getMyFees(): Promise<MyFeeAgreement[]> {
  const res = await apiFetch<MyFeeAgreement[]>("/platform-fees/mine", { auth: "required", cache: "no-store" });
  return res.success && Array.isArray(res.data) ? res.data : [];
}

export async function recordFeePayment(
  input: RecordFeePaymentInput
): Promise<{ success: boolean; message: string; balance?: FeeAgreementBalance }> {
  const res = await apiFetch<FeeAgreementBalance>("/platform-fees/payments", {
    method: "POST",
    auth: "required",
    body: input,
  });
  if (!res.success) {
    return { success: false, message: res.message || "The payment could not be recorded." };
  }
  revalidatePath("/finance/investors");
  return { success: true, message: res.message || "Payment recorded", balance: res.data ?? undefined };
}
