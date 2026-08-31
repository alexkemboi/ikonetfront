export type CoaType = "ASSET" | "LIABILITY" | "EQUITY" | "INCOME" | "EXPENSE";

export interface ChartOfAccountNode {
  id: number;
  code: string;
  name: string;
  type: CoaType;
  parentCode?: string;
  isActive: boolean;
  children?: ChartOfAccountNode[];
}

export type ChartOfAccountsTree = Record<string, ChartOfAccountNode[]>;

export interface AccountBalanceProjection {
  companyId?: number;
  accountCode: string;
  accountName?: string;
  balance: number;
  postingCount: number;
}

export interface TrialBalanceResponse {
  delta: number;
  isBalanced: boolean;
  debits: number;
  credits: number;
  accounts: Array<{
    code: string;
    name: string;
    type: CoaType;
    balance: number;
  }>;
}

export interface AccountPosting {
  id: number;
  accountCode: string;
  sourceType: string;
  sourceId?: number;
  amount: number;
  currency: string;
  occurredAt: string;
  memo?: string;
  companyId?: number;
  regionId?: number;
  locationId?: number;
  stationId?: number;
  routerId?: number;
  investorId?: number;
  serviceType?: string;
  packageId?: number;
  pppoePackageId?: number;
  customerId?: number;
  transactionId?: string;
  createdAt: string;
}

export type ExpenseCategory = "SALARY" | "EQUIPMENT" | "MAINTENANCE" | "UTILITIES" | "MARKETING" | "OTHER";

export interface Expense {
  id: number;
  amount: number;
  description: string;
  category: ExpenseCategory;
  expenseType?: string;
  currency: string;
  tax?: number;
  status: string;
  paymentMethod?: string;
  expenseDate: string;
  receiptUrl?: string;
  createdById?: number;
  stationId?: number;
  companyId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseRequest {
  amount: number;
  description: string;
  category: ExpenseCategory;
  expenseType?: string;
  paymentMethod?: string;
  expenseDate: string;
  receiptUrl?: string;
  stationId?: number;
}

export interface ExpenseSummary {
  totalAmount: number;
  totalCount: number;
  byCategory: Record<ExpenseCategory, number>;
}

export interface StatementLineItem {
  date: string;
  description: string;
  charge?: number;
  payment?: number;
}

export interface Statement {
  id: number;
  customerId: number;
  subscriptionId?: number;
  startDate: string;
  endDate: string;
  pdfUrl?: string;
  totalCharges: number;
  totalPayments: number;
  balanceDue: number;
  stationId?: number;
  companyId?: number;
  createdAt: string;
  lineItems?: StatementLineItem[];
}

export interface StatementRequest {
  customerId: number;
  subscriptionId?: number;
  startDate?: string;
  endDate?: string;
  yearMonth?: string;
}

export interface ProfitAndLossSummary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  pppoeRevenue?: number;
  hotspotRevenue?: number;
  startDate: string;
  endDate: string;
}

export interface SpringPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export const EMPTY_PAGE = <T>(size = 20): SpringPage<T> => ({
  content: [],
  totalElements: 0,
  totalPages: 0,
  size,
  number: 0,
  first: true,
  last: true,
  empty: true,
});