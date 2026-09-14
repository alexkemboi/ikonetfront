import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import TvDeviceSetup from "@/app/(hotspot)/hotspot/_components/TvDeviceSetup";
import { prepareTvDeviceAction } from "@/actions/tv";

// The action currently validates locally; these tests make no API requests.
describe("TV device setup", () => {
  it("normalizes the address and preserves it when editing after confirmation", async () => {
    const user = userEvent.setup();
    render(<TvDeviceSetup brand="BeeSmart Wi-Fi" initialDevice={{ macAddress: "" }} packages={[]} />);
    await user.type(screen.getByLabelText("TV MAC address"), "aa-bb-cc-dd-ee-ff");
    await user.click(screen.getByRole("button", { name: "Review TV details" }));
    expect(await screen.findByText("AA:BB:CC:DD:EE:FF")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Confirm this TV" }));
    expect(screen.getByRole("status")).toHaveTextContent("No TV packages are available");
    await user.click(screen.getByRole("button", { name: "Edit address" }));
    expect(screen.getByLabelText("TV MAC address")).toHaveValue("AA:BB:CC:DD:EE:FF");
  });

  it.each([12, "tv-month"])("selects package ID %s and retains it after editing the TV", async (idxno) => {
    const user = userEvent.setup();
    render(<TvDeviceSetup brand="BeeSmart Wi-Fi" initialDevice={{ macAddress: "AA:BB:CC:DD:EE:FF" }} packages={[
      { idxno, packageName: "TV Monthly", price: 800, validity: "30 days", speedDownload: 10, speedUpload: 5, maxDevices: 1, dataAllowance: "Unlimited" },
    ]} />);
    await user.click(screen.getByRole("button", { name: "Review TV details" }));
    await user.click(await screen.findByRole("button", { name: "Confirm this TV" }));
    await user.click(screen.getByRole("button", { name: "Review purchase" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Choose");
    await user.click(screen.getByRole("radio", { name: /TV Monthly/ }));
    await user.click(screen.getByRole("button", { name: "Review purchase" }));
    expect(await screen.findByText("Review your TV purchase")).toBeInTheDocument();
    await user.type(screen.getByLabelText("M-Pesa phone number"), "0712 345 678");
    await user.click(screen.getByRole("button", { name: "Edit address" }));
    await user.click(screen.getByRole("button", { name: "Review TV details" }));
    await user.click(await screen.findByRole("button", { name: "Confirm this TV" }));
    expect(screen.getByRole("radio", { name: /TV Monthly/ })).toBeChecked();
    await user.click(screen.getByRole("button", { name: "Review purchase" }));
    expect(screen.getByLabelText("M-Pesa phone number")).toHaveValue("0712 345 678");
    await user.click(screen.getByRole("button", { name: "Pay KES 800" }));
    expect(await screen.findByRole("status")).toHaveTextContent("No payment request was sent");
  });

  it("rejects invalid, empty and multicast addresses on the server boundary", async () => {
    for (const macAddress of ["", "AA:BB", "GG:BB:CC:DD:EE:FF", "00:00:00:00:00:00", "FF:FF:FF:FF:FF:FF", "01:00:5E:00:00:01"]) {
      expect((await prepareTvDeviceAction({ macAddress })).success).toBe(false);
    }
    expect(await prepareTvDeviceAction({ macAddress: "aa bb cc dd ee ff" })).toEqual({
      success: true, device: { macAddress: "AA:BB:CC:DD:EE:FF" },
    });
  });
});
