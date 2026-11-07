import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import InvestorsClient from "@/app/(dashboard)/finance/investors/_components/InvestorsClient";
import type { InvestorSummary } from "@/lib/types/investor";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace, refresh: vi.fn() }) }));
vi.mock("@/providers/CompanyScopeProvider", () => ({
  useCompanyScope: () => ({ requireCompany: () => true, companyCode: null }),
}));
vi.mock("@/actions/investorRegistry", () => ({}));
vi.mock("@/actions/platformFees", () => ({}));
vi.mock("@/actions/investorMessages", () => ({}));

const base: InvestorSummary = {
  id: "i1", code: "INV-000018", legalName: "Adrinold01", contactName: null, phone: null, email: null,
  status: "ACTIVE", companies: [], agreementCount: 1, routerCount: 1, accountCount: 1,
  fees: { charged: 800, paid: 300, outstanding: 500, standing: "DUE", nextDueDate: "2026-11-10", suspendDate: "2026-11-15", owing: [] },
};

describe("Investors list month picker", () => {
  it("shows what is owed now when no month is chosen", () => {
    render(<InvestorsClient investors={[base]} routers={[]} isPlatformAdmin statementMonths={["2026-10", "2026-09"]} />);
    expect(screen.getByText("Charged (all statements)")).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Revenue" })).not.toBeInTheDocument();
  });

  it("switches to a statement month through the address", () => {
    render(<InvestorsClient investors={[base]} routers={[]} isPlatformAdmin statementMonths={["2026-10", "2026-09"]} />);
    fireEvent.change(screen.getByLabelText("Show"), { target: { value: "2026-10" } });
    expect(replace).toHaveBeenCalledWith("/finance/investors?month=2026-10", { scroll: false });
  });

  it("shows the month's revenue, charge and what is left of it", () => {
    const investor: InvestorSummary = {
      ...base,
      month: {
        month: "2026-10", statement: true, hotspotRevenue: 16585, pppoeCustomers: 4, charged: 597.55, paid: 100,
        outstanding: 497.55, standing: "DUE", dueDate: "2026-11-10", suspendDate: "2026-11-15",
      },
    };
    render(<InvestorsClient investors={[investor]} routers={[]} isPlatformAdmin month="2026-10" statementMonths={["2026-10"]} />);
    expect(screen.getByRole("columnheader", { name: "Revenue" })).toBeInTheDocument();
    const row = screen.getByText("Adrinold01").closest("tr")!;
    expect(within(row).getByText("4 paying PPPoE")).toBeInTheDocument();
    expect(within(row).getByText(/497\.55/)).toBeInTheDocument();
  });

  it("says so when an investor has no statement for the month", () => {
    const investor: InvestorSummary = {
      ...base,
      month: {
        month: "2026-10", statement: false, hotspotRevenue: 0, pppoeCustomers: 0, charged: 0, paid: 0,
        outstanding: 0, standing: "GOOD", dueDate: null, suspendDate: null,
      },
    };
    render(<InvestorsClient investors={[investor]} routers={[]} isPlatformAdmin month="2026-10" statementMonths={["2026-10"]} />);
    expect(screen.getByText("No statement")).toBeInTheDocument();
  });
});
