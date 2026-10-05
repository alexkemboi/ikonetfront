"use server";

import { updateTag } from "next/cache";
import { auth } from "@/lib/auth";
import { BASE_URL, buildApiUrl } from "@/lib/constants";
import { unwrapPostings } from "@/lib/finance/ledger";
import { withCompanyContext } from "@/lib/companyContext";
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
  ProfitLossReport,
  SpringPage,
  Statement,
  StatementRequest,
  TrialBalanceResponse,
} from "@/lib/types/finance";
import { EMPTY_PAGE } from "@/lib/types/finance";

// ── Tolerant auth headers (returns {} when no token) ──────────────────────────

async function getAuthHeaders(
  companyScope?: string | null
): Promise<Record<string, string>> {
  const session = await auth();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (session?.user?.apiToken) {
    headers["Authorization"] = `Bearer ${session.user.apiToken}`;
  }
  // R-16: forward the SYSADMIN-selected tenant context so every finance read is
  // scoped (R-05). The cookie is the default; an explicit caller param wins.
  return withCompanyContext(headers, companyScope);
}

/**
 * Defensive unwrap shared by the four CoA reads. The backend returns raw
 * payloads (no `ApiResponse<T>` envelope) for `/finance/coa*`; when the
 * backend does (or later does) wrap a body in `{ data: ... }`, this still
 * unwraps it. Raw non-envelope bodies pass through untouched.
 */
function unwrapData<T>(json: unknown): T | null | undefined {
  if (typeof json === "object" && json !== null && "data" in json) {
    return (json as { data?: T }).data;
  }
  return json as T;
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

// ── CoA reads (raw /finance/coa* payloads — no envelope) ─────────────────────

export async function getChartOfAccountsTree(): Promise<Record<string, ChartOfAccountNode[]>> {
  try {
    const res = await fetch(buildApiUrl("/finance/coa"), {
      headers: await getAuthHeaders(),
      cache: "no-store",
    });
    if (!res.ok) return {};
    const raw = unwrapData<Record<string, ChartOfAccountNode[]>>(await res.json());
    return typeof raw === "object" && raw !== null ? raw : {};
  } catch (error) {
    console.error("[Finance] getChartOfAccountsTree error:", error);
    return {};
  }
}

export async function getAccountBalances(): Promise<AccountBalanceProjection[]> {
  try {
    const res = await fetch(buildApiUrl("/finance/coa/balance"), {
      headers: await getAuthHeaders(),
      cache: "no-store",
    });
    if (!res.ok) return [];
    const list = unwrapData<AccountBalanceProjection[]>(await res.json());
    return Array.isArray(list) ? list : [];
  } catch (error) {
    console.error("[Finance] getAccountBalances error:", error);
    return [];
  }
}

export async function getTrialBalance(): Promise<TrialBalanceResponse | null> {
  try {
    const res = await fetch(buildApiUrl("/finance/coa/trial-balance"), {
      headers: await getAuthHeaders(),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const raw = unwrapData<unknown>(await res.json());
    if (typeof raw !== "object" || raw === null) return null;
    const trialBalance = raw as Record<string, unknown>;
    if (!isFiniteNumber(trialBalance.delta) || typeof trialBalance.isBalanced !== "boolean") return null;
    if (!isFiniteNumber(trialBalance.debits) || !isFiniteNumber(trialBalance.credits)) return null;
    if (!Array.isArray(trialBalance.accounts)) return null;

    const accounts: TrialBalanceResponse["accounts"] = [];
    for (const value of trialBalance.accounts) {
      if (typeof value !== "object" || value === null) return null;
      const account = value as Record<string, unknown>;
      const code = typeof account.code === "string" ? account.code : account.accountCode;
      if (typeof code !== "string" || !isFiniteNumber(account.balance)) return null;
      const name =
        typeof account.name === "string"
          ? account.name
          : typeof account.accountName === "string"
            ? account.accountName
            : undefined;
      const type = ["ASSET", "LIABILITY", "EQUITY", "INCOME", "EXPENSE"].includes(
        String(account.type)
      )
        ? (account.type as ChartOfAccountNode["type"])
        : undefined;
      accounts.push({ code, name, type, balance: account.balance });
    }
    return {
      delta: trialBalance.delta,
      isBalanced: trialBalance.isBalanced,
      debits: trialBalance.debits,
      credits: trialBalance.credits,
      accounts,
    };
  } catch (error) {
    console.error("[Finance] getTrialBalance error:", error);
    return null;
  }
}

// ── Executive dashboard (live data, zero dummy numbers) ──────────────────────

const ZERO_PNL: ProfitAndLossSummary = {
  totalRevenue: 0,
  totalExpenses: 0,
  netProfit: 0,
  pppoeRevenue: 0,
  hotspotRevenue: 0,
  startDate: "",
  endDate: "",
};

function currentMonthWindow(): { from: string; to: string } {
  // Local-calendar window — never slice `toISOString()` (UTC), which shifts the
  // first-of-month a day into the previous month in any timezone ahead of UTC.
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    from: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`,
    to: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
  };
}

function zeroSafePnl(from: string, to: string): ProfitAndLossSummary {
  return { ...ZERO_PNL, startDate: from, endDate: to };
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isValidDateValue(value: string): boolean {
  const datePart = value.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return false;
  const date = new Date(`${datePart}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== datePart) return false;
  return value.length === 10 || /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/.test(value);
}

function toFinanceDateTime(value: string, endOfDay: boolean): string {
  return value.length === 10 ? `${value}T${endOfDay ? "23:59:59" : "00:00:00"}` : value;
}

/**
 * Map the backend `ProfitLossReport` into the dashboard's `ProfitAndLossSummary`.
 * Revenue lines are matched by account code (4100 = PPPoE, 4200 = Hotspot per the
 * contract fixture) with a name-substring fallback; missing lines never fail.
 */
function normalizeProfitLossReport(
  json: unknown,
  from: string,
  to: string
): ProfitAndLossSummary | null {
  const report = unwrapData<ProfitLossReport>(json);
  if (
    typeof report !== "object" ||
    report === null ||
    !isFiniteNumber(report.totalRevenue) ||
    !isFiniteNumber(report.totalExpenses) ||
    !isFiniteNumber(report.netIncome) ||
    !Array.isArray(report.revenue)
  ) return null;
  const revenue = report.revenue.filter(
    (line) =>
      typeof line?.accountCode === "string" &&
      isFiniteNumber(line.amount)
  );

  const match = (codes: string[], needles: string[]): number => {
    const byCode = revenue.find((line) => codes.includes(line.accountCode));
    if (byCode) return Math.abs(byCode.amount);
    const byName = revenue.find((line) =>
      needles.some((n) => (line.accountName ?? "").toLowerCase().includes(n))
    );
    return Math.abs(byName?.amount ?? 0);
  };

  // The ledger stores credit-normal income as negative balances. The report
  // contract fixtures use positive totals, so invert net income only when the
  // report's revenue total signals signed-ledger convention.
  const signedLedgerConvention = report.totalRevenue < 0;
  return {
    totalRevenue: Math.abs(report.totalRevenue),
    totalExpenses: Math.abs(report.totalExpenses),
    netProfit: signedLedgerConvention ? -report.netIncome : report.netIncome,
    pppoeRevenue: match(["4100"], ["pppoe"]),
    hotspotRevenue: match(["4200"], ["hotspot"]),
    startDate: report.startDate ?? from,
    endDate: report.endDate ?? to,
  };
}

/** Pick the M-Pesa clearing account balance; a valid response without it means zero. */
function unwrapClearingBalance(json: unknown): number | null {
  const list = unwrapData<unknown>(json);
  if (!Array.isArray(list)) return null;
  for (const value of list) {
    if (typeof value !== "object" || value === null) return null;
    const account = value as Partial<AccountBalanceProjection>;
    if (typeof account.accountCode !== "string" || !isFiniteNumber(account.balance)) {
      return null;
    }
    if (account.accountCode === "1110" || account.accountCode === "M_PESA_RECEIVABLE") {
      return account.balance;
    }
  }
  return 0;
}

/**
 * Live executive dashboard feed. Three parallel reads from the backend
 * (`/finance/reports/profit-loss` with the contract-required dates,
 * `/finance/transactions` page 0, `/finance/coa/balance` for the 1110
 * clearing balance). Every failure path returns zeros — never demo numbers.
 * The backend requires `startDate`/`endDate` (`date-time`), so bare
 * `YYYY-MM-DD` inputs are normalized like `getLedgerPostings`.
 */
export async function getLiveExecutiveDashboardData(
  from?: string,
  to?: string,
  companyScope?: string | null
): Promise<{
  pnl: ProfitAndLossSummary;
  recentTransactions: AccountPosting[];
  clearingBalance: number;
  pnlAvailable: boolean;
  transactionsAvailable: boolean;
  clearingBalanceAvailable: boolean;
  errors: string[];
}> {
  const session = await auth();
  const token = session?.user?.apiToken;

  if (!token) {
    return {
      pnl: zeroSafePnl("", ""),
      recentTransactions: [],
      clearingBalance: 0,
      pnlAvailable: false,
      transactionsAvailable: false,
      clearingBalanceAvailable: false,
      errors: ["Your session is missing an API token. Sign in again to load financial data."],
    };
  }

  try {
    const window = currentMonthWindow();
    const rawStart = from || window.from;
    const rawEnd = to || window.to;
    if (!isValidDateValue(rawStart) || !isValidDateValue(rawEnd)) {
      return {
        pnl: zeroSafePnl("", ""),
        recentTransactions: [],
        clearingBalance: 0,
        pnlAvailable: false,
        transactionsAvailable: false,
        clearingBalanceAvailable: false,
        errors: ["Enter valid dates using YYYY-MM-DD, with an optional time."],
      };
    }
    if (Date.parse(rawStart) > Date.parse(rawEnd)) {
      return {
        pnl: zeroSafePnl("", ""),
        recentTransactions: [],
        clearingBalance: 0,
        pnlAvailable: false,
        transactionsAvailable: false,
        clearingBalanceAvailable: false,
        errors: ["The start date must be on or before the end date."],
      };
    }
    const startDate = toFinanceDateTime(rawStart, false);
    const endDate = toFinanceDateTime(rawEnd, true);

    const qs = new URLSearchParams({ startDate, endDate }).toString();
    const headers = await getAuthHeaders(companyScope);
    const responses = await Promise.allSettled([
      fetch(buildApiUrl(`/finance/reports/profit-loss?${qs}`), {
        headers,
        cache: "no-store",
      }),
      fetch(
        buildApiUrl("/finance/transactions?page=0&size=10&sort=occurredAt,desc"),
        { headers, cache: "no-store" }
      ),
      fetch(buildApiUrl("/finance/coa/balance"), { headers, cache: "no-store" }),
    ]);

    const errors: string[] = [];
    const [pnlSettled, txSettled, balanceSettled] = responses;

    let pnl: ProfitAndLossSummary | null = null;
    if (pnlSettled.status === "fulfilled" && pnlSettled.value.ok) {
      try {
        pnl = normalizeProfitLossReport(await pnlSettled.value.json(), startDate, endDate);
      } catch (error) {
        console.error("[Finance] Invalid P&L response body:", error);
      }
    }
    if (!pnl) errors.push("Profit and loss data is unavailable or did not match the expected API response.");

    let recentTransactions: AccountPosting[] = [];
    let transactionsAvailable = false;
    let transactionsError = "Recent transactions are unavailable.";
    if (txSettled.status === "rejected") {
      console.error("[Finance] Recent transactions request failed:", txSettled.reason);
      transactionsError = "Recent transactions request failed before a response was received.";
    } else if (!txSettled.value.ok) {
      transactionsError = `Recent transactions request failed (HTTP ${txSettled.value.status}).`;
    } else {
      try {
        const json = await txSettled.value.json();
        const postings = unwrapPostings(json);
        const rawContent =
          Array.isArray(json) ? json :
          typeof json === "object" && json !== null && "data" in json
            ? (json as { data?: { content?: unknown[] } | unknown[] }).data
            : undefined;
        const entries = Array.isArray(rawContent)
          ? rawContent
          : typeof rawContent === "object" && rawContent !== null && "content" in rawContent
            ? rawContent.content
            : typeof json === "object" && json !== null && "content" in json
              ? (json as { content?: unknown[] }).content
              : undefined;
        if (Array.isArray(entries) && entries.every((entry) => {
          if (!entry || typeof entry !== "object") return false;
          const posting = entry as Partial<AccountPosting>;
          const hasValidId =
            (typeof posting.id === "string" && posting.id.trim().length > 0) ||
            isFiniteNumber(posting.id);
          return hasValidId &&
            typeof posting.accountCode === "string" &&
            isFiniteNumber(posting.amount) &&
            typeof posting.occurredAt === "string";
        })) {
          recentTransactions = postings;
          transactionsAvailable = true;
        } else {
          transactionsError =
            "Recent transactions response did not match the expected posting fields (id, accountCode, amount, occurredAt).";
        }
      } catch (error) {
        console.error("[Finance] Invalid transactions response body:", error);
        transactionsError = "Recent transactions response body could not be parsed.";
      }
    }
    if (!transactionsAvailable) errors.push(transactionsError);

    let clearingBalance: number | null = null;
    if (balanceSettled.status === "fulfilled" && balanceSettled.value.ok) {
      try {
        clearingBalance = unwrapClearingBalance(await balanceSettled.value.json());
      } catch (error) {
        console.error("[Finance] Invalid account balance response body:", error);
      }
    }
    if (clearingBalance === null) errors.push("M-Pesa clearing balance is unavailable or the account was not returned.");

    return {
      pnl: pnl ?? zeroSafePnl(startDate, endDate),
      recentTransactions,
      clearingBalance: clearingBalance ?? 0,
      pnlAvailable: pnl !== null,
      transactionsAvailable,
      clearingBalanceAvailable: clearingBalance !== null,
      errors,
    };
  } catch (error) {
    console.error("[Finance] getLiveExecutiveDashboardData error:", error);
    return {
      pnl: zeroSafePnl("", ""),
      recentTransactions: [],
      clearingBalance: 0,
      pnlAvailable: false,
      transactionsAvailable: false,
      clearingBalanceAvailable: false,
      errors: ["Financial dashboard data could not be loaded. Please retry."],
    };
  }
}

export type LedgerParams = {
  accountCode?: string;
  page?: number;
  size?: number;
  fromDate?: string;
  toDate?: string;
  companyScope?: string;
};

export async function getLedgerPostings(
  params: LedgerParams = {}
): Promise<SpringPage<AccountPosting>> {
  try {
    // Architect hardening #1: the backend binds `@DateTimeFormat(iso =
    // ISO.DATE_TIME) LocalDateTime`, so a bare `YYYY-MM-DD` from `<input
    // type="date">` yields HTTP 400. Normalize before building the query.
    const toDateTime = (d?: string, endOfDay = false) =>
      !d ? undefined : d.includes("T") ? d : `${d}T${endOfDay ? "23:59:59" : "00:00:00"}`;
    const from = toDateTime(params.fromDate, false);
    const to = toDateTime(params.toDate, true);

    const qs = new URLSearchParams();
    qs.append("page", (params.page ?? 0).toString());
    qs.append("size", (params.size ?? 20).toString());
    qs.append("sort", "occurredAt,desc");
    if (params.accountCode) qs.append("accountCode", params.accountCode);
    if (from) qs.append("fromDate", from);
    if (to) qs.append("toDate", to);
    if (params.companyScope) qs.append("companyScope", params.companyScope);

    const res = await fetch(buildApiUrl(`/finance/coa/postings?${qs.toString()}`), {
      headers: await getAuthHeaders(),
      cache: "no-store",
    });
    if (!res.ok) return EMPTY_PAGE(params.size ?? 20);

    const pageData = unwrapData<SpringPage<AccountPosting> | AccountPosting[]>(await res.json());

    const isPage =
      typeof pageData === "object" &&
      pageData !== null &&
      Array.isArray((pageData as SpringPage<AccountPosting>).content);
    if (isPage) return pageData as SpringPage<AccountPosting>;

    if (Array.isArray(pageData)) {
      return {
        ...EMPTY_PAGE(params.size ?? 20),
        content: pageData,
        totalElements: pageData.length,
      };
    }

    return EMPTY_PAGE(params.size ?? 20);
  } catch (error) {
    console.error("[Finance] getLedgerPostings error:", error);
    return EMPTY_PAGE(params.size ?? 20);
  }
}

export type ExpenseParams = {
  startDate?: string;
  endDate?: string;
  category?: ExpenseCategory;
  page?: number;
  size?: number;
  companyScope?: string;
};

/**
 * Normalize ANY backend /expenses payload into the `ApiResponse<SpringPage>`
 * shape the UI consumes: bare page / bare array / `ApiResponse` envelope.
 * A raw-array response (as CoaController style backends return) previously
 * produced `expenses.content === undefined` and crashed on mount.
 */
function normalizeExpensesResponse(
  json: unknown,
  size: number
): ApiResponse<SpringPage<Expense>> {
  const error = (message: string, status = 500): ApiResponse<SpringPage<Expense>> => ({
    status,
    success: false,
    message,
    data: EMPTY_PAGE(size),
    timestamp: new Date().toISOString(),
  });

  if (typeof json !== "object" || json === null) {
    return error("Failed to fetch expenses");
  }
  const body = json as Record<string, unknown>;

  if (Array.isArray(json)) {
    const list = json as Expense[];
    return {
      status: 200,
      success: true,
      message: "Success",
      data: { ...EMPTY_PAGE(size), content: list, totalElements: list.length },
      timestamp: new Date().toISOString(),
    };
  }

  if (Array.isArray(body.content)) {
    return {
      status: 200,
      success: true,
      message: "Success",
      data: body as unknown as SpringPage<Expense>,
      timestamp: new Date().toISOString(),
    };
  }

  if (body.success === false) {
    return error(
      typeof body.message === "string" ? body.message : "Failed to fetch expenses",
      typeof body.status === "number" ? body.status : 500
    );
  }

  const data = body.data;
  if (typeof data === "object" && data !== null) {
    if (Array.isArray((data as Record<string, unknown>).content)) {
      return {
        status: 200,
        success: true,
        message: "Success",
        data: data as unknown as SpringPage<Expense>,
        timestamp: new Date().toISOString(),
      };
    }
    if (Array.isArray(data)) {
      const list = data as Expense[];
      return {
        status: 200,
        success: true,
        message: "Success",
        data: { ...EMPTY_PAGE(size), content: list, totalElements: list.length },
        timestamp: new Date().toISOString(),
      };
    }
    if ((data as Record<string, unknown>).success === false) {
      return error(
        typeof (data as Record<string, unknown>).message === "string"
          ? String((data as Record<string, unknown>).message)
          : "Failed to fetch expenses"
      );
    }
  }

  return error("Unexpected expenses payload");
}

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
      headers: await getAuthHeaders(params.companyScope),
      // Never cache user/company-scoped expense data in the shared Data Cache
      // (keyed by URL, not Authorization) — it would leak across tenants.
      cache: "no-store",
    });
    if (!res.ok) {
      const result = await handleFinanceResponse<SpringPage<Expense>>(res, "Failed to fetch expenses");
      return { ...result, data: result.data ?? EMPTY_PAGE(params.size ?? 20) };
    }
    return normalizeExpensesResponse(await res.json(), params.size ?? 20);
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

/**
 * Convert the backend `ExpenseSummary` payload — `{ startDate, endDate,
 * totalExpenses, expenseCount, expensesByCategory }` — into the frontend
 * `ExpenseSummary` shape (`totalAmount`, `totalCount`, `byCategory`).
 * Partial/missing fields tolerate to zeros/{} so the summary KPIs and
 * `ExpenseSummaryView` never crash on a real backend response.
 */
function normalizeExpenseSummaryResponse(json: unknown): ApiResponse<ExpenseSummary> {
  const error = (message: string, status = 500): ApiResponse<ExpenseSummary> => ({
    status,
    success: false,
    message,
    data: null,
    timestamp: new Date().toISOString(),
  });

  if (typeof json !== "object" || json === null) {
    return error("Failed to fetch expense summary");
  }
  const body = json as Record<string, unknown>;

  if (body.success === false) {
    return error(
      typeof body.message === "string" ? body.message : "Failed to fetch expense summary",
      typeof body.status === "number" ? body.status : 500
    );
  }

  const raw = (body.success === true ? body.data : json) as
    | Record<string, unknown>
    | null
    | undefined;
  if (typeof raw !== "object" || raw === null) {
    return error("Failed to fetch expense summary");
  }

  const categoryMap = raw.expensesByCategory ?? raw.byCategory;
  return {
    status: 200,
    success: true,
    message: "Success",
    data: {
      totalAmount:
        typeof raw.totalAmount === "number"
          ? raw.totalAmount
          : typeof raw.totalExpenses === "number"
            ? raw.totalExpenses
            : 0,
      totalCount:
        typeof raw.totalCount === "number"
          ? raw.totalCount
          : typeof raw.expenseCount === "number"
            ? raw.expenseCount
            : 0,
      byCategory:
        typeof categoryMap === "object" &&
        categoryMap !== null &&
        !Array.isArray(categoryMap)
          ? (categoryMap as Record<ExpenseCategory, number>)
          : ({} as Record<ExpenseCategory, number>),
    },
    timestamp: new Date().toISOString(),
  };
}

export async function getExpenseSummary(
  startDate?: string,
  endDate?: string,
  companyScope?: string | null
): Promise<ApiResponse<ExpenseSummary>> {
  try {
    const today = new Date();
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const qs = new URLSearchParams();
    qs.append("startDate", startDate || firstOfMonth.toISOString().slice(0, 10));
    qs.append("endDate", endDate || today.toISOString().slice(0, 10));

    const res = await fetch(`${BASE_URL}expenses/summary?${qs.toString()}`, {
      headers: await getAuthHeaders(companyScope),
      cache: "no-store",
    });
    if (!res.ok) return handleFinanceResponse(res, "Failed to fetch expense summary");
    return normalizeExpenseSummaryResponse(await res.json());
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
    if (data.success) updateTag("expenses");
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

export async function deleteExpense(id: string): Promise<ApiResponse<null>> {
  try {
    const res = await fetch(`${BASE_URL}expenses/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: await getAuthHeaders(),
    });
    const result = await handleFinanceResponse<null>(res, "Failed to delete expense");
    if (result.success) updateTag("expenses");
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
    if (data.success) updateTag("statements");
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