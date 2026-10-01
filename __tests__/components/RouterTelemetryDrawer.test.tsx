import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RouterTelemetryDrawer } from "@/components/network/RouterTelemetryDrawer";

// id = network_device.id, routerId = network_routers.idxno
const router = {
  deviceId: 1,
  routerId: 1,
  name: "RTR-BDK-MSA-001",
  managementIp: "10.8.1.10",
  links: {
    telemetryLatest: "/network/monitoring/router/1/latest",
    deviceInterfaces: "/network-devices/1/interfaces",
  },
};

// Mock the monitoring server actions (MSW fixtures would otherwise drive the
// SSE/polling paths); the drawer's vitals tab renders from the polled snapshot.
const mockLatest = vi.fn();
const mockInterfaces = vi.fn();
const mockSessions = vi.fn();

vi.mock("@/actions/network", () => ({
  getRouterMonitoringLatest: (...args: unknown[]) => mockLatest(...args),
  getRouterLiveInterfaces: (...args: unknown[]) => mockInterfaces(...args),
  getRouterLiveSessions: (...args: unknown[]) => mockSessions(...args),
}));

const snapshot = {
  idxno: 1,
  routerId: 7,
  cpuUsage: 3.5,
  totalMemory: 268435456,
  freeMemory: 218542080,
  temperature: null,
  activePppoeSessions: 1,
  activeHotspotSessions: 0,
  uptime: "1d 04:22:15",
  latencyMs: 14,
  createdAt: new Date().toISOString(),
};

beforeEach(() => {
  vi.clearAllMocks();
  mockLatest.mockResolvedValue(snapshot);
  mockInterfaces.mockResolvedValue({ data: [], error: null });
  mockSessions.mockResolvedValue({ data: { pppoe: [], hotspot: [] }, error: null });
});

describe("RouterTelemetryDrawer", () => {
  it("renders the drawer header and default vitals tab with live values", async () => {
    render(<RouterTelemetryDrawer router={router} defaultTab="vitals" onClose={() => {}} />);

    expect(screen.getByTestId("telemetry-drawer")).toBeInTheDocument();
    expect(screen.getByText("RTR-BDK-MSA-001")).toBeInTheDocument();

    await waitFor(() => {
      // Polled snapshot renders CPU + RAM values
      expect(screen.getByText("CPU Load").parentElement).toHaveTextContent("3.5%");
      expect(screen.getByText(/218\.5 MB free/i)).toBeInTheDocument();
      expect(screen.getByText(/1d 04:22:15/i)).toBeInTheDocument();
    });
  });

  it("shows 'No sensor' instead of 0°C when the board reports no temperature", async () => {
    render(<RouterTelemetryDrawer router={router} defaultTab="vitals" onClose={() => {}} />);
    await waitFor(() => expect(screen.getByText(/no sensor/i)).toBeInTheDocument());
    expect(screen.queryByText(/0°C/)).not.toBeInTheDocument();
  });

  it("reads interfaces live by router id and shows current rates and totals", async () => {
    mockInterfaces.mockResolvedValue({
      data: [
        {
          name: "ether1",
          type: "ether",
          comment: "WAN",
          macAddress: "32:A2:F1:9C:4D:02",
          running: true,
          disabled: false,
          lastLinkUpTime: null,
          rxBytes: 1500000000,
          txBytes: 89500000,
          rxBitsPerSecond: 12_400_000,
          txBitsPerSecond: 850_000,
        },
      ],
      error: null,
    });

    const user = userEvent.setup();
    render(<RouterTelemetryDrawer router={router} defaultTab="vitals" onClose={() => {}} />);
    await user.click(screen.getByRole("tab", { name: /interfaces/i }));

    expect(mockInterfaces).toHaveBeenCalledWith(1, "/network-devices/1/interfaces");
    await waitFor(() => {
      expect(screen.getByText(/ether1/i)).toBeInTheDocument();
      expect(screen.getByText(/1\.5 GB/i)).toBeInTheDocument(); // rx-byte formatted in decimal units
      expect(screen.getByText(/89\.5 MB/i)).toBeInTheDocument(); // tx-byte formatted in decimal units
    });
  });

  it("surfaces the router's error when interfaces cannot be read", async () => {
    mockInterfaces.mockResolvedValue({
      data: [],
      error: "Router RTR-BDK-MSA-001 did not answer over the RouterOS API: timeout",
    });
    const user = userEvent.setup();
    render(<RouterTelemetryDrawer router={router} defaultTab="vitals" onClose={() => {}} />);
    await user.click(screen.getByRole("tab", { name: /interfaces/i }));
    await waitFor(() => expect(screen.getByText(/did not answer over the RouterOS API/)).toBeInTheDocument());
  });

  it("lists live PPPoE sessions linked to their billing customer, and hotspot users", async () => {
    mockSessions.mockResolvedValue({
      data: {
        pppoe: [
          {
            username: "jdoe-ppp",
            address: "10.20.0.15",
            callerId: "AA:BB:CC:00:11:22",
            service: "pppoe",
            uptime: "2h10m",
            customerId: 42,
            customerName: "Jane Doe",
            customerPhone: "0700000000",
          },
        ],
        hotspot: [
          {
            username: "VCH-1234",
            address: "192.168.88.20",
            macAddress: "DE:AD:BE:EF:00:01",
            uptime: "15m",
            loginBy: "http-chap",
            bytesIn: 1024,
            bytesOut: 2048,
          },
        ],
      },
      error: null,
    });

    render(<RouterTelemetryDrawer router={router} defaultTab="sessions" onClose={() => {}} />);

    // Sessions key on network_routers.idxno, which is 1 for the shared fixture.
    await waitFor(() => expect(mockSessions).toHaveBeenCalledWith(1));
    const customer = await screen.findByRole("link", { name: "Jane Doe" });
    expect(customer).toHaveAttribute("href", "/customers/42");
    expect(screen.getByText(/jdoe-ppp · 10\.20\.0\.15/)).toBeInTheDocument();
    expect(screen.getByText("VCH-1234")).toBeInTheDocument();
  });

  it("shows the close control and calls onClose", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<RouterTelemetryDrawer router={router} defaultTab="vitals" onClose={onClose} />);

    await user.click(screen.getByRole("button", { name: /close telemetry drawer/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it("uses routerId (network_routers.idxno) for telemetry and device id for interfaces", async () => {
    const splitRouter = {
      ...router,
      deviceId: 99,
      routerId: 7,
      links: {
        telemetryLatest: "/network/monitoring/router/7/latest",
        deviceInterfaces: "/network-devices/99/interfaces",
      },
    };
    mockInterfaces.mockResolvedValue([]);
    const user = userEvent.setup();

    render(
      <RouterTelemetryDrawer router={splitRouter} defaultTab="vitals" onClose={() => {}} />
    );

    // Telemetry /latest must be polled against the router idxno (7), not the device id (99).
    await waitFor(() => {
      expect(mockLatest).toHaveBeenCalledWith(7, "/network/monitoring/router/7/latest");
    });
    expect(mockLatest).not.toHaveBeenCalledWith(99, expect.anything());

    // Interfaces must hit the device id (99).
    await user.click(screen.getByRole("tab", { name: /interfaces/i }));
    await waitFor(() => {
      expect(mockInterfaces).toHaveBeenCalledWith(99, "/network-devices/99/interfaces");
    });
  });
});
