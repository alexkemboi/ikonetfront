import { http, HttpResponse } from "msw";
import { API_PREFIX, requireAuth } from "./auth-guard";
import { envelope } from "@/contracts/catalog";
import type {
  AccountBalanceProjection,
  AccountPosting,
  ChartOfAccountNode,
  Expense,
  ProfitLossReport,
  SpringPage,
  TrialBalanceResponse,
} from "@/lib/types/finance";

/**
 * Raw, non-envelope fixtures matching `CoaController` — the four CoA routes
 * return bare payloads (`Map`, `List`, `TrialBalanceResponse` object), NOT
 * `ApiResponse<T>` envelopes. Keep these exactly as the backend returns them.
 */

const coaTreeFixture: Record<string, ChartOfAccountNode[]> = {
  ASSET: [
    {
      id: 1,
      code: "1000",
      name: "Cash & Bank",
      type: "ASSET",
      parentCode: undefined,
      isActive: true,
      children: [],
    },
    {
      id: 2,
      code: "1100",
      name: "Accounts Receivable",
      type: "ASSET",
      parentCode: undefined,
      isActive: true,
      children: [],
    },
  ],
  LIABILITY: [
    {
      id: 3,
      code: "2000",
      name: "Customer Prepayments",
      type: "LIABILITY",
      parentCode: undefined,
      isActive: true,
      children: [],
    },
  ],
  EQUITY: [
    {
      id: 4,
      code: "3000",
      name: "Retained Earnings",
      type: "EQUITY",
      parentCode: undefined,
      isActive: true,
      children: [],
    },
  ],
  INCOME: [
    {
      id: 5,
      code: "4000",
      name: "Subscription Revenue",
      type: "INCOME",
      parentCode: undefined,
      isActive: true,
      children: [
        {
          id: 6,
          code: "4100",
          name: "PPPoE Revenue",
          type: "INCOME",
          parentCode: "4000",
          isActive: true,
          children: [],
        },
      ],
    },
  ],
  EXPENSE: [
    {
      id: 7,
      code: "5000",
      name: "Equipment & Maintenance",
      type: "EXPENSE",
      parentCode: undefined,
      isActive: true,
      children: [],
    },
  ],
};

const coaBalanceFixture: AccountBalanceProjection[] = [
  { accountCode: "1000", accountName: "Cash & Bank", balance: 450000, postingCount: 12 },
  { accountCode: "4100", accountName: "PPPoE Revenue", balance: 95000, postingCount: 8 },
  { accountCode: "5000", accountName: "Equipment & Maintenance", balance: -45000, postingCount: 3 },
];

const trialBalanceFixture: TrialBalanceResponse = {
  delta: 0,
  isBalanced: true,
  debits: 500000,
  credits: -500000,
  accounts: [
    { code: "1000", name: "Cash & Bank", type: "ASSET", balance: 450000 },
    { code: "4100", name: "PPPoE Revenue", type: "INCOME", balance: -95000 },
    { code: "5000", name: "Equipment & Maintenance", type: "EXPENSE", balance: 45000 },
  ],
};

const postingsFixture: AccountPosting[] = [
  {
    id: 1,
    accountCode: "4100",
    sourceType: "SUBSCRIPTION",
    sourceId: 101,
    amount: 1500,
    currency: "KES",
    occurredAt: "2026-08-25T10:22:00",
    memo: "Monthly PPPoE subscription",
    companyId: 1,
    routerId: 2,
    serviceType: "PPPOE",
    customerId: 42,
    createdAt: "2026-08-25T10:22:00",
  },
  {
    id: 2,
    accountCode: "5000",
    sourceType: "EXPENSE",
    sourceId: 7,
    amount: -45000,
    currency: "KES",
    occurredAt: "2026-08-24T16:05:00",
    memo: "SFP replacement",
    companyId: 1,
    routerId: 2,
    serviceType: "MAINTENANCE",
    createdAt: "2026-08-24T16:05:00",
  },
];

/**
 * `GET /finance/transactions` — `ApiResponse<Page<AccountPosting>>` envelope.
 * Honors the `accountCode` filter with a fixture that includes a 1110
 * (M-Pesa Clearing) posting so the payments-ledger path reads contract-shaped
 * data.
 */
const transactionsPageFixture: SpringPage<AccountPosting> = {
  content: [
    {
      id: 1001,
      accountCode: "1110",
      sourceType: "MPESA",
      sourceId: 7345678901,
      amount: 500,
      currency: "KES",
      occurredAt: "2026-08-31T18:42:00",
      memo: "MPESA KES 500 HOTSPOT",
      companyId: 1,
      serviceType: "HOTSPOT",
      customerId: 12,
      createdAt: "2026-08-31T18:42:00",
    },
    {
      id: 1000,
      accountCode: "4100",
      sourceType: "SUBSCRIPTION",
      sourceId: 101,
      amount: -2500,
      currency: "KES",
      occurredAt: "2026-08-31T10:00:00",
      memo: "Monthly PPPoE subscription",
      companyId: 1,
      routerId: 2,
      serviceType: "PPPOE",
      customerId: 42,
      createdAt: "2026-08-31T10:00:00",
    },
  ],
  totalElements: 2,
  totalPages: 1,
  size: 10,
  number: 0,
  first: true,
  last: true,
  empty: false,
};

/**
 * `GET /finance/reports/profit-loss` — RAW `ProfitLossReport` (no envelope).
 * Revenue lines use the contract's mapping: 4100 = PPPoE, 4200 = Hotspot.
 */
const profitLossFixture: ProfitLossReport = {
  revenue: [
    { accountCode: "4100", accountName: "PPPoE Revenue", amount: 95000 },
    { accountCode: "4200", accountName: "Hotspot Revenue", amount: 42000 },
  ],
  expenses: [{ accountCode: "5100", accountName: "Operating Expenses", amount: 45000 }],
  totalRevenue: 137000,
  totalExpenses: 45000,
  netIncome: 92000,
  startDate: "2026-08-01T00:00:00",
  endDate: "2026-08-31T23:59:59",
};

/**
 * `GET /expenses` — `ApiResponse<Page<ExpenseResponse>>` envelope with
 * **string UUID** ids, matching the real `ExpenseResponse` contract.
 */
const expensesPageFixture: SpringPage<Expense> = {
  content: [
    {
      id: "0c5d80f1-3b9a-4c6e-8f2a-7d1e9b3a4c55",
      amount: 12000,
      description: "Backhaul router replacement",
      category: "EQUIPMENT",
      expenseType: "Capital",
      currency: "KES",
      status: "APPROVED",
      paymentMethod: "M-Pesa",
      expenseDate: "2026-08-10",
      companyId: 1,
      createdAt: "2026-08-10T09:00:00",
      updatedAt: "2026-08-10T09:00:00",
    },
    {
      id: "a4e6b291-8c2d-4f7a-9b3e-5f8a1d2e6c77",
      amount: 3500,
      description: "Power backup fuel",
      category: "MAINTENANCE",
      expenseType: "Routine",
      currency: "KES",
      status: "PAID",
      paymentMethod: "M-Pesa",
      expenseDate: "2026-08-12",
      companyId: 1,
      createdAt: "2026-08-12T11:30:00",
      updatedAt: "2026-08-12T11:30:00",
    },
  ],
  totalElements: 2,
  totalPages: 1,
  size: 20,
  number: 0,
  first: true,
  last: true,
  empty: false,
};

/** `GET /expenses/summary` — backend shape (`totalExpenses`/`expenseCount`/`expensesByCategory`). */
const expenseSummaryFixture = {
  startDate: "2026-08-01",
  endDate: "2026-08-31",
  totalExpenses: 15500,
  expenseCount: 2,
  expensesByCategory: {
    EQUIPMENT: 12000,
    MAINTENANCE: 3500,
  },
};

export const financeHandlers = [
  http.get(`${API_PREFIX}/finance/coa`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(coaTreeFixture, { status: 200 });
  }),

  http.get(`${API_PREFIX}/finance/coa/balance`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(coaBalanceFixture, { status: 200 });
  }),

  http.get(`${API_PREFIX}/finance/coa/trial-balance`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(trialBalanceFixture, { status: 200 });
  }),

  http.get(`${API_PREFIX}/finance/coa/postings`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(postingsFixture, { status: 200 });
  }),

  http.get(`${API_PREFIX}/finance/transactions`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    const accountCode = new URL(info.request.url).searchParams.get("accountCode");
    const content = accountCode
      ? transactionsPageFixture.content.filter((p) => p.accountCode === accountCode)
      : transactionsPageFixture.content;
    return HttpResponse.json(
      envelope(
        {
          ...transactionsPageFixture,
          content,
          totalElements: content.length,
          empty: content.length === 0,
        },
        "Transactions fetched successfully"
      ),
      { status: 200 }
    );
  }),

  http.get(`${API_PREFIX}/finance/reports/profit-loss`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(profitLossFixture, { status: 200 });
  }),

  http.get(`${API_PREFIX}/expenses`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(
      envelope(expensesPageFixture, "Expenses fetched successfully"),
      { status: 200 }
    );
  }),

  http.get(`${API_PREFIX}/expenses/summary`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(
      envelope(expenseSummaryFixture, "Expense summary fetched successfully"),
      { status: 200 }
    );
  }),
];