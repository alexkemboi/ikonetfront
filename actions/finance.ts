"use server";

import { revalidateTag } from "next/cache";
import { auth } from "@/lib/auth";
import { BASE_URL } from "@/lib/constants";
import type { ApiResponse } from "@/lib/types/auth";
import type {
  AccountBalanceProjection,
  AccountPosting,
  ChartOfAccountNode,
  Expense,
  ExpenseCategory,
  ExpenseRequest,
  ExpenseSummary,
  ProfitAndLossSummary,
  SpringPage,
  Statement,
  StatementRequest,
  TrialBalanceResponse,
} from "@/lib/types/finance";
import { EMPTY_PAGE } from "@/lib/types/finance";

// ── Tolerant auth headers (returns {} when no token) ──────────────────────────

async function getAuthHeaders(): Promise<Record<string, string>> {
  const session = await auth();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (session?.user?.apiToken) {
    headers["Authorization"] = `Bearer ${session.user.apiToken}`;
  }
  return headers;
}

// ── Finance response helper (mirrors customer.ts handleApiResponse + 204 skip) ──

async function handleFinanceResponse<T>(
  response: Response,
  defaultMessage: string
): Promise<ApiResponse<T>> {
  if (response.status === 204) {
    return { status: 204, success: true, message: "Deleted", data: null };
  }

  const contentType = response.headers.get("content-type");
  let body: unknown;

  if (contentType?.includes("application/json")) {
    body = await response.json();
  } else {
    body = await response.text();
  }

  if (response.ok) {
    if (typeof body === "object" && body !== null && "success" in body) {
      return body as ApiResponse<T>;
    }
    return {
      status: response.status,
      success: true,
      message: "Success",
      data: body as T,
      timestamp: new Date().toISOString(),
    };
  }

  const message =
    typeof body === "string"
      ? body
      : (body as { message?: string })?.message || defaultMessage;

  return {
    status: response.status,
    success: false,
    message,
    data: null,
    timestamp: new Date().toISOString(),
  };
}

// ── Legacy: preserve exactly ──────────────────────────────────────────────────

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

// ── New read actions ──────────────────────────────────────────────────────────

export async function getChartOfAccountsTree(): Promise<ApiResponse<ChartOfAccountNode[]>> {
  try {
    const res = await fetch(`${BASE_URL}finance/coa`, {
      headers: await getAuthHeaders(),
      next: { tags: ["coa-tree"], revalidate: 60 },
    });
    if (!res.ok) return handleFinanceResponse(res, "Failed to fetch chart of accounts");
    return res.json();
  } catch (error) {
    console.error("[Finance] getChartOfAccountsTree error:", error);
    return {
      status: 500,
      success: false,
      message: error instanceof Error ? error.message : String(error),
      data: null,
      timestamp: new Date().toISOString(),
    };
  }
}

export async function getAccountBalances(): Promise<ApiResponse<AccountBalanceProjection[]>> {
  try {
    const res = await fetch(`${BASE_URL}finance/coa/balance`, {
      headers: await getAuthHeaders(),
      next: { tags: ["coa-balances"], revalidate: 30 },
    });
    if (!res.ok) return handleFinanceResponse(res, "Failed to fetch account balances");
    return res.json();
  } catch (error) {
    console.error("[Finance] getAccountBalances error:", error);
    return {
      status: 500,
      success: false,
      message: error instanceof Error ? error.message : String(error),
      data: null,
      timestamp: new Date().toISOString(),
    };
  }
}

export async function getTrialBalance(): Promise<ApiResponse<TrialBalanceResponse>> {
  try {
    const res = await fetch(`${BASE_URL}finance/coa/trial-balance`, {
      headers: await getAuthHeaders(),
      cache: "no-store",
    });
    if (!res.ok) return handleFinanceResponse(res, "Failed to fetch trial balance");
    return res.json();
  } catch (error) {
    console.error("[Finance] getTrialBalance error:", error);
    return {
      status: 500,
      success: false,
      message: error instanceof Error ? error.message : String(error),
      data: null,
      timestamp: new Date().toISOString(),
    };
  }
}

export type LedgerParams = {
  accountCode?: string;
  page?: number;
  size?: number;
  fromDate?: string;
  toDate?: string;
};

export async function getLedgerPostings(
  params: LedgerParams = {}
): Promise<ApiResponse<SpringPage<AccountPosting>>> {
  try {
    const qs = new URLSearchParams();
    qs.append("page", (params.page ?? 0).toString());
    qs.append("size", (params.size ?? 20).toString());
    qs.append("sort", "occurredAt,desc");
    if (params.accountCode) qs.append("accountCode", params.accountCode);
    if (params.fromDate) qs.append("fromDate", params.fromDate);
    if (params.toDate) qs.append("toDate", params.toDate);

    const res = await fetch(`${BASE_URL}finance/coa/postings?${qs.toString()}`, {
      headers: await getAuthHeaders(),
      cache: "no-store",
    });
    if (!res.ok) return handleFinanceResponse(res, "Failed to fetch ledger postings");
    return res.json();
  } catch (error) {
    console.error("[Finance] getLedgerPostings error:", error);
    return {
      status: 500,
      success: false,
      message: error instanceof Error ? error.message : String(error),
      data: EMPTY_PAGE(params.size ?? 20),
      timestamp: new Date().toISOString(),
    };
  }
}

export type ExpenseParams = {
  startDate?: string;
  endDate?: string;
  category?: ExpenseCategory;
  page?: number;
  size?: number;
};

export async function getExpenses(
  params: ExpenseParams = {}
): Promise<ApiResponse<SpringPage<Expense>>> {
  try {
    const today = new Date();
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const qs = new URLSearchParams();
    qs.append("page", (params.page ?? 0).toString());
    qs.append("size", (params.size ?? 20).toString());
    qs.append("startDate", params.startDate || firstOfMonth.toISOString().slice(0, 10));
    qs.append("endDate", params.endDate || today.toISOString().slice(0, 10));
    if (params.category) qs.append("category", params.category);

    const res = await fetch(`${BASE_URL}expenses?${qs.toString()}`, {
      headers: await getAuthHeaders(),
      next: { tags: ["expenses"], revalidate: 15 },
    });
    if (!res.ok) return handleFinanceResponse(res, "Failed to fetch expenses");
    return res.json();
  } catch (error) {
    console.error("[Finance] getExpenses error:", error);
    return {
      status: 500,
      success: false,
      message: error instanceof Error ? error.message : String(error),
      data: EMPTY_PAGE(params.size ?? 20),
      timestamp: new Date().toISOString(),
    };
  }
}

export async function getExpenseSummary(
  startDate?: string,
  endDate?: string
): Promise<ApiResponse<ExpenseSummary>> {
  try {
    const today = new Date();
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const qs = new URLSearchParams();
    qs.append("startDate", startDate || firstOfMonth.toISOString().slice(0, 10));
    qs.append("endDate", endDate || today.toISOString().slice(0, 10));

    const res = await fetch(`${BASE_URL}expenses/summary?${qs.toString()}`, {
      headers: await getAuthHeaders(),
      next: { tags: ["expenses"], revalidate: 30 },
    });
    if (!res.ok) return handleFinanceResponse(res, "Failed to fetch expense summary");
    return res.json();
  } catch (error) {
    console.error("[Finance] getExpenseSummary error:", error);
    return {
      status: 500,
      success: false,
      message: error instanceof Error ? error.message : String(error),
      data: null,
      timestamp: new Date().toISOString(),
    };
  }
}

export async function getCustomerStatements(
  customerId: number,
  page: number = 0,
  size: number = 20
): Promise<ApiResponse<SpringPage<Statement>>> {
  try {
    const qs = new URLSearchParams();
    qs.append("page", page.toString());
    qs.append("size", size.toString());

    const res = await fetch(
      `${BASE_URL}statements/customer/${customerId}?${qs.toString()}`,
      {
        headers: await getAuthHeaders(),
        next: { tags: ["statements"], revalidate: 30 },
      }
    );
    if (!res.ok) return handleFinanceResponse(res, "Failed to fetch statements");
    return res.json();
  } catch (error) {
    console.error("[Finance] getCustomerStatements error:", error);
    return {
      status: 500,
      success: false,
      message: error instanceof Error ? error.message : String(error),
      data: EMPTY_PAGE(size),
      timestamp: new Date().toISOString(),
    };
  }
}

export async function getProfitAndLossDashboard(
  startDate?: string,
  endDate?: string
): Promise<ApiResponse<ProfitAndLossSummary>> {
  try {
    const qs = new URLSearchParams();
    if (startDate) qs.append("startDate", startDate);
    if (endDate) qs.append("endDate", endDate);

    const res = await fetch(
      `${BASE_URL}analytics/profit-and-loss/dashboard?${qs.toString()}`,
      {
        headers: await getAuthHeaders(),
        next: { tags: ["finance"], revalidate: 60 },
      }
    );
    if (!res.ok) return handleFinanceResponse(res, "Failed to fetch P&L dashboard");
    return res.json();
  } catch (error) {
    console.error("[Finance] getProfitAndLossDashboard error:", error);
    return {
      status: 500,
      success: false,
      message: error instanceof Error ? error.message : String(error),
      data: null,
      timestamp: new Date().toISOString(),
    };
  }
}

// ── New mutation actions ──────────────────────────────────────────────────────

export async function createExpense(
  request: ExpenseRequest
): Promise<ApiResponse<Expense>> {
  try {
    const res = await fetch(`${BASE_URL}expenses`, {
      method: "POST",
      headers: { ...(await getAuthHeaders()), "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    if (!res.ok) return handleFinanceResponse(res, "Failed to create expense");
    const data: ApiResponse<Expense> = await res.json();
    if (data.success) revalidateTag("expenses", "page");
    return data;
  } catch (error) {
    console.error("[Finance] createExpense error:", error);
    return {
      status: 500,
      success: false,
      message: error instanceof Error ? error.message : String(error),
      data: null,
      timestamp: new Date().toISOString(),
    };
  }
}

export async function deleteExpense(id: number): Promise<ApiResponse<null>> {
  try {
    const res = await fetch(`${BASE_URL}expenses/${id}`, {
      method: "DELETE",
      headers: await getAuthHeaders(),
    });
    const result = await handleFinanceResponse<null>(res, "Failed to delete expense");
    if (result.success) revalidateTag("expenses", "page");
    return result;
  } catch (error) {
    console.error("[Finance] deleteExpense error:", error);
    return {
      status: 500,
      success: false,
      message: error instanceof Error ? error.message : String(error),
      data: null,
      timestamp: new Date().toISOString(),
    };
  }
}

export async function generateStatement(
  request: StatementRequest
): Promise<ApiResponse<Statement>> {
  try {
    const res = await fetch(`${BASE_URL}statements/generate`, {
      method: "POST",
      headers: { ...(await getAuthHeaders()), "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    if (!res.ok) return handleFinanceResponse(res, "Failed to generate statement");
    const data: ApiResponse<Statement> = await res.json();
    if (data.success) revalidateTag("statements", "page");
    return data;
  } catch (error) {
    console.error("[Finance] generateStatement error:", error);
    return {
      status: 500,
      success: false,
      message: error instanceof Error ? error.message : String(error),
      data: null,
      timestamp: new Date().toISOString(),
    };
  }
}

export async function downloadStatementPdf(
  id: number
): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(`${BASE_URL}statements/${id}/download`, {
      headers: await getAuthHeaders(),
    });
    if (
      !res.ok ||
      !res.headers.get("content-type")?.includes("application/pdf")
    ) {
      console.error("[Finance] Statement PDF download failed", res.status, res.statusText);
      return null;
    }
    return res.arrayBuffer();
  } catch (error) {
    console.error("[Finance] downloadStatementPdf error:", error);
    return null;
  }
}

/**
 * Resolve a single statement by id. Prefers the direct `GET /statements/{id}`,
 * but never returns it without verifying ownership against the provided
 * customerId (defense-in-depth on top of backend RLS). If the direct lookup
 * 404s (only the customer-list endpoint is active), falls back to the
 * customer's statement list + `.find()`. Never queries with customerId = 0.
 */
export async function getStatementById(
  statementId: number,
  customerId?: number
): Promise<ApiResponse<Statement | null>> {
  try {
    const direct = await fetch(`${BASE_URL}statements/${statementId}`, {
      headers: await getAuthHeaders(),
      next: { tags: ["statements"], revalidate: 30 },
    });
    if (direct.ok) {
      const body: ApiResponse<Statement> = await direct.json();
      if (body.success && body.data) {
        if (
          customerId &&
          customerId > 0 &&
          body.data.customerId !== customerId
        ) {
          console.warn(
            `[Finance] Statement ${statementId} does not belong to customer ${customerId}; refusing cross-customer read.`
          );
          return {
            status: 403,
            success: false,
            message: "Statement access denied.",
            data: null,
            timestamp: new Date().toISOString(),
          };
        }
        return { ...body, data: body.data };
      }
    }

    if (customerId && customerId > 0) {
      const listRes = await getCustomerStatements(customerId, 0, 100);
      if (listRes.success && listRes.data) {
        const found = listRes.data.content.find((s) => s.id === statementId);
        if (found) {
          return {
            status: 200,
            success: true,
            message: "Statement loaded.",
            data: found,
            timestamp: new Date().toISOString(),
          };
        }
      }
      return { status: 404, success: false, message: "Statement not found for the given customer.", data: null, timestamp: new Date().toISOString() };
    }

    return { status: 404, success: false, message: "Statement not found.", data: null, timestamp: new Date().toISOString() };
  } catch (error) {
    console.error("[Finance] getStatementById error:", error);
    return { status: 500, success: false, message: "Failed to load statement.", data: null, timestamp: new Date().toISOString() };
  }
}