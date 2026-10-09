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
        activePppoeSubscriptions={0}
        onlineCount={34}
        online={null}
        smsCredits={null}
        smsCreditLow={false}
      />
    );

    expect(screen.getByText("KES 861")).toBeInTheDocument();
    expect(screen.getByText("Mobile money: KES 861")).toBeInTheDocument();
    expect(screen.getByText("+2,000% · since midnight")).toBeInTheDocument();
    expect(screen.getByText("Balance unavailable")).toBeInTheDocument();
    expect(screen.getByText("34")).toBeInTheDocument();
    expect(screen.getByText("sessions connected · breakdown unavailable")).toBeInTheDocument();
  });

  it("splits online sessions by service instead of dividing hotspot by PPPoE subscriptions", () => {
    const { container } = render(
      <OverviewKpiCards
        revenueToday={1685}
        revenueChangePercent={-61.2}
        mobileMoneyToday={1685}
        activePppoeSubscriptions={1}
        onlineCount={41}
        online={{ total: 41, hotspot: 41, pppoe: 0 }}
        smsCredits={null}
        smsCreditLow={false}
      />
    );

    expect(screen.getByText("ACTIVE PPPOE CLIENTS")).toBeInTheDocument();
    expect(screen.getByText("0 of 1 online now")).toBeInTheDocument();
    expect(screen.getByText("41")).toBeInTheDocument();
    expect(screen.getByText("Hotspot 41")).toBeInTheDocument();
    expect(screen.getByText("PPPoE 0")).toBeInTheDocument();
    expect(screen.queryByText(/4100%/)).not.toBeInTheDocument();
    // no bar may be wider than its track
    container.querySelectorAll<HTMLElement>("[style]").forEach((el) => {
      expect(parseFloat(el.style.width)).toBeLessThanOrEqual(100);
    });
  });
});