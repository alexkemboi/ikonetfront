import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import TvVoucherRedeem from "@/app/(hotspot)/hotspot/_components/TvVoucherRedeem";
import { apiFetch } from "@/lib/apiClient";

vi.mock("@/lib/apiClient", () => ({ apiFetch: vi.fn() }));
const mockedApiFetch = vi.mocked(apiFetch);

beforeEach(() => { vi.clearAllMocks(); });

describe("TV voucher on the TV portal", () => {
  it("redeems with the portal token and says the time was added", async () => {
    const user = userEvent.setup();
    mockedApiFetch.mockResolvedValueOnce({
      status: 200, success: true, message: "TV voucher redeemed", timestamp: "",
      data: { voucherCode: "TV7K2M9Q", macAddress: "AA:BB:CC:DD:EE:FF", packageName: "TV Monthly", extended: true, alreadyRedeemed: false, tvAccessExpiresAt: "2026-11-17T09:00:00Z" },
    } as never);
    render(<TvVoucherRedeem portalToken="signed-portal-token" />);
    await user.click(screen.getByRole("button", { name: /I have a TV voucher/ }));
    await user.type(screen.getByLabelText("TV voucher code"), " tv7k2m9q ");
    await user.click(screen.getByRole("button", { name: "Use voucher for this TV" }));

    expect(await screen.findByText("Time added to your TV.")).toBeInTheDocument();
    expect(mockedApiFetch).toHaveBeenCalledWith("/tv/vouchers/redeem", expect.objectContaining({
      method: "POST",
      body: { voucherCode: "TV7K2M9Q" },
      auth: "public",
      headers: { "X-TV-Portal-Token": "signed-portal-token" },
    }));
  });

  it("shows the server's sentence when the voucher is refused", async () => {
    const user = userEvent.setup();
    mockedApiFetch.mockResolvedValueOnce({
      status: 403, success: false, message: "TV_VOUCHER_WRONG_SITE", timestamp: "",
      data: { code: "TV_VOUCHER_WRONG_SITE", detail: "This voucher is only valid at the site where it was sold." },
    } as never);
    render(<TvVoucherRedeem portalToken="t" />);
    await user.click(screen.getByRole("button", { name: /I have a TV voucher/ }));
    await user.type(screen.getByLabelText("TV voucher code"), "ABC");
    await user.click(screen.getByRole("button", { name: "Use voucher for this TV" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("only valid at the site where it was sold");
  });
});
