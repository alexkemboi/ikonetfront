import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { RenewalsDueCard, renewalCountdown } from "@/components/dashboard/RenewalsDueCard";
import type { RenewalDueItem } from "@/lib/types/dashboard";

// 07:25 in Nairobi on 4 Nov (04:25 UTC), when the overview crashed
const NOW = new Date("2026-11-04T04:25:00Z");

describe("RenewalsDueCard", () => {
  it("renders the items exactly as the operations cockpit sends them", () => {
    // OperationsCockpitResponse.RenewalDueItem: accountUsername, phoneMasked, expiryDate, amount
    const items = [
      { accountUsername: "fatma.ahmed", phoneMasked: "254***354", expiryDate: "2026-11-05", amount: 1500 },
    ] as RenewalDueItem[];

    render(<RenewalsDueCard items={items} />);

    expect(screen.getByText("fatma.ahmed")).toBeInTheDocument();
    expect(screen.getByText("F")).toBeInTheDocument();
    expect(screen.getByText("254***354 · Ksh 1,500")).toBeInTheDocument();
    expect(screen.getByText("Next 48 hours · 1 subscribers")).toBeInTheDocument();
  });

  it("does not crash on a row with every field missing", () => {
    render(<RenewalsDueCard items={[{} as RenewalDueItem, { accountUsername: "  " }]} />);

    expect(screen.getAllByText("Unknown account")).toHaveLength(2);
  });
});

describe("renewalCountdown", () => {
  it.each([
    ["2026-11-04", "Ends tonight"],
    ["2026-11-05", "Ends tomorrow"],
    ["2026-11-06", "Ends in 2 days"],
    ["2026-11-03", "Ended"],
    [null, ""],
    ["not-a-date", ""],
  ])("%s → %s", (expiry, label) => {
    expect(renewalCountdown(expiry, NOW)).toBe(label);
  });

  it("counts days on the Nairobi calendar, not UTC", () => {
    // 23:30 UTC on 4 Nov is already 5 Nov in Nairobi
    expect(renewalCountdown("2026-11-05", new Date("2026-11-04T23:30:00Z"))).toBe("Ends tonight");
  });
});
