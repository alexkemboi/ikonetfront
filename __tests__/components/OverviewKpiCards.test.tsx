import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { OverviewKpiCards } from "@/components/dashboard/OverviewKpiCards";

describe("OverviewKpiCards", () => {
  it("shows the operations-cockpit revenue values without abbreviation", () => {
    render(
      <OverviewKpiCards
        revenueToday={861}
        revenueChangePercent={2000}
        mobileMoneyToday={861}
        activeSubscriptions={0}
        onlinePercentage={0}
        onlineCount={34}
        smsCredits={null}
        smsCreditLow={false}
      />
    );

    expect(screen.getByText("KES 861")).toBeInTheDocument();
    expect(screen.getByText("Mobile money: KES 861")).toBeInTheDocument();
    expect(screen.getByText("+2,000% · since midnight")).toBeInTheDocument();
    expect(screen.getByText("Balance unavailable")).toBeInTheDocument();
  });
});