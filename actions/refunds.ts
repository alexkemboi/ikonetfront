"use server";

/**
 * actions/refunds.ts — refunds against payments.
 *
 *   GET  /finance/refunds                 refunds of the caller's company
 *   POST /finance/refunds                 raise a refund against one payment
 *   POST /finance/refunds/{id}/process    the money went back: post it to the ledger
 *
 * Nothing here sends money. Raising records the request; processing states that the
 * customer has been paid back (M-Pesa reversal or otherwise) and reduces income.
 */
import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/apiClient";
import type { RefundInput, RefundItem } from "@/lib/types/refund";

export async function listRefunds(): Promise<RefundItem[]> {
  const res = await apiFetch<RefundItem[]>("/finance/refunds", { auth: "required", cache: "no-store" });
  return res.success && Array.isArray(res.data) ? res.data : [];
}

export async function requestRefund(
  input: RefundInput
): Promise<{ success: boolean; message: string; refund?: RefundItem }> {
  const res = await apiFetch<RefundItem>("/finance/refunds", { method: "POST", auth: "required", body: input });
  if (!res.success) return { success: false, message: res.message || "The refund could not be recorded." };
  revalidatePath("/finance/billing/payments");
  return { success: true, message: res.message || "Refund recorded", refund: res.data ?? undefined };
}

export async function processRefund(
  refundId: string
): Promise<{ success: boolean; message: string; refund?: RefundItem }> {
  const res = await apiFetch<RefundItem>(`/finance/refunds/${encodeURIComponent(refundId)}/process`, {
    method: "POST",
    auth: "required",
  });
  if (!res.success) return { success: false, message: res.message || "The refund could not be processed." };
  revalidatePath("/finance/billing/payments");
  return { success: true, message: res.message || "Refund processed", refund: res.data ?? undefined };
}
