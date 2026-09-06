import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RouterTelemetryDrawer } from "@/components/network/RouterTelemetryDrawer";

const router = {
  id: "1",
  name: "RTR-BDK-MSA-001",
  managementIp: "10.8.1.10",
};

// Mock the monitoring latest + interfaces server actions (MSW fixtures would
// otherwise drive the SSE/polling paths); the drawer's vitals tab renders from
// the polled snapshot.
const mockLatest = vi.fn();
const mockInterfaces = vi.fn();

vi.mock("@/actions/network", () => ({
  getRouterMonitoringLatest: (...args: unknown[]) => mockLatest(...args),
  getNetworkDeviceInterfaces: (...args: unknown[]) => mockInterfaces(...args),
}));

beforeEach(() => {
  vi.clearAllMocks();
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

describe("RouterTelemetryDrawer", () => {
  it("renders the drawer header and default vitals tab with live values", async () => {
    render(
      <RouterTelemetryDrawer router={router} defaultTab="vitals" onClose={() => {}} />
    );

    expect(screen.getByTestId("telemetry-drawer")).toBeInTheDocument();
    expect(screen.getByText("RTR-BDK-MSA-001")).toBeInTheDocument();

    await waitFor(() => {
      // Polled snapshot renders CPU + RAM values
      expect(screen.getByText(/3\.5%/i)).toBeInTheDocument();
      expect(screen.getByText(/208\.4 MiB/i)).toBeInTheDocument();
      expect(screen.getByText(/1d 04:22:15/i)).toBeInTheDocument();
    });
  });

  it("switches to the interfaces tab and fetches interfaces", async () => {
    mockInterfaces.mockResolvedValue([
      {
        type: "ether",
        ".id": "*1",
        name: "ether1",
        "default-name": "ether1",
        mtu: "1500",
        "actual-mtu": "1500",
        l2mtu: "1598",
        "max-l2mtu": "1598",
        "mac-address": "32:A2:F1:9C:4D:02",
        "link-downs": "0",
        "rx-byte": "1500000000",
        "tx-byte": "89500000",
        "rx-packet": "100000",
        "tx-packet": "50000",
        "tx-queue-drop": "0",
        "fp-rx-byte": "0",
        "fp-tx-byte": "0",
        "fp-rx-packet": "0",
        "fp-tx-packet": "0",
        running: "true",
        disabled: "false",
      },
    ]);

    const user = userEvent.setup();
    render(
      <RouterTelemetryDrawer router={router} defaultTab="vitals" onClose={() => {}} />
    );

    await user.click(screen.getByRole("tab", { name: /interfaces/i }));

    expect(mockInterfaces).toHaveBeenCalledWith(1);
    await waitFor(() => {
      expect(screen.getByText(/ether1/i)).toBeInTheDocument();
      expect(screen.getByText(/1\.40 GiB/i)).toBeInTheDocument(); // rx-byte formatted
      expect(screen.getByText(/85\.4 MiB/i)).toBeInTheDocument(); // tx-byte formatted
    });
  });

  it("shows the close control and calls onClose", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <RouterTelemetryDrawer router={router} defaultTab="vitals" onClose={onClose} />
    );

    await user.click(screen.getByRole("button", { name: /close telemetry drawer/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it("uses routerId (network_routers.idxno) for telemetry and device id for interfaces", async () => {
    const splitRouter = { ...router, id: "99", routerId: 7 };
    mockInterfaces.mockResolvedValue([]);
    const user = userEvent.setup();

    render(
      <RouterTelemetryDrawer router={splitRouter} defaultTab="vitals" onClose={() => {}} />
    );

    // Telemetry /latest must be polled against the router idxno (7), not the device id (99).
    await waitFor(() => {
      expect(mockLatest).toHaveBeenCalledWith(7);
    });
    expect(mockLatest).not.toHaveBeenCalledWith(99);

    // Interfaces must hit the device id (99).
    await user.click(screen.getByRole("tab", { name: /interfaces/i }));
    await waitFor(() => {
      expect(mockInterfaces).toHaveBeenCalledWith(99);
    });
  });
});