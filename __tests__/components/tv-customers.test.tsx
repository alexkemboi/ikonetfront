import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { TvCustomers } from "@/app/(dashboard)/customers/all/_components/TvCustomers";
import * as actions from "@/actions/subscriberTime";
import { useSession } from "next-auth/react";
import type { TvCustomerTime } from "@/lib/types/subscriberTime";

vi.mock("@/actions/subscriberTime", () => ({
  getTvCustomers: vi.fn(),
  getTvCustomer: vi.fn(),
  addTvTime: vi.fn(),
  pauseTvCustomer: vi.fn(),
  resumeTvCustomer: vi.fn(),
  changeTvDevice: vi.fn(),
  deactivateTvCustomer: vi.fn(),
  endTvPackage: vi.fn(),
  correctTvDates: vi.fn(),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/hooks/useVisibleInterval", () => ({ useVisibleInterval: vi.fn() }));

const tv: TvCustomerTime = {
  entitlementId: "e1", phone: "254700842535", macAddress: "D8:74:EF:B3:0B:09", packageName: "TV Monthly",
  routerId: 64, routerName: "BEDAK-NEWYORK", status: "ACTIVE",
  expiresAt: new Date(Date.now() + 10 * 86_400_000).toISOString(), pausedRemainingSeconds: null, pausedAt: null,
  pausesUsed: 0, pausesAllowed: 5, online: true, ipAddress: "10.50.50.87", connectedSince: null, lastSeenAt: null,
  bytesDown: 1_500_000_000, bytesUp: 20_000_000,
};

beforeEach(() => {
  vi.clearAllMocks();
  // a change in the Manage dialog reloads the list
  vi.mocked(actions.getTvCustomers).mockResolvedValue({ success: true, data: [tv], message: "" });
});

describe("TV customers tab", () => {
  it("lists the TV with time left and adds a day from the Manage dialog", async () => {
    const user = userEvent.setup();
    vi.mocked(actions.getTvCustomer).mockResolvedValue({ success: true, data: tv, message: "" });
    vi.mocked(actions.addTvTime).mockResolvedValue({ success: true, data: tv, message: "Time added" });
    render(<TvCustomers initial={[tv]} refreshIntervalSeconds={30} />);

    const row = screen.getByText("0700 842 535").closest("tr")!;
    expect(within(row).getByText("Online")).toBeInTheDocument();
    expect(within(row).getByText(/^(9|10) days/)).toBeInTheDocument();
    expect(within(row).getByText("D8:74:EF:B3:0B:09")).toBeInTheDocument();

    await user.click(within(row).getByRole("button", { name: /Manage/ }));
    await user.type(await screen.findByLabelText(/Reason/), "Router was down");
    await user.click(screen.getByRole("button", { name: "+ 1 day" }));
    expect(actions.addTvTime).toHaveBeenCalledWith("e1", 1440, "Router was down");
  });

  it("finds a TV by its MAC typed without colons", async () => {
    const user = userEvent.setup();
    render(<TvCustomers initial={[tv, { ...tv, entitlementId: "e2", phone: "254711000000", macAddress: "AA:AA:AA:AA:AA:AA" }]} refreshIntervalSeconds={30} />);
    await user.type(screen.getByLabelText("Search TV customers"), "d874ef");
    expect(screen.getByText("Showing 1 of 2 TVs", { exact: false })).toBeInTheDocument();
  });

  it("lets management correct the TV's MAC address, with the reason", async () => {
    const user = userEvent.setup();
    vi.mocked(useSession).mockReturnValue({ data: { user: { role: "ROLE_02" } } } as unknown as ReturnType<typeof useSession>);
    vi.mocked(actions.getTvCustomer).mockResolvedValue({ success: true, data: tv, message: "" });
    vi.mocked(actions.changeTvDevice).mockResolvedValue({
      success: true, data: { ...tv, macAddress: "D8:74:EF:B3:0B:0A" }, message: "TV address corrected",
    });
    render(<TvCustomers initial={[tv]} refreshIntervalSeconds={30} />);

    await user.click(screen.getByRole("button", { name: /Manage/ }));
    await user.type(await screen.findByLabelText(/Reason/), "Typed one letter wrong");
    await user.type(screen.getByLabelText("The TV's correct MAC address"), "d8:74:ef:b3:0b:0a");
    await user.click(screen.getByRole("button", { name: "Correct address" }));
    expect(actions.changeTvDevice).toHaveBeenCalledWith("e1", "d8:74:ef:b3:0b:0a", "Typed one letter wrong");
  });

  it("hides the address correction from staff", async () => {
    const user = userEvent.setup();
    vi.mocked(useSession).mockReturnValue({ data: { user: { role: "ROLE_03" } } } as unknown as ReturnType<typeof useSession>);
    vi.mocked(actions.getTvCustomer).mockResolvedValue({ success: true, data: tv, message: "" });
    render(<TvCustomers initial={[tv]} refreshIntervalSeconds={30} />);

    await user.click(screen.getByRole("button", { name: /Manage/ }));
    await screen.findByLabelText(/Reason/);
    expect(screen.queryByRole("button", { name: "Correct address" })).not.toBeInTheDocument();
  });

  it("pauses with the time it resumes by itself", async () => {
    const user = userEvent.setup();
    vi.mocked(actions.getTvCustomer).mockResolvedValue({ success: true, data: tv, message: "" });
    vi.mocked(actions.pauseTvCustomer).mockResolvedValue({ success: true, data: { ...tv, status: "PAUSED" }, message: "Paused" });
    render(<TvCustomers initial={[tv]} refreshIntervalSeconds={30} />);

    await user.click(screen.getByRole("button", { name: /Manage/ }));
    await user.type(await screen.findByLabelText(/Reason/), "Travelling");
    const at = new Date(Date.now() + 3 * 86_400_000);
    const pad = (n: number) => String(n).padStart(2, "0");
    const local = `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}T${pad(at.getHours())}:${pad(at.getMinutes())}`;
    const field = screen.getByLabelText(/Resume by itself at/);
    await user.clear(field);
    await user.type(field, local);
    await user.click(screen.getByRole("button", { name: "Pause" }));
    expect(actions.pauseTvCustomer).toHaveBeenCalledWith("e1", "Travelling", new Date(local).toISOString());
  });

  it("lets management deactivate a TV, keeping its time, and end a package after confirming", async () => {
    const user = userEvent.setup();
    vi.mocked(useSession).mockReturnValue({ data: { user: { role: "ROLE_02" } } } as unknown as ReturnType<typeof useSession>);
    vi.mocked(actions.getTvCustomer).mockResolvedValue({ success: true, data: tv, message: "" });
    vi.mocked(actions.deactivateTvCustomer).mockResolvedValue({
      success: true, data: { ...tv, status: "PAUSED", deactivated: true, pausedRemainingSeconds: 3600 }, message: "TV deactivated",
    });
    vi.mocked(actions.endTvPackage).mockResolvedValue({ success: true, data: null, message: "Package ended" });
    render(<TvCustomers initial={[tv]} refreshIntervalSeconds={30} />);

    await user.click(screen.getByRole("button", { name: /Manage/ }));
    await user.type(await screen.findByLabelText(/Reason/), "Unpaid balance");
    await user.click(screen.getByRole("button", { name: "Deactivate" }));
    expect(actions.deactivateTvCustomer).toHaveBeenCalledWith("e1", "Unpaid balance");
    expect(await screen.findByRole("button", { name: "Activate" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "End package" }));
    await user.click(screen.getByRole("button", { name: "Yes, end the package" }));
    expect(actions.endTvPackage).toHaveBeenCalledWith("e1", "Unpaid balance");
  });

  it("shows correct dates to administrators only", async () => {
    const user = userEvent.setup();
    vi.mocked(actions.getTvCustomer).mockResolvedValue({ success: true, data: tv, message: "" });
    vi.mocked(useSession).mockReturnValue({ data: { user: { role: "ROLE_02" } } } as unknown as ReturnType<typeof useSession>);
    const { unmount } = render(<TvCustomers initial={[tv]} refreshIntervalSeconds={30} />);
    await user.click(screen.getByRole("button", { name: /Manage/ }));
    await screen.findByLabelText(/Reason/);
    expect(screen.queryByRole("button", { name: "Correct dates" })).not.toBeInTheDocument();
    unmount();

    vi.mocked(useSession).mockReturnValue({ data: { user: { role: "ROLE_01" } } } as unknown as ReturnType<typeof useSession>);
    render(<TvCustomers initial={[tv]} refreshIntervalSeconds={30} />);
    await user.click(screen.getByRole("button", { name: /Manage/ }));
    await screen.findByLabelText(/Reason/);
    expect(screen.getByRole("heading", { name: /Correct dates/ })).toBeInTheDocument();
  });
});
