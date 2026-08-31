import { http, HttpResponse } from "msw";
import { API_PREFIX, requireAuth } from "./auth-guard";
import type {
  AccountBalanceProjection,
  AccountPosting,
  ChartOfAccountNode,
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
];