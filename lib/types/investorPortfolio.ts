/**
 * One investor's month (backend `InvestorPortfolio`): what their routers took in, what is
 * credited to them by service, the system fee on that (worked out as the month-end statement
 * does), what they have paid, and the agreements behind it, company by company.
 *
 * Served bare to the investor (`GET /investor/portfolio`) and in the ApiResponse envelope to
 * administrators (`GET /investors/{id}/portfolio`).
 */

export type FeeStanding = "GOOD" | "DUE" | "OVERDUE" | "SUSPENDED";

export interface PortfolioParty {
  id: string;
  code: string;
  name: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  status: "ACTIVE" | "RETIRED" | string;
}

export interface PortfolioTotals {
  /** Everything the routers took over the whole month, whoever it was credited to. */
  tookIn: number;
  creditedHotspot: number;
  creditedTv: number;
  creditedPppoe: number;
  credited: number;
  hotspotPurchases: number;
  tvPurchases: number;
  pppoePayingCustomers: number;
  hotspotFee: number;
  pppoeFee: number;
  fee: number;
  net: number;
  /** All time, from issued statements and recorded payments. */
  feeCharged: number;
  feePaid: number;
  feeOutstanding: number;
  nextDueDate: string | null;
  suspendDate: string | null;
  standing: FeeStanding;
}

export interface PortfolioRouter {
  routerId: number;
  routerName: string;
  stationName: string | null;
  companyCode: string | null;
  companyName: string | null;
  agreementId: string | null;
  agreementCode: string | null;
  ownedFrom: string | null;
  ownedUntil: string | null;
  lastSeen: string | null;
  tookIn: number;
  creditedHotspot: number;
  creditedTv: number;
  creditedPppoe: number;
  credited: number;
  hotspotPurchases: number;
  tvPurchases: number;
  pppoePayingCustomers: number;
  /** This router's share of its agreement's fee for the month. */
  fee: number;
  net: number;
}

export interface PortfolioDay {
  day: string;
  hotspot: number;
  tv: number;
  pppoe: number;
}

export interface PortfolioMonth {
  period: string;
  hotspot: number;
  tv: number;
  pppoe: number;
  fee: number;
  feeFromStatement: boolean;
}

export interface PortfolioRule {
  serviceType: "HOTSPOT" | "PPPOE" | string;
  calculationBasis: "PERCENTAGE_OF_GROSS" | "FIXED_PER_ACTIVE_SUBSCRIBER" | "FIXED_MONTHLY" | string;
  rate: number;
}

export interface PortfolioStatement {
  number: string;
  period: string;
  hotspotGross: number;
  pppoePayers: number;
  fee: number;
  status: string;
}

export interface PortfolioAgreement {
  id: string;
  code: string;
  name: string;
  companyCode: string | null;
  companyName: string | null;
  startDate: string;
  endDate: string | null;
  status: string;
  rules: PortfolioRule[];
  routerNames: string[];
  hotspotBase: number;
  pppoePayers: number;
  hotspotFee: number;
  pppoeFee: number;
  fee: number;
  feeCharged: number;
  feePaid: number;
  feeOutstanding: number;
  standing: FeeStanding;
  oldestDueDate: string | null;
  suspendDate: string | null;
  statements: PortfolioStatement[];
}

export interface PortfolioAccount {
  username: string;
  fullName: string | null;
  active: boolean;
}

export interface InvestorPortfolio {
  investor: PortfolioParty;
  period: string;
  from: string;
  to: string;
  companyCode: string | null;
  totals: PortfolioTotals;
  routers: PortfolioRouter[];
  daily: PortfolioDay[];
  months: PortfolioMonth[];
  agreements: PortfolioAgreement[];
  accounts: PortfolioAccount[];
}
