"use server";

/**
 * actions/platformFees.ts — system (maintenance) fees.
 *
 *   GET  /platform-fees/company-status            the caller's company: terms, amount due, dates, standing
 *   GET  /platform-fees/balances                  every agreement (SYSADMIN: all or the selected company; company admin: own)
 *   GET  /platform-fees/agreements/{id}/entries   charges and payments of one agreement
 *   GET  /platform-fees/mine                      the signed-in investor's own agreements
 *   POST /platform-fees/payments                  SYSADMIN records a payment
 *   GET  /platform-fees/receiving-account         where the fee is paid (paybill, till or bank account)
 *   GET  /platform-fees/receiving-account/candidates   SYSADMIN: accounts it could be paid into
 *   PUT  /platform-fees/receiving-account         SYSADMIN chooses the account
 *   POST /platform-fees/pay                       M-Pesa prompt: investor (own agreement) or company admin (company's own)
 *   GET  /platform-fees/pay/{id}                  how that prompt ended
 *   POST /platform-fees/reminders/run             SYSADMIN: queue today's SMS reminders now
 */
import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/apiClient";
import type {
  CompanyFeeStatus,
  FeeAgreementBalance,
  FeeEntry,
  FeePromptStatus,
  FeeReceivingAccount,
  FeeReceivingCandidate,
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

export async function getFeeReceivingAccount(): Promise<FeeReceivingAccount | null> {
  const res = await apiFetch<FeeReceivingAccount | null>("/platform-fees/receiving-account", {
    auth: "required",
    cache: "no-store",
  });
  return res.success && res.data ? res.data : null;
}

export async function getFeeReceivingCandidates(): Promise<FeeReceivingCandidate[]> {
  const res = await apiFetch<FeeReceivingCandidate[]>("/platform-fees/receiving-account/candidates", {
    auth: "required",
    cache: "no-store",
  });
  return res.success && Array.isArray(res.data) ? res.data : [];
}

export async function chooseFeeReceivingAccount(
  paymentAccountId: string
): Promise<{ success: boolean; message: string }> {
  const res = await apiFetch<FeeReceivingCandidate>("/platform-fees/receiving-account", {
    method: "PUT",
    auth: "required",
    body: { paymentAccountId },
  });
  if (!res.success) {
    return { success: false, message: res.message || "The receiving account could not be changed." };
  }
  revalidatePath("/finance/investors");
  return { success: true, message: res.message || "Receiving account set" };
}

/** Sends the prompt. The payment records itself when M-Pesa confirms it; poll {@link getFeePromptStatus}. */
export async function payFeeNow(input: {
  agreementId: string;
  phone: string;
  amount?: number;
}): Promise<{ success: boolean; message: string; prompt?: FeePromptStatus }> {
  // the server waits up to half a minute for M-Pesa before it answers
  const res = await apiFetch<FeePromptStatus>("/platform-fees/pay", {
    method: "POST",
    auth: "required",
    body: input,
    timeoutMs: 70_000,
  });
  if (!res.success || !res.data) {
    return { success: false, message: res.message || "The prompt could not be sent." };
  }
  return { success: true, message: res.data.message, prompt: res.data };
}

export async function getFeePromptStatus(id: string): Promise<FeePromptStatus | null> {
  const res = await apiFetch<FeePromptStatus>(`/platform-fees/pay/${encodeURIComponent(id)}`, {
    auth: "required",
    cache: "no-store",
  });
  return res.success && res.data ? res.data : null;
}

/** The same run as each morning's; a reminder already queued is not queued again. */
export async function runFeeReminders(): Promise<{ success: boolean; message: string }> {
  const res = await apiFetch<{ agreementsOwing: number; remindersQueued: number; withoutPhone: number }>(
    "/platform-fees/reminders/run",
    { method: "POST", auth: "required", timeoutMs: 60_000 }
  );
  if (!res.success || !res.data) {
    return { success: false, message: res.message || "The reminders could not be sent." };
  }
  const { agreementsOwing, remindersQueued, withoutPhone } = res.data;
  const missing = withoutPhone > 0 ? ` ${withoutPhone} payer(s) have no phone number on record.` : "";
  return {
    success: true,
    message:
      agreementsOwing === 0
        ? "No reminder is due today."
        : `${remindersQueued} new reminder(s) queued for ${agreementsOwing} agreement(s) with a reminder due today.${missing}`,
  };
}
