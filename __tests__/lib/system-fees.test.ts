import { describe, it, expect } from "vitest";
import { systemFeeNextItem } from "@/components/dashboard/systemFeeNextItem";
import { feeHeadline } from "@/components/finance/SystemFeesPanel";
import { feeDate, kes } from "@/components/finance/systemFeeFormat";
import type { CompanyFeeStatus } from "@/lib/types/platformFee";

const status = (over: Partial<CompanyFeeStatus>): CompanyFeeStatus => ({
  companyCode: "CMP-ADR-001",
  companyStatus: "ACTIVE",
  suspendedForFees: false,
  terms: { hotspotFeePercent: 3, pppoeFeePerCustomer: 25, dueDay: 10, suspendDay: 15 },
  totalOutstanding: 650,
  nextDueDate: "2026-10-10",
  nextSuspendDate: "2026-10-15",
  standing: "DUE",
  agreements: [],
  ...over,
});

describe("system fees on the overview and expenses screens", () => {
  it("shows nothing when there is no status or nothing is owed", () => {
    expect(systemFeeNextItem(null)).toBeNull();
    expect(systemFeeNextItem(status({ standing: "GOOD", totalOutstanding: 0 }))).toBeNull();
  });

  it("a fee that is due is listed with its amount and date, not as urgent", () => {
    const item = systemFeeNextItem(status({}));
    expect(item?.title).toBe("System fees: KES 650.00 outstanding");
    expect(item?.description).toContain("10 Oct 2026");
    expect(item?.isUrgent).toBe(false);
    expect(item?.actionUrl).toBe("/finance/expenses");
  });

  it("overdue and suspended fees are urgent and say what happens to service", () => {
    const overdue = systemFeeNextItem(status({ standing: "OVERDUE" }));
    expect(overdue?.isUrgent).toBe(true);
    expect(overdue?.description).toContain("suspended from 15 Oct 2026");

    const company = status({ standing: "SUSPENDED", suspendedForFees: true });
    expect(systemFeeNextItem(company)?.isUrgent).toBe(true);
    expect(feeHeadline(company)).toContain("whole company");
    expect(feeHeadline(status({ standing: "SUSPENDED" }))).toContain("on their routers");
  });

  it("formats money and dates the same way everywhere", () => {
    expect(kes(1035)).toBe("KES 1,035.00");
    expect(feeDate("2026-09-10")).toBe("10 Sept 2026".replace("Sept", new Date("2026-09-10T00:00:00").toLocaleDateString("en-GB", { month: "short" })));
    expect(feeDate(null)).toBe("—");
  });
});
