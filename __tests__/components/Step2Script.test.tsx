import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Step2Script } from "@/components/provisioning/Step2Script";
import { getZtpProvisioningStatus } from "@/actions/provisioning";

vi.mock("@/actions/provisioning", () => ({ getZtpProvisioningStatus: vi.fn() }));

const mockedStatus = vi.mocked(getZtpProvisioningStatus);

const scriptData = {
  deviceId: "42",
  routerIdxno: 7,
  identity: "Adrinold 02",
  fetchCommand: "/tool fetch url=example",
  allocatedVpnIp: "10.9.0.7",
  expiresAt: "2026-10-06T13:00:00+03:00",
};

beforeEach(() => vi.clearAllMocks());

describe("Step2Script", () => {
  it("advances once the script completed and the router is online", async () => {
    mockedStatus.mockResolvedValue({ status: "COMPLETED", online: true });
    const onConnected = vi.fn();
    render(<Step2Script scriptData={scriptData} onConnected={onConnected} onRestart={vi.fn()} />);

    await waitFor(() => expect(onConnected).toHaveBeenCalledTimes(1));
    expect(mockedStatus).toHaveBeenCalledWith("42");
  });

  it("keeps waiting while the script completed but the router is not online yet", async () => {
    mockedStatus.mockResolvedValue({ status: "COMPLETED", online: false });
    const onConnected = vi.fn();
    render(<Step2Script scriptData={scriptData} onConnected={onConnected} onRestart={vi.fn()} />);

    expect(await screen.findByText(/waiting for the router to come online/i)).toBeInTheDocument();
    expect(onConnected).not.toHaveBeenCalled();
  });

  it("stops and offers a new command when the session expired", async () => {
    mockedStatus.mockResolvedValue({ status: "EXPIRED", online: false });
    const onRestart = vi.fn();
    render(<Step2Script scriptData={scriptData} onConnected={vi.fn()} onRestart={onRestart} />);

    await userEvent.click(await screen.findByRole("button", { name: /Generate a new command/ }));
    expect(onRestart).toHaveBeenCalledTimes(1);
    expect(mockedStatus).toHaveBeenCalledTimes(1);
  });
});
