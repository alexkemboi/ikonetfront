import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BuyTab from "@/app/(hotspot)/hotspot/_components/BuyTab";
import type { HotspotPackage } from "@/lib/types/hotspot";

const { initiatePublicHotspotPayment, getPublicVoucherStatus } = vi.hoisted(() => ({
  initiatePublicHotspotPayment: vi.fn(),
  getPublicVoucherStatus: vi.fn(),
}));

vi.mock("@/lib/hotspotPublicClient", () => ({
  PENDING_HOTSPOT_PURCHASE_KEY: "hotspot.pendingPurchase",
  initiatePublicHotspotPayment,
  getPublicVoucherStatus,
}));

const pkg = {
  idxno: 7,
  packageName: "Daily 5Mbps",
  price: 50,
  validityValue: 1,
  validityType: "DAYS",
} as unknown as HotspotPackage;

describe("BuyTab", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    initiatePublicHotspotPayment.mockReset();
    getPublicVoucherStatus.mockReset();
    getPublicVoucherStatus.mockResolvedValue({
      success: true,
      data: { sessionId: 91, voucherCode: "ABC123", sessionStatus: "PENDING" },
    });
  });

  it("moves to the payment status view once the M-Pesa prompt has been sent", async () => {
    initiatePublicHotspotPayment.mockResolvedValue({
      success: true,
      data: { sessionId: 91, voucherCode: "ABC123" },
    });
    const user = userEvent.setup();

    render(<BuyTab packages={[pkg]} onBack={() => {}} clientMac="AA:BB:CC:DD:EE:FF" clientIp="10.5.50.2" />);

    await user.click(screen.getByRole("button", { name: /^select$/i }));
    await user.type(screen.getByLabelText(/m-pesa phone number/i), "0712345678");
    await user.click(screen.getByRole("button", { name: /pay with m-pesa/i }));

    await waitFor(() => expect(screen.getByText(/enter your m-pesa pin/i)).toBeInTheDocument());
  });

  it("reopens the payment status for a purchase parked before a reload", async () => {
    window.sessionStorage.setItem(
      "hotspot.pendingPurchase",
      JSON.stringify({ sessionId: 91, voucherCode: "ABC123", startedAt: Date.now() })
    );

    render(<BuyTab packages={[pkg]} onBack={() => {}} clientMac="AA:BB:CC:DD:EE:FF" />);

    await waitFor(() => expect(screen.getByText(/enter your m-pesa pin/i)).toBeInTheDocument());
  });

  it("stops waiting and offers a resend when M-Pesa says the phone could not be reached", async () => {
    initiatePublicHotspotPayment.mockResolvedValue({
      success: true,
      data: { sessionId: 91, voucherCode: "ABC123" },
    });
    // the session is still PENDING, but M-Pesa has already answered
    getPublicVoucherStatus.mockResolvedValue({
      success: true,
      data: { sessionId: 91, voucherCode: "ABC123", sessionStatus: "PENDING", paymentOutcome: "UNREACHABLE" },
    });
    const user = userEvent.setup();

    render(<BuyTab packages={[pkg]} onBack={() => {}} clientMac="AA:BB:CC:DD:EE:FF" clientIp="10.5.50.2" />);
    await user.click(screen.getByRole("button", { name: /^select$/i }));
    await user.type(screen.getByLabelText(/m-pesa phone number/i), "0712345678");
    await user.click(screen.getByRole("button", { name: /pay with m-pesa/i }));

    await waitFor(() => expect(screen.getByText(/could not reach that phone/i)).toBeInTheDocument());
    expect(screen.queryByText(/enter your m-pesa pin/i)).not.toBeInTheDocument();
    // the failed attempt is forgotten, so reopening the page does not resume the wait
    expect(window.sessionStorage.getItem("hotspot.pendingPurchase")).toBeNull();

    // a fresh prompt to the same number
    getPublicVoucherStatus.mockResolvedValue({
      success: true,
      data: { sessionId: 92, voucherCode: "DEF456", sessionStatus: "PENDING" },
    });
    initiatePublicHotspotPayment.mockResolvedValue({ success: true, data: { sessionId: 92, voucherCode: "DEF456" } });
    await user.click(screen.getByRole("button", { name: /send the prompt again/i }));
    await waitFor(() => expect(initiatePublicHotspotPayment).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.getByText(/enter your m-pesa pin/i)).toBeInTheDocument());
  });

  it("lets the customer pay from a different number after a cancelled prompt", async () => {
    initiatePublicHotspotPayment.mockResolvedValue({ success: true, data: { sessionId: 91, voucherCode: "ABC123" } });
    getPublicVoucherStatus.mockResolvedValue({
      success: true,
      data: { sessionId: 91, voucherCode: "ABC123", sessionStatus: "PENDING", paymentOutcome: "CANCELLED" },
    });
    const user = userEvent.setup();

    render(<BuyTab packages={[pkg]} onBack={() => {}} clientMac="AA:BB:CC:DD:EE:FF" clientIp="10.5.50.2" />);
    await user.click(screen.getByRole("button", { name: /^select$/i }));
    await user.type(screen.getByLabelText(/m-pesa phone number/i), "0712345678");
    await user.click(screen.getByRole("button", { name: /pay with m-pesa/i }));

    await waitFor(() => expect(screen.getByText(/prompt was cancelled/i)).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: /use a different number/i }));
    expect(screen.getByLabelText(/m-pesa phone number/i)).toBeInTheDocument();
  });

  it("Close closes the box while a purchase is still waiting, and the purchase stays parked", async () => {
    window.sessionStorage.setItem(
      "hotspot.pendingPurchase",
      JSON.stringify({ sessionId: 91, voucherCode: "ABC123", startedAt: Date.now() })
    );
    const user = userEvent.setup();

    render(<BuyTab packages={[pkg]} onBack={() => {}} clientMac="AA:BB:CC:DD:EE:FF" />);
    await waitFor(() => expect(screen.getByText(/enter your m-pesa pin/i)).toBeInTheDocument());

    // the header X and the footer button both close; use the footer one
    await user.click(screen.getAllByRole("button", { name: /^close$/i }).at(-1)!);
    await waitFor(() => expect(screen.queryByText(/enter your m-pesa pin/i)).not.toBeInTheDocument());
    expect(window.sessionStorage.getItem("hotspot.pendingPurchase")).not.toBeNull();

    // choosing a package afterwards starts a new purchase, not the old wait
    await user.click(screen.getByRole("button", { name: /^select$/i }));
    expect(screen.getByLabelText(/m-pesa phone number/i)).toBeInTheDocument();
  });
});
