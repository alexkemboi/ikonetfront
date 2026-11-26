import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { OverviewKpiCards } from "@/components/dashboard/OverviewKpiCards";

const base = {
  paymentsTodayCount: 0,
  activePppoeSubscriptions: 0,
  onlineCount: 0,
  online: null,
  smsCredits: null,
  smsCreditLow: false,
  accessPointsSeen: null,
  accessPointsNotSeen: null,
  mikrotikOnline: null,
  mikrotikTotal: null,
  customers: null,
};

describe("OverviewKpiCards", () => {
  it("shows today's payments, routers and access points instead of revenue", () => {
    render(
      <OverviewKpiCards
        {...base}
        paymentsTodayCount={12}
        onlineCount={34}
        accessPointsSeen={9}
        accessPointsNotSeen={2}
        mikrotikOnline={3}
        mikrotikTotal={5}
        customers={{ pppoe: 250, hotspot: 990, tv: 10 }}
      />
    );

    expect(screen.queryByText("REVENUE TODAY")).not.toBeInTheDocument();
    expect(screen.getByText("CUSTOMERS")).toBeInTheDocument();
    expect(screen.getByText("1,250")).toBeInTheDocument();
    expect(screen.getByText("Hotspot 990")).toBeInTheDocument();
    expect(screen.getByText("PPPoE 250")).toBeInTheDocument();
    expect(screen.getByText("TV 10")).toBeInTheDocument();
    expect(screen.getByText("PAYMENTS TODAY")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("completed since midnight")).toBeInTheDocument();
    expect(screen.queryByText(/KES/)).not.toBeInTheDocument();
    expect(screen.getByText("MIKROTIKS ONLINE")).toBeInTheDocument();
    expect(screen.getByText("of 5 routers · 2 offline")).toBeInTheDocument();
    expect(screen.getByText("ACCESS POINTS SEEN")).toBeInTheDocument();
    expect(screen.getByText("9")).toBeInTheDocument();
    expect(screen.getByText("ACCESS POINTS NOT SEEN")).toBeInTheDocument();
    expect(screen.getByText("watched access points gone quiet")).toBeInTheDocument();
    expect(screen.getByText("Balance unavailable")).toBeInTheDocument();
    expect(screen.getByText("34")).toBeInTheDocument();
    expect(screen.getByText("sessions connected · breakdown unavailable")).toBeInTheDocument();
  });

  it("shows a dash when router and access point counts are unavailable", () => {
    render(<OverviewKpiCards {...base} />);

    expect(screen.getByText("Router status unavailable")).toBeInTheDocument();
    expect(screen.getByText("Customer count unavailable")).toBeInTheDocument();
    expect(screen.getAllByText("Access point status unavailable")).toHaveLength(2);
  });

  it("splits online sessions by service instead of dividing hotspot by PPPoE subscriptions", () => {
    const { container } = render(
      <OverviewKpiCards
        {...base}
        activePppoeSubscriptions={1}
        onlineCount={41}
        online={{ total: 41, hotspot: 41, pppoe: 0 }}
        mikrotikOnline={7}
        mikrotikTotal={4}
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
