import { http, HttpResponse } from "msw";
import { API_PREFIX, requireAuth } from "./auth-guard";
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

/** `FinanceInvoiceResponse` shaped row (backend contract). */
interface InvoiceRow {
  id: number;
  invoiceNumber: string;
  companyId: string;
  customerId: string;
  customerIdxno?: number;
  customerName?: string;
  customerPhone?: string;
  subscriptionId?: string;
  packageId?: string;
  packageName?: string;
  amount: number;
  taxAmount?: number;
  status: string;
  dueDate: string;
  paidAt?: string | null;
  paymentReference?: string | null;
  createdByUsername?: string;
  createdAt: string;
}

const invoicesFixture: InvoiceRow[] = [
  {
    id: 1,
    invoiceNumber: "INV-CMP-A-2026-100001",
    companyId: "CMP-A",
    customerId: "2f6b2f8a-1c44-4f8e-bd3a-5e9a6b7c01",
    customerIdxno: 42,
    customerName: "Njeri Wafula",
    customerPhone: "0712345678",
    subscriptionId: "b1a3a9d2-8f22-4c0f-9e2a-7d1b3c4d5e6f",
    packageId: "4d3a2b1c-6f5e-4d3c-8b2a-1f0e9d8c7b6a",
    packageName: "Home 30",
    amount: 2500,
    taxAmount: 0,
    status: "UNPAID",
    dueDate: "2026-09-26",
    createdAt: "2026-09-19T06:00:00",
  },
];

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
      {
        success: true,
        data: {
          ...transactionsPageFixture,
          content,
          totalElements: content.length,
          empty: content.length === 0,
        },
      },
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
    return HttpResponse.json({ success: true, data: expensesPageFixture }, { status: 200 });
  }),

  http.get(`${API_PREFIX}/expenses/summary`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json({ success: true, data: expenseSummaryFixture }, { status: 200 });
  }),

  // ── Track 4 — envelope-returning finance endpoints ─────────────────────
  http.post(`${API_PREFIX}/payments/manual`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(
      {
        success: true,
        status: 201,
        message: "Manual payment recorded successfully",
        data: {
          paymentId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
          referenceNumber: "MAN-20260919-8F3A2C70",
          amount: 1500,
          channel: "CASH",
          expiresAt: null,
          recordedAt: "2026-09-19T06:00:00",
        },
        timestamp: "2026-09-19T06:00:00",
      },
      { status: 201 }
    );
  }),

  http.get(`${API_PREFIX}/finance/invoices`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(
      {
        success: true,
        status: 200,
        message: "Invoices retrieved successfully",
        data: {
          content: invoicesFixture,
          totalElements: invoicesFixture.length,
          totalPages: 1,
          size: 100,
          number: 0,
          first: true,
          last: true,
          empty: invoicesFixture.length === 0,
        },
        timestamp: "2026-09-19T06:00:00",
      },
      { status: 200 }
    );
  }),

  http.get(`${API_PREFIX}/finance/invoices/summary`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(
      {
        success: true,
        status: 200,
        message: "Invoice summary retrieved successfully",
        data: {
          allInvoicesCount: 1,
          pendingAmount: 2500,
          pendingCount: 1,
          overdueCount: 0,
          collectedAmount: 0,
          paidCount: 0,
        },
        timestamp: "2026-09-19T06:00:00",
      },
      { status: 200 }
    );
  }),

  http.post(`${API_PREFIX}/finance/invoices`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(
      {
        success: true,
        status: 201,
        message: "Invoice created successfully",
        data: {
          id: 2,
          invoiceNumber: "INV-CMP-A-2026-100002",
          companyId: "CMP-A",
          customerId: "2f6b2f8a-1c44-4f8e-bd3a-5e9a6b7c02",
          customerIdxno: 42,
          customerName: "Njeri Wafula",
          customerPhone: "0712345678",
          packageName: "Home 30",
          amount: 2500,
          taxAmount: 0,
          status: "UNPAID",
          dueDate: "2026-09-26",
          createdAt: "2026-09-19T06:00:00",
        },
        timestamp: "2026-09-19T06:00:00",
      },
      { status: 201 }
    );
  }),

  http.get(`${API_PREFIX}/finance/voucher-batches`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(
      {
        success: true,
        status: 200,
        message: "Voucher batches retrieved successfully",
        data: {
          content: [],
          totalElements: 0,
          totalPages: 0,
          size: 100,
          number: 0,
          first: true,
          last: true,
          empty: true,
        },
        timestamp: "2026-09-19T06:00:00",
      },
      { status: 200 }
    );
  }),

  http.post(`${API_PREFIX}/finance/voucher-batches`, (info) => {
    const forbidden = requireAuth(info.request);
    if (forbidden) return forbidden;
    return HttpResponse.json(
      {
        success: true,
        status: 201,
        message: "Voucher batch created successfully",
        data: {
          batchId: "1c9b6f4a-2d8e-4a3f-9c2b-7e1d5f8a9b0c",
          batchNumber: "VB-CMP-A-2026-100001",
          packageName: "Daily 1GB",
          quantity: 100,
          unitPrice: 50,
          totalValue: 5000,
          channel: "CASH",
          status: "ACTIVE",
          codePrefix: "ADR",
          codeLength: 8,
          createdByUsername: "ops1",
          createdAt: "2026-09-19T06:00:00",
          codes: ["ADR4F2K7X", "ADR8N2W5M"],
        },
        timestamp: "2026-09-19T06:00:00",
      },
      { status: 201 }
    );
  }),
];