import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Toaster } from "sonner";
import { RouterActionsDropdown } from "@/components/network/RouterActionsDropdown";
import type { RouterActionsRow } from "@/components/network/RouterActionsDropdown";

const router: RouterActionsRow = {
  // device id and router idxno are deliberately different (two tables).
  id: "1",
  routerId: 7,
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
const mockDelete = vi.fn();

vi.mock("@/actions/network", () => ({
  executeRouterAction: (...args: unknown[]) => mockExecute(...args),
  getRouterMonitoringLatest: (...args: unknown[]) => mockLatest(...args),
  getNetworkDeviceInterfaces: (...args: unknown[]) => mockInterfaces(...args),
  deleteNetworkDevice: (...args: unknown[]) => mockDelete(...args),
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
  mockDelete.mockResolvedValue({
    success: true,
    message: "Device deleted successfully",
    status: 200,
    timestamp: new Date().toISOString(),
    data: { id: 1, name: "RTR-BDK-MSA-001", ipAddress: "10.8.1.10" },
  });
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
      expect(mockExecute).toHaveBeenCalledWith(7, { action: "REBOOT" });
    });
    vi.restoreAllMocks();
  });

  it("calls executeRouterAction with REFRESH", async () => {
    const user = userEvent.setup();
    render(<RouterActionsDropdown router={router} />);

    await user.click(screen.getByRole("button", { name: /router actions/i }));
    await user.click(screen.getByText("Refresh Telemetry"));

    await waitFor(() => {
      expect(mockExecute).toHaveBeenCalledWith(7, { action: "REFRESH" });
    });
  });

  it("does not invoke a server action for a placeholder (non-numeric) router", async () => {
    const user = userEvent.setup();
    render(
      <RouterActionsDropdown
        router={{ ...router, id: "rtr-1", routerId: undefined }}
      />
    );

    await user.click(screen.getByRole("button", { name: /router actions/i }));
    await user.click(screen.getByText("Refresh Telemetry"));

    expect(mockExecute).not.toHaveBeenCalled();
  });

  it("deletes the router after confirmation", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(true);

    render(<RouterActionsDropdown router={router} />);

    await user.click(screen.getByRole("button", { name: /router actions/i }));
    await user.click(screen.getByText("Delete Router"));

    // The delete runs the server action; the follow-up reload is scheduled via
    // setTimeout (450ms) so it's not asserted synchronously — delete success is.
    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith(1);
    });
    vi.restoreAllMocks();
  });

  it("does not delete when confirmation is cancelled", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(false);

    render(<RouterActionsDropdown router={router} />);
    await user.click(screen.getByRole("button", { name: /router actions/i }));
    await user.click(screen.getByText("Delete Router"));

    expect(mockDelete).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });

  it("surfaces a backend delete failure (e.g. 409 sessions-reference) via toast", async () => {
    mockDelete.mockResolvedValue({
      success: false,
      message:
        "Cannot delete device (id=1): 3 hotspot session(s) reference this device. Historical audit data must be preserved. Use deactivate instead.",
      status: 409,
      timestamp: new Date().toISOString(),
      data: null,
    });
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(
      <>
        <Toaster richColors position="top-right" />
        <RouterActionsDropdown router={router} />
      </>
    );
    await user.click(screen.getByRole("button", { name: /router actions/i }));
    await user.click(screen.getByText("Delete Router"));

    await waitFor(() => {
      expect(
        screen.getByText(/Cannot delete device \(id=1\): 3 hotspot sess/i)
      ).toBeInTheDocument();
    });
    vi.restoreAllMocks();
  });

  it("renders the menu outside the table cell via a portal (no layout distortion)", async () => {
    const user = userEvent.setup();
    render(<RouterActionsDropdown router={router} />);

    await user.click(screen.getByRole("button", { name: /router actions/i }));

    const menu = screen.getByRole("menu", { name: /actions for/i });
    // The menu must NOT be a descendant of the trigger's inline container —
    // it is portaled to document.body with position:fixed viewport coords.
    expect(menu).not.toBeNull();
    expect(menu.style.position).toBe("fixed");
    expect(menu.style.zIndex).toBe("9999");
    const td = menu.closest("td");
    expect(td).toBeNull();
  });

  it("flips the menu upward when the anchor is near the bottom of the viewport", async () => {
    const user = userEvent.setup();
    // Mock a viewport where the button sits near the bottom (space below < 280px).
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 600,
    });
    vi.spyOn(window, "innerWidth", "get").mockReturnValue(1280);

    render(<RouterActionsDropdown router={router} />);
    const trigger = screen.getByRole("button", { name: /router actions/i });
    // Button bottom at y=520, top at y=500 → space below = 80px < 280px, and
    // space above (rect.top=500) > 280px, so it must open upward.
    const mockRect = {
      x: 1100,
      y: 500,
      top: 500,
      bottom: 520,
      left: 1100,
      right: 1124,
      width: 24,
      height: 20,
      toJSON: () => ({}),
    } as DOMRect;
    trigger.getBoundingClientRect = vi.fn(() => mockRect);

    await user.click(trigger);
    const menu = screen.getByRole("menu", { name: /actions for/i });

    // Opened upward → coords.openUpwards true → the menu's element class
    // includes slide-in-from-bottom (the flip-up animation variant),
    // and top is clamped so the menu (max 280px tall) fits above the anchor.
    expect(menu.className).toContain("slide-in-from-bottom-2");
    // top should be ≤ 500 (above the anchor at 520) and ≥ 8.
    const top = Number.parseFloat(menu.style.top);
    expect(top).toBeGreaterThanOrEqual(8);
    expect(top).toBeLessThanOrEqual(520);
  });

  it("uses routerId for actions and device id for delete (split id spaces)", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<RouterActionsDropdown router={{ ...router, id: "1", routerId: 7 }} />);

    // Remote actions → network_routers.idxno (7).
    await user.click(screen.getByRole("button", { name: /router actions/i }));
    await user.click(screen.getByText("Refresh Telemetry"));
    await waitFor(() => {
      expect(mockExecute).toHaveBeenCalledWith(7, { action: "REFRESH" });
    });

    // Delete → network_device.id (1).
    await user.click(screen.getByRole("button", { name: /router actions/i }));
    await user.click(screen.getByText("Delete Router"));
    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith(1);
    });
    vi.restoreAllMocks();
  });
});