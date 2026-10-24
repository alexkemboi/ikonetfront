import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Toaster } from "sonner";
import { RouterActionsDropdown } from "@/components/network/RouterActionsDropdown";
import type { RouterActionsRow } from "@/components/network/RouterActionsDropdown";

const router: RouterActionsRow = {
  // device id and router idxno are deliberately different (two tables).
  id: "42",
  deviceId: 42,
  routerId: 7,
  name: "RTR-BDK-MSA-001",
  model: "RB5009UG+S+",
  status: "ONLINE",
  managementIp: "10.8.1.10",
  winboxTunnelAddress: "winbox.centipidbilling.com:54910",
  links: {
    router: "/network-routers/7",
    routerAction: "/network-routers/7/action",
    telemetryLatest: "/network/monitoring/router/7/latest",
    deviceInterfaces: "/network-devices/42/interfaces",
    deviceStatus: "/network-devices/42/status",
    deviceDelete: "/network-devices/42",
  },
};

// The dropdown opens the drawer which calls getRouterMonitoringLatest +
// getNetworkDeviceInterfaces, and it calls executeRouterAction for commands
// (plus allocate/deallocateTunnel for the WinBox lease). Mock the whole action
// module so component tests don't reach MSW/network.
const mockExecute = vi.fn();
const mockLatest = vi.fn();
const mockInterfaces = vi.fn();
const mockDelete = vi.fn();
const mockAllocate = vi.fn();
const mockDeallocate = vi.fn();

// the menu reads the signed-in role: remote access (WinBox, web console) is for 01 and SYSADMIN
const sessionRole = { current: "01" };
vi.mock("next-auth/react", () => ({ useSession: () => ({ data: { user: { role: sessionRole.current } } }) }));

vi.mock("@/actions/network", () => ({
  executeRouterAction: (...args: unknown[]) => mockExecute(...args),
  getRouterMonitoringLatest: (...args: unknown[]) => mockLatest(...args),
  getNetworkDeviceInterfaces: (...args: unknown[]) => mockInterfaces(...args),
  deleteNetworkDevice: (...args: unknown[]) => mockDelete(...args),
  allocateTunnel: (...args: unknown[]) => mockAllocate(...args),
  deallocateTunnel: (...args: unknown[]) => mockDeallocate(...args),
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
  mockAllocate.mockResolvedValue({
    success: true,
    message: "Remote access tunnel allocated",
    status: 200,
    timestamp: new Date().toISOString(),
    data: {
      deviceId: 1,
      routerName: "RTR-BDK-MSA-001",
      winboxEndpoint: "92.205.59.234:51247",
      port: 51247,
      webConsoleUrl: "https://webfig-1.beesmartbedak.com/",
      tunnelExpiresAt: new Date(Date.now() + 7200000).toISOString(),
    },
  });
  mockDeallocate.mockResolvedValue({
    success: true,
    message: "Remote access tunnel deallocated",
    status: 200,
    timestamp: new Date().toISOString(),
    data: { deviceId: 1, routerName: "RTR-BDK-MSA-001", port: null, webConsoleUrl: null },
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
    expect(screen.getByText("Diagnose Health")).toBeInTheDocument();
    expect(screen.getByText("Sync Router Time")).toBeInTheDocument();
    expect(screen.getByText("Sync Hotspot Files")).toBeInTheDocument();
    expect(screen.getByText("Reprovision Router")).toBeInTheDocument();
    expect(screen.getByText("Copy WinBox host:port")).toBeInTheDocument();
    expect(screen.getByText("Open in WinBox")).toBeInTheDocument();
    expect(screen.getByText("Regenerate WinBox Port")).toBeInTheDocument();
    expect(screen.getByText("Refresh Telemetry")).toBeInTheDocument();
    expect(screen.getByText("Reboot Device")).toBeInTheDocument();
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
      expect(mockExecute).toHaveBeenCalledWith(7, { action: "REBOOT" }, undefined, "/network-routers/7/action");
    });
    vi.restoreAllMocks();
  });

  it("calls executeRouterAction with REFRESH", async () => {
    const user = userEvent.setup();
    render(<RouterActionsDropdown router={router} />);

    await user.click(screen.getByRole("button", { name: /router actions/i }));
    await user.click(screen.getByText("Refresh Telemetry"));

    await waitFor(() => {
      expect(mockExecute).toHaveBeenCalledWith(7, { action: "REFRESH" }, undefined, "/network-routers/7/action");
    });
  });

  it("opens the Diagnose Health modal rendered from details", async () => {
    mockExecute.mockResolvedValue({
      success: true,
      message: "Router diagnostics complete",
      status: 200,
      timestamp: new Date().toISOString(),
      data: {
        routerId: 7,
        routerName: "RTR-BDK-MSA-001",
        ipAddress: "10.8.1.10",
        action: "DIAGNOSE",
        nodeStatus: "ONLINE",
        executionStatus: "SUCCESS",
        message: "Router diagnostics complete",
        details: {
          cpuLoad: "12",
          uptime: "1d 04:22:15",
          temperature: "48",
          wanPingLatency: "23ms",
          packetLoss: "0%",
          radiusStatus: "10.8.0.1(hotspot,ppp)",
          status: "OK",
        },
        timestamp: new Date().toISOString(),
      },
    });
    const user = userEvent.setup();
    render(<RouterActionsDropdown router={router} />);

    await user.click(screen.getByRole("button", { name: /router actions/i }));
    await user.click(screen.getByText("Diagnose Health"));

    await waitFor(() => {
      expect(mockExecute).toHaveBeenCalledWith(7, { action: "DIAGNOSE" }, undefined, "/network-routers/7/action");
    });
    expect(screen.getByTestId("diagnose-modal")).toBeInTheDocument();
    expect(screen.getByText("12%")).toBeInTheDocument();
    expect(screen.getByText(/23ms/)).toBeInTheDocument();
    expect(screen.getByText("OK")).toBeInTheDocument();
  });

  it("regenerates the WinBox port via deallocate then allocate", async () => {
    const user = userEvent.setup();
    render(<RouterActionsDropdown router={router} />);

    await user.click(screen.getByRole("button", { name: /router actions/i }));
    await user.click(screen.getByText("Regenerate WinBox Port"));

    await waitFor(() => {
      expect(mockDeallocate).toHaveBeenCalledWith(42);
    });
    await waitFor(() => {
      expect(mockAllocate).toHaveBeenCalledWith(42);
    });
  });

  it("does not invoke a server action for a placeholder (non-numeric) router", async () => {
    const user = userEvent.setup();
    render(
      <RouterActionsDropdown
        router={{
          ...router,
          deviceId: undefined,
          routerId: undefined,
          links: {
            router: null,
            routerAction: null,
            telemetryLatest: null,
            deviceInterfaces: null,
            deviceStatus: null,
            deviceDelete: null,
          },
        }}
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
      expect(mockDelete).toHaveBeenCalledWith(42, undefined, "/network-devices/42");
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

  /** The open menu measures this tall (jsdom does no layout); restore with the returned function. */
  function menuHeight(px: number): () => void {
    const original = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollHeight");
    Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
      configurable: true,
      get(this: HTMLElement) {
        return this.getAttribute("role") === "menu" ? px : 0;
      },
    });
    return () => {
      if (original) Object.defineProperty(HTMLElement.prototype, "scrollHeight", original);
      else delete (HTMLElement.prototype as { scrollHeight?: number }).scrollHeight;
    };
  }

  async function openAt(viewportHeight: number, rect: { top: number; bottom: number }) {
    const user = userEvent.setup();
    Object.defineProperty(window, "innerHeight", { configurable: true, value: viewportHeight });
    vi.spyOn(window, "innerWidth", "get").mockReturnValue(1280);
    render(<RouterActionsDropdown router={router} />);
    const trigger = screen.getByRole("button", { name: /router actions/i });
    trigger.getBoundingClientRect = vi.fn(
      () =>
        ({
          x: 1100, y: rect.top, top: rect.top, bottom: rect.bottom, left: 1100, right: 1124,
          width: 24, height: rect.bottom - rect.top, toJSON: () => ({}),
        }) as DOMRect
    );
    await user.click(trigger);
    return screen.getByRole("menu", { name: /actions for/i });
  }

  it("flips the menu upward when it does not fit below the button, ending just above it", async () => {
    const restore = menuHeight(450);
    try {
      // 80px below the button, 500px above: the whole 450px menu goes above
      const menu = await openAt(600, { top: 500, bottom: 520 });
      expect(menu.className).toContain("slide-in-from-bottom-2");
      expect(Number.parseFloat(menu.style.top)).toBe(500 - 6 - 450);
      expect(menu.style.maxHeight).toBe("450px");
    } finally {
      restore();
    }
  });

  it("scrolls a menu taller than the room on either side instead of covering the button", async () => {
    const restore = menuHeight(450);
    try {
      // 300px window, button in the middle: 125px above and 129px below, so it opens below and scrolls
      const menu = await openAt(300, { top: 140, bottom: 157 });
      expect(menu.className).toContain("slide-in-from-top-2");
      expect(Number.parseFloat(menu.style.top)).toBe(157 + 6);
      expect(menu.style.maxHeight).toBe(`${300 - 157 - 6 - 8}px`);
    } finally {
      restore();
    }
  });

  it("uses routerId for actions and device id for delete (split id spaces)", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<RouterActionsDropdown router={{ ...router, deviceId: 42, routerId: 7 }} />);

    // Remote actions → network_routers.idxno (7).
    await user.click(screen.getByRole("button", { name: /router actions/i }));
    await user.click(screen.getByText("Refresh Telemetry"));
    await waitFor(() => {
      expect(mockExecute).toHaveBeenCalledWith(7, { action: "REFRESH" }, undefined, "/network-routers/7/action");
    });

    // Delete → network_device.id (1).
    await user.click(screen.getByRole("button", { name: /router actions/i }));
    await user.click(screen.getByText("Delete Router"));
    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith(42, undefined, "/network-devices/42");
    });
    vi.restoreAllMocks();
  });

  it("keeps the table row menu short and links to the router page", async () => {
    const user = userEvent.setup();
    render(<RouterActionsDropdown router={router} variant="row" />);
    await user.click(screen.getByRole("button", { name: /router actions/i }));

    expect(screen.getByRole("menuitem", { name: /open router page/i })).toHaveAttribute("href", "/network/routers/7");
    expect(screen.getByText("Open in WinBox")).toBeInTheDocument();
    expect(screen.getByText("Reboot Device")).toBeInTheDocument();
    expect(screen.getByText("Delete Router")).toBeInTheDocument();
    for (const moved of ["Live Hardware Vitals", "Sync Router Time", "Sync Hotspot Files", "Reprovision Router",
      "Regenerate WinBox Port", "Refresh Telemetry", "Compensate Subscribers", "Diagnose Health"]) {
      expect(screen.queryByText(moved)).not.toBeInTheDocument();
    }
  });

  it("shows Diagnose and Reprovision as buttons on the router page", async () => {
    const user = userEvent.setup();
    render(<RouterActionsDropdown router={router} variant="page" />);

    await user.click(screen.getByRole("button", { name: /^diagnose$/i }));
    await waitFor(() =>
      expect(mockExecute).toHaveBeenCalledWith(7, { action: "DIAGNOSE" }, undefined, "/network-routers/7/action")
    );

    await user.click(screen.getByRole("button", { name: /router actions/i }));
    expect(screen.getByText("Sync Hotspot Files")).toBeInTheDocument();
    expect(screen.queryByText("Live Hardware Vitals")).not.toBeInTheDocument();
    expect(screen.queryByText("Reprovision Router")).not.toBeInTheDocument();
  });

  it("hides WinBox and the web console from management", async () => {
    sessionRole.current = "02";
    try {
      const user = userEvent.setup();
      render(<RouterActionsDropdown router={router} />);
      await user.click(screen.getByRole("button", { name: /router actions/i }));
      expect(screen.queryByText("Copy WinBox host:port")).not.toBeInTheDocument();
      expect(screen.queryByText("Regenerate WinBox Port")).not.toBeInTheDocument();
    } finally {
      sessionRole.current = "01";
    }
  });
});
