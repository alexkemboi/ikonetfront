import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { LiveTransactionTicker } from "@/components/dashboard/LiveTransactionTicker";

const ticker = {
  amount: 861,
  account: "subscriber-1",
  timeAgo: "2m ago",
  healthyRouters: 0,
  totalRouters: 1,
};

describe("LiveTransactionTicker", () => {
  it("shows active router traffic alongside an unhealthy health count", () => {
    render(
      <LiveTransactionTicker
        ticker={ticker}
        routerTraffic={[{
          id: "router-1",
          routerName: "ADRINOLD-WESTLANDS",
          activeSessions: 30,
          dataTransferredGb: 34.9,
          trafficSharePercent: 100,
        }]}
      />
    );

    expect(screen.getByText("0/1 routers healthy")).toBeInTheDocument();
    expect(screen.getByText("ADRINOLD-WESTLANDS · 30 active sessions")).toBeInTheDocument();
  });

  it.each([
    { healthyRouters: 0, totalRouters: 1, text: "0/1 routers healthy", tone: "text-destructive" },
    { healthyRouters: 1, totalRouters: 2, text: "1/2 routers healthy", tone: "text-amber-400" },
    { healthyRouters: 2, totalRouters: 2, text: "2/2 routers healthy", tone: "text-emerald-400" },
    { healthyRouters: 0, totalRouters: 0, text: "No routers reported", tone: "text-muted-foreground" },
  ])("shows $text with matching health styling", ({ healthyRouters, totalRouters, text, tone }) => {
    render(<LiveTransactionTicker ticker={{ ...ticker, healthyRouters, totalRouters }} routerTraffic={[]} />);

    const health = screen.getByText(text).parentElement;
    expect(health).toHaveClass(tone);
  });
});