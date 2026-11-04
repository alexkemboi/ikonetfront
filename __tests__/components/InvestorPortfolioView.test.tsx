import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import InvestorPortfolioView from "@/components/investors/InvestorPortfolioView";
import type { InvestorPortfolio } from "@/lib/types/investorPortfolio";

// BEDAK-NEWYORK on 2026-10-30: taken over that day, most of the month taken before
const portfolio: InvestorPortfolio = {
  investor: { id: "i1", code: "INV-000001", name: "Bedak", contactName: "Benjamin", phone: null, email: null, status: "ACTIVE" },
  period: "2026-10",
  from: "2026-10-01",
  to: "2026-10-31",
  companyCode: null,
  totals: {
    tookIn: 95020, creditedHotspot: 2445, creditedTv: 0, creditedPppoe: 0, credited: 2445,
    hotspotPurchases: 61, tvPurchases: 0, pppoePayingCustomers: 0,
    hotspotFee: 73.35, pppoeFee: 0, fee: 73.35, net: 2371.65,
    feeCharged: 0, feePaid: 0, feeOutstanding: 0, nextDueDate: null, suspendDate: null, standing: "GOOD",
  },
  routers: [{
    routerId: 96, routerName: "BEDAK-NEWYORK", stationName: "BEDAK-NEWYORK", companyCode: "CMP-BDK-001",
    companyName: "Bedak", agreementId: "a1", agreementCode: "AGR-000012", ownedFrom: "2026-10-30T00:00:00",
    ownedUntil: null, lastSeen: null, tookIn: 95020, creditedHotspot: 2445, creditedTv: 0, creditedPppoe: 0,
    credited: 2445, hotspotPurchases: 61, tvPurchases: 0, pppoePayingCustomers: 0, fee: 73.35, net: 2371.65,
  }],
  daily: [{ day: "2026-10-30", hotspot: 2445, tv: 0, pppoe: 0 }],
  months: [{ period: "2026-10", hotspot: 2445, tv: 0, pppoe: 0, fee: 73.35, feeFromStatement: false }],
  agreements: [{
    id: "a1", code: "AGR-000012", name: "Bedak New York", companyCode: "CMP-BDK-001", companyName: "Bedak",
    startDate: "2026-10-30", endDate: null, status: "ACTIVE",
    rules: [{ serviceType: "HOTSPOT", calculationBasis: "PERCENTAGE_OF_GROSS", rate: 3 },
      { serviceType: "PPPOE", calculationBasis: "FIXED_PER_ACTIVE_SUBSCRIBER", rate: 25 }],
    routerNames: ["BEDAK-NEWYORK"], hotspotBase: 2445, pppoePayers: 0, hotspotFee: 73.35, pppoeFee: 0, fee: 73.35,
    feeCharged: 0, feePaid: 0, feeOutstanding: 0, standing: "GOOD", oldestDueDate: null, suspendDate: null,
    statements: [{ id: "11111111-2222-3333-4444-555555555555", number: "STMT-1", period: "2026-09", hotspotGross: 0, pppoePayers: 0, fee: 0, status: "FINALIZED" }],
  }],
  accounts: [],
};

describe("InvestorPortfolioView", () => {
  it("tells the investor the month in the order money moves", () => {
    render(<InvestorPortfolioView portfolio={portfolio} audience="investor" />);
    expect(screen.getByText("Your routers took in")).toBeInTheDocument();
    expect(screen.getAllByText("Credited to you").length).toBe(2); // the flow and the router table
    expect(screen.getByText("Your net payout")).toBeInTheDocument();
    expect(screen.getAllByText("Paid up").length).toBe(2); // the investor and its one agreement
    expect(screen.getAllByText("BEDAK-NEWYORK").length).toBeGreaterThan(0);
    expect(screen.getByText("Hotspot and TV: 3% of revenue")).toBeInTheDocument();
    expect(screen.getByText("61 purchases · 100% of credited")).toBeInTheDocument();
  });

  it("offers each statement as a PDF invoice", () => {
    render(<InvestorPortfolioView portfolio={portfolio} audience="investor" />);
    expect(screen.getByRole("link", { name: "PDF" })).toHaveAttribute(
      "href", "/api/investor-statements/11111111-2222-3333-4444-555555555555/pdf");
  });

  it("names the investor for an administrator", () => {
    render(<InvestorPortfolioView portfolio={portfolio} audience="admin" />);
    expect(screen.getByText("Bedak's routers took in")).toBeInTheDocument();
    expect(screen.getAllByText("Credited to Bedak").length).toBe(2);
  });
});
