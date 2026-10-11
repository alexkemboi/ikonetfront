import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { AmountsVisibilityProvider } from "@/components/analytics/AmountsVisibility";
import { HeatmapGrid } from "@/components/analytics/HeatmapGrid";
import { KpiRow } from "@/components/analytics/KpiRow";
import { PanelBody } from "@/components/analytics/PanelCard";
import type { AnalyticsKpis, Heatmap, Panel } from "@/lib/types/analytics";

const ok = <T,>(data: T): Panel<T> => ({ status: "AVAILABLE", reason: null, message: null, data });
const failed = <T,>(): Panel<T> => ({ status: "UNAVAILABLE", reason: "SOURCE_ERROR", message: "This figure could not be loaded. Try again shortly.", data: null });

const kpis: AnalyticsKpis = {
  activeSubscribers: ok({ count: 36, newInPeriod: 4 }),
  revenue: ok({ amount: "107620.00", currency: "KES" }),
  arpu: ok({ amount: "50271.00", currency: "KES", windowDays: 30, payingSubscribers: 2 }),
  sessions: ok({ count: 18, averageDurationSeconds: 7800 }),
  dataUsage: ok({ totalBytes: 105_000_000_000, downloadBytes: 58_600_000_000, uploadBytes: 46_400_000_000 }),
  onlineNow: ok({ openSessionCount: 0, asOf: "2026-10-10T08:00:00Z", refreshSeconds: 60 }),
  payments: ok({ count: 6 }),
  overdue: failed(),
};

describe("analytics KPI row", () => {
  it("shows the eight figures in order, and a dash for one that could not be read", () => {
    render(
      <AmountsVisibilityProvider>
        <KpiRow kpis={kpis} period="Daily" />
      </AmountsVisibilityProvider>
    );
    const labels = ["Active subscribers", "Revenue", "ARPU", "Sessions", "Data transferred", "Online now", "Payments", "Overdue"];
    const shown = labels.map((label) => screen.getByText(label));
    for (let i = 1; i < shown.length; i++) {
      expect(shown[i - 1].compareDocumentPosition(shown[i]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }
    expect(screen.getByText("Ksh 107,620")).toBeInTheDocument();
    expect(screen.getByText("Average 2h 10m")).toBeInTheDocument();
    expect(screen.getByText("105.0 GB")).toBeInTheDocument();
    // a measured zero is a zero; a failed read is not
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText("Not available right now")).toBeInTheDocument();
  });

  it("one switch hides every money figure and leaves counts visible", () => {
    render(
      <AmountsVisibilityProvider>
        <KpiRow kpis={kpis} period="Daily" />
      </AmountsVisibilityProvider>
    );
    fireEvent.click(screen.getAllByRole("button", { name: "Hide amounts" })[0]);
    expect(screen.queryByText("Ksh 107,620")).not.toBeInTheDocument();
    expect(screen.queryByText("Ksh 50,271")).not.toBeInTheDocument();
    expect(screen.getByText("18")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Show amounts" }).length).toBeGreaterThan(0);
    fireEvent.click(screen.getAllByRole("button", { name: "Show amounts" })[0]);
    expect(screen.getByText("Ksh 107,620")).toBeInTheDocument();
  });
});

describe("analytics panel states", () => {
  it("tells missing, switched off and empty apart", () => {
    const { rerender } = render(<PanelBody panel={failed<number[]>()}>{() => <p>data</p>}</PanelBody>);
    expect(screen.getByRole("alert")).toHaveTextContent("could not be loaded");

    rerender(
      <PanelBody panel={{ status: "NOT_CONFIGURED", reason: "OUTAGE_TRACKING_OFF", message: "Turn outage detection on to start tracking downtime.", data: null } as Panel<number[]>}>
        {() => <p>data</p>}
      </PanelBody>
    );
    expect(screen.getByRole("status")).toHaveTextContent("Turn outage detection on");

    rerender(
      <PanelBody panel={ok<number[]>([])} isEmpty={(rows) => rows.length === 0} empty="No per-plan traffic recorded.">
        {() => <p>data</p>}
      </PanelBody>
    );
    expect(screen.getByRole("status")).toHaveTextContent("No per-plan traffic recorded.");

    rerender(<PanelBody panel={ok([1])}>{() => <p>data</p>}</PanelBody>);
    expect(screen.getByText("data")).toBeInTheDocument();
  });

  it("names every heatmap cell so its value does not depend on colour", () => {
    const heatmap: Heatmap = {
      cells: [{ isoWeekday: 1, hour: 9, count: 12 }, { isoWeekday: 7, hour: 21, count: 1 }],
      max: 12, total: 13, sampleCount: 13, minimumSamples: 1, sufficient: true,
    };
    render(<HeatmapGrid heatmap={heatmap} unit={{ one: "payment", many: "payments" }} />);
    expect(screen.getByTitle("Mon 09:00 · 12 payments")).toBeInTheDocument();
    expect(screen.getByTitle("Sun 21:00 · 1 payment")).toBeInTheDocument();
    expect(screen.getByTitle("Tue 03:00 · 0 payments")).toBeInTheDocument();
  });
});
