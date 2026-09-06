import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RouterActionsDropdown } from "@/components/network/RouterActionsDropdown";
import type { RouterActionsRow } from "@/components/network/RouterActionsDropdown";

const router: RouterActionsRow = {
  id: "1",
  name: "RTR-BDK-MSA-001",
  model: "RB5009UG+S+",
  status: "ONLINE",
  managementIp: "10.8.1.10",
  winboxTunnelAddress: "winbox.centipidbilling.com:54910",
};

// The dropdown opens the drawer which calls getRouterMonitoringLatest +
// getNetworkDeviceInterfaces, and it calls executeRouterAction for commands.
// Mock the whole action module so component tests don't reach MSW/network.
const mockExecute = vi.fn();
const mockLatest = vi.fn();
const mockInterfaces = vi.fn();

vi.mock("@/actions/network", () => ({
  executeRouterAction: (...args: unknown[]) => mockExecute(...args),
  getRouterMonitoringLatest: (...args: unknown[]) => mockLatest(...args),
  getNetworkDeviceInterfaces: (...args: unknown[]) => mockInterfaces(...args),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockExecute.mockResolvedValue({
    success: true,
    message: "Router action executed successfully",
    status: 200,
    timestamp: new Date().toISOString(),
    data: {
      routerId: 1,
      routerName: "RTR-BDK-MSA-001",
      ipAddress: "10.8.1.10",
      action: "REFRESH",
      nodeStatus: "ONLINE",
      executionStatus: "SUCCESS",
      message: "Router status refreshed",
      timestamp: new Date().toISOString(),
    },
  });
  mockLatest.mockResolvedValue({
    idxno: 1,
    routerId: 1,
    cpuUsage: 3.5,
    totalMemory: 268435456,
    freeMemory: 218542080,
    activePppoeSessions: 1,
    activeHotspotSessions: 0,
    uptime: "1d 04:22:15",
    latencyMs: 14,
    createdAt: new Date().toISOString(),
  });
  mockInterfaces.mockResolvedValue([]);
});

describe("RouterActionsDropdown", () => {
  it("renders the 3-dot trigger and opens the command menu on click", async () => {
    const user = userEvent.setup();
    render(<RouterActionsDropdown router={router} />);

    expect(
      screen.getByRole("button", { name: /router actions/i })
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /router actions/i }));

    expect(screen.getByText("Live Hardware Vitals")).toBeInTheDocument();
    expect(screen.getByText("Interfaces & Live Traffic")).toBeInTheDocument();
    expect(screen.getByText("Active Subscriber Sessions")).toBeInTheDocument();
    expect(screen.getByText("Refresh Telemetry")).toBeInTheDocument();
    expect(screen.getByText("Reboot Device")).toBeInTheDocument();
    expect(screen.getByText("Launch WinBox Tunnel")).toBeInTheDocument();
  });

  it("opens the telemetry drawer on Live Hardware Vitals", async () => {
    const user = userEvent.setup();
    render(<RouterActionsDropdown router={router} />);

    await user.click(screen.getByRole("button", { name: /router actions/i }));
    await user.click(screen.getByText("Live Hardware Vitals"));

    expect(screen.getByTestId("telemetry-drawer")).toBeInTheDocument();
    expect(screen.getByText("RTR-BDK-MSA-001")).toBeInTheDocument();
    expect(screen.getByText(/hardware vitals/i)).toBeInTheDocument();
  });

  it("opens the drawer Interfaces tab on Interfaces & Traffic", async () => {
    const user = userEvent.setup();
    render(<RouterActionsDropdown router={router} />);

    await user.click(screen.getByRole("button", { name: /router actions/i }));
    await user.click(screen.getByText("Interfaces & Live Traffic"));

    expect(screen.getByTestId("telemetry-drawer")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /interfaces/i })).toHaveAttribute("aria-selected", "true");
  });

  it("opens the drawer Sessions tab on Active Subscriber Sessions", async () => {
    const user = userEvent.setup();
    render(<RouterActionsDropdown router={router} />);

    await user.click(screen.getByRole("button", { name: /router actions/i }));
    await user.click(screen.getByText("Active Subscriber Sessions"));

    expect(screen.getByTestId("telemetry-drawer")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /sessions/i })).toHaveAttribute("aria-selected", "true");
  });

  it("calls executeRouterAction with REBOOT after confirmation", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(true);

    render(<RouterActionsDropdown router={router} />);
    await user.click(screen.getByRole("button", { name: /router actions/i }));
    await user.click(screen.getByText("Reboot Device"));

    await waitFor(() => {
      expect(mockExecute).toHaveBeenCalledWith(1, { action: "REBOOT" });
    });
    vi.restoreAllMocks();
  });

  it("calls executeRouterAction with REFRESH", async () => {
    const user = userEvent.setup();
    render(<RouterActionsDropdown router={router} />);

    await user.click(screen.getByRole("button", { name: /router actions/i }));
    await user.click(screen.getByText("Refresh Telemetry"));

    await waitFor(() => {
      expect(mockExecute).toHaveBeenCalledWith(1, { action: "REFRESH" });
    });
  });

  it("does not invoke a server action for a placeholder (non-numeric) router", async () => {
    const user = userEvent.setup();
    render(
      <RouterActionsDropdown
        router={{ ...router, id: "rtr-1" }}
      />
    );

    await user.click(screen.getByRole("button", { name: /router actions/i }));
    await user.click(screen.getByText("Refresh Telemetry"));

    expect(mockExecute).not.toHaveBeenCalled();
  });
});