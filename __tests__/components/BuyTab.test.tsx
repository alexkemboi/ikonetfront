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
});
