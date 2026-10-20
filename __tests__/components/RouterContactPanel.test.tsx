import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RouterContactPanel, when } from "@/components/network/RouterContactPanel";
import { checkUplinkNow, getRouterContact } from "@/actions/uplink";
import type { RouterContact, UplinkCheck } from "@/lib/types/uplink";

vi.mock("@/actions/uplink", () => ({ getRouterContact: vi.fn(), checkUplinkNow: vi.fn() }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const now = Date.now();
const iso = (msAgo: number) => new Date(now - msAgo).toISOString();

const check: UplinkCheck = {
  routerId: 67, routerName: "Beesmart K - Tukutane", companyId: "CMP-BST-002", checkedAt: iso(30_000), checkKind: "AUTO",
  checkedBy: null, status: "DOWN", reason: "No contact", tunnelIp: "10.8.16.7", publicIp: "102.204.179.18",
  provider: "Telcoptics", handshakeAgeS: 259_200, radiusAgeS: null, radiusOnline: 0, defaultRouteOk: null, wanRunning: null,
  pingLossPct: null, pingAvgMs: null, wanRxBps: null, wanTxBps: null, probeError: null,
  failedPurchases24h: null, unconfirmedPurchases24h: null,
};

const silent: RouterContact = {
  routerId: 67, routerName: "Beesmart K - Tukutane", tunnelIp: "10.8.16.7", latest: check,
  historyFrom: iso(14 * 86_400_000), lastTunnelAt: iso(259_200_000), lastSignInReportAt: iso(259_000_000),
  lastLoginAt: iso(300_000_000), contactLostAt: iso(259_000_000),
  publicIp: "102.204.179.18", provider: "Telcoptics", publicIpSince: iso(14 * 86_400_000),
  previousPublicIp: null, previousProvider: null, previousPublicIpUntil: null,
  serverHasTunnel: true, serverKeyMatches: null, linkedByZtp: true, recordHasKey: false, completedCommands: 1,
  lastCommand: { status: "COMPLETED", issuedAt: iso(345_600_000), fetchedAt: iso(345_500_000), updatedAt: iso(345_400_000), expiresAt: iso(342_000_000) },
  findings: [
    { level: "RED", text: "This router's record has lost its tunnel key." },
    { level: "RED", text: "No contact since 17 Oct 15:46. Call the site. Do not reset or reconfigure the router." },
  ],
};

beforeEach(() => vi.clearAllMocks());

describe("RouterContactPanel", () => {
  it("shows what to do and every channel of a silent router", async () => {
    vi.mocked(getRouterContact).mockResolvedValue({ data: silent, error: null });
    render(<RouterContactPanel routerId={67} />);
    await waitFor(() => expect(screen.getByText(/Do not reset or reconfigure the router/)).toBeTruthy());
    expect(screen.getAllByRole("alert")).toHaveLength(2);
    expect(screen.getByText("No contact")).toBeTruthy();
    expect(screen.getByText("Contact lost")).toBeTruthy();
    expect(screen.getByText("missing")).toBeTruthy();              // the record's key
    expect(screen.getByText("for 14 days or more")).toBeTruthy();  // same public address throughout
    expect(screen.getByText("ran to the end")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Check now" })).toBeNull();
    expect(getRouterContact).toHaveBeenCalledWith(67);
  });

  it("says when everything is current, and shows a change of public address", async () => {
    vi.mocked(getRouterContact).mockResolvedValue({ data: {
      ...silent, latest: { ...check, status: "UP", handshakeAgeS: 40 }, contactLostAt: null, recordHasKey: true,
      lastTunnelAt: iso(40_000), publicIp: "41.90.1.2", provider: "Safaricom", publicIpSince: iso(86_400_000),
      previousPublicIp: "102.204.179.18", previousProvider: "Telcoptics", previousPublicIpUntil: iso(86_460_000), findings: [],
    }, error: null });
    render(<RouterContactPanel routerId={67} />);
    await waitFor(() => expect(screen.getByText("Every channel is current. Nothing to do.")).toBeTruthy());
    expect(screen.getByText("Before that")).toBeTruthy();
    expect(screen.getByText("102.204.179.18")).toBeTruthy();
    expect(screen.queryByText("Contact lost")).toBeNull();
  });

  it("runs a check now and reads the contact again", async () => {
    vi.mocked(getRouterContact).mockResolvedValue({ data: silent, error: null });
    vi.mocked(checkUplinkNow).mockResolvedValue({ data: { ...check, status: "UP" }, error: null });
    render(<RouterContactPanel routerId={67} canCheck />);
    await waitFor(() => expect(getRouterContact).toHaveBeenCalledTimes(1));
    await userEvent.click(screen.getByRole("button", { name: "Check now" }));
    await waitFor(() => expect(getRouterContact).toHaveBeenCalledTimes(2));
    expect(checkUplinkNow).toHaveBeenCalledWith(67);
  });

  it("shows the error when the contact cannot be read", async () => {
    vi.mocked(getRouterContact).mockResolvedValue({ data: null, error: "Access Denied" });
    render(<RouterContactPanel routerId={67} />);
    await waitFor(() => expect(screen.getByRole("alert").textContent).toBe("Access Denied"));
  });

  it("formats a time with its age", () => {
    expect(when(null)).toBe("—");
    expect(when(new Date(now - 90_000).toISOString(), now)).toMatch(/· 1 min ago$/);
  });
});
