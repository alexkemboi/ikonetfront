import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { LiveSpeedGauges } from "@/app/(dashboard)/customers/[id]/_components/LiveSpeedGauges";

const mockGetLiveSpeed = vi.fn();

vi.mock("@/actions/customer360", () => ({
  getLiveSpeed: (...args: unknown[]) => mockGetLiveSpeed(...args),
}));

const liveGauge = {
  online: true,
  interfaceName: "<pppoe-johndoe>",
  downloadMbps: 2.5,
  uploadMbps: 1.25,
  downloadBps: 2500000,
  uploadBps: 1250000,
  routerName: "R1",
  sampledAt: "2026-09-01T08:00:00.000Z",
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGetLiveSpeed.mockResolvedValue({
    status: 200,
    success: true,
    message: "Live speed retrieved",
    data: liveGauge,
    timestamp: new Date().toISOString(),
  });
});

describe("LiveSpeedGauges", () => {
  it("renders both download and upload dials from the first poll", async () => {
    render(<LiveSpeedGauges customerId={7} />);

    await waitFor(() => {
      expect(screen.getByText("Download")).toBeInTheDocument();
      expect(screen.getByText("Upload")).toBeInTheDocument();
    });
    expect(screen.getByText("2.50")).toBeInTheDocument();
    expect(screen.getByText("1.25")).toBeInTheDocument();
    expect(mockGetLiveSpeed).toHaveBeenCalledWith(7);
  });

  it("shows online badge and router name when the probe is live", async () => {
    render(<LiveSpeedGauges customerId={7} />);

    await waitFor(() => {
      expect(screen.getByText("ONLINE")).toBeInTheDocument();
    });
    expect(screen.getByText("R1")).toBeInTheDocument();
  });

  it("renders the offline state when the probe reports offline", async () => {
    mockGetLiveSpeed.mockResolvedValue({
      status: 200,
      success: true,
      message: "Live speed retrieved",
      data: { ...liveGauge, online: false, downloadMbps: 0, uploadMbps: 0 },
      timestamp: new Date().toISOString(),
    });

    render(<LiveSpeedGauges customerId={7} />);

    await waitFor(() => {
      expect(screen.getByText("OFFLINE")).toBeInTheDocument();
    });
    expect(screen.getAllByText("0.00")).toHaveLength(2);
  });
});