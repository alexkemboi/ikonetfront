import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RouterUplinkPanel } from "@/components/network/RouterUplinkPanel";
import { checkUplinkNow, getUplink, getUplinkHistory } from "@/actions/uplink";
import type { UplinkCheck } from "@/lib/types/uplink";

vi.mock("@/actions/uplink", () => ({ getUplink: vi.fn(), getUplinkHistory: vi.fn(), checkUplinkNow: vi.fn() }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const base: UplinkCheck = {
  routerId: 0, routerName: "", companyId: "CMP-BST-006", checkedAt: new Date().toISOString(), checkKind: "AUTO",
  checkedBy: null, status: "UP", reason: "Internet reachable from the router", tunnelIp: null, publicIp: null,
  provider: null, handshakeAgeS: 40, radiusAgeS: 60, radiusOnline: 30, defaultRouteOk: true, wanRunning: true,
  pingLossPct: 0, pingAvgMs: 48, wanRxBps: 4_000_000, wanTxBps: 800_000, probeError: null,
  failedPurchases24h: 0, unconfirmedPurchases24h: 0,
};

const tukutane: UplinkCheck = {
  ...base, routerId: 100, routerName: "Beesmart K - Tukutane", status: "DOWN", tunnelIp: "10.8.16.7",
  publicIp: "102.204.179.18", provider: "Telcoptics", handshakeAgeS: 42_564, radiusAgeS: 43_200, radiusOnline: 0,
  reason: "No contact: tunnel silent for 11 h 49 min, RADIUS silent for 12 h 0 min",
  pingLossPct: null, pingAvgMs: null, wanRxBps: null, wanTxBps: null, failedPurchases24h: 3, unconfirmedPurchases24h: 5,
};
const westlands: UplinkCheck = {
  ...base, routerId: 90, routerName: "ADRINOLD-WESTLANDS", tunnelIp: "10.8.1.11", publicIp: "129.222.147.170",
  provider: "Starlink",
};

beforeEach(() => vi.clearAllMocks());

describe("RouterUplinkPanel", () => {
  it("raises a site without internet and shows its provider and purchases", () => {
    render(<RouterUplinkPanel initial={[tukutane, westlands]} />);
    const alert = screen.getByRole("alert");
    expect(within(alert).getByText("A site has no working internet")).toBeTruthy();
    expect(within(alert).getByText(/Beesmart K - Tukutane/)).toBeTruthy();
    expect(screen.getByText("No contact")).toBeTruthy();
    expect(screen.getByText("Internet up")).toBeTruthy();
    expect(screen.getByText("Starlink")).toBeTruthy();
    expect(screen.getByText("11 h 49 min ago")).toBeTruthy();
    expect(screen.queryByText("Check now")).toBeNull();   // read-only without canCheck
  });

  it("runs a check now and shows its result", async () => {
    vi.mocked(checkUplinkNow).mockResolvedValue({ data: { ...tukutane, status: "UP", reason: "Internet reachable from the router",
      handshakeAgeS: 20, checkKind: "MANUAL", checkedBy: "mogada" }, error: null });
    render(<RouterUplinkPanel initial={[tukutane]} canCheck />);
    await userEvent.click(screen.getByRole("button", { name: /Check now/ }));
    await waitFor(() => expect(screen.getByText("Internet up")).toBeTruthy());
    expect(checkUplinkNow).toHaveBeenCalledWith(100);
    expect(screen.getByText("by mogada")).toBeTruthy();
  });

  it("opens a router's changes of the last 24 hours", async () => {
    const t0 = Date.parse("2026-10-17T18:10:00Z");
    vi.mocked(getUplinkHistory).mockResolvedValue({ data: [
      { ...tukutane, checkedAt: new Date(t0 + 120_000).toISOString() },
      { ...tukutane, checkedAt: new Date(t0 + 60_000).toISOString() },
      { ...tukutane, status: "UP", reason: "Internet reachable from the router", checkedAt: new Date(t0).toISOString() },
    ], error: null });
    render(<RouterUplinkPanel initial={[tukutane]} />);
    await userEvent.click(screen.getByRole("button", { name: "Beesmart K - Tukutane" }));
    await waitFor(() => expect(screen.getByText("Last 24 hours: changes only")).toBeTruthy());
    // two changes: the drop to DOWN and the oldest check, not every minute
    expect(screen.getAllByText(/No contact: tunnel silent/).length).toBeGreaterThan(0);
    expect(getUplinkHistory).toHaveBeenCalledWith(100, 24);
    expect(getUplink).not.toHaveBeenCalled();
  });
});
