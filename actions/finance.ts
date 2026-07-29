"use server";

import { auth } from "@/lib/auth";
import { BASE_URL } from "@/lib/constants";

async function getAuthHeaders(): Promise<Record<string, string>> {
  const session = await auth();
  if (!session?.user?.apiToken) {
    throw new Error("Unauthorized: No active backend session.");
  }
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session.user.apiToken}`,
  };
}

export async function getRevenueOverview() {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${BASE_URL}finance/revenue`, {
      headers,
      next: { tags: ["finance"] },
    });
    if (!res.ok) throw new Error(`Revenue fetch failed: ${res.statusText}`);
    return await res.json();
  } catch (error) {
    console.error("[Finance Action] getRevenueOverview error:", error);
    return { success: false, data: null };
  }
}

export async function getRecentTransactions(limit = 10) {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${BASE_URL}finance/transactions?limit=${limit}`, {
      headers,
      next: { tags: ["finance"] },
    });
    if (!res.ok) throw new Error(`Transactions fetch failed: ${res.statusText}`);
    return await res.json();
  } catch (error) {
    console.error("[Finance Action] getRecentTransactions error:", error);
    return { success: false, data: [] };
  }
}