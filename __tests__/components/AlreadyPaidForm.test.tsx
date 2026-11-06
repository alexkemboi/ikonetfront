import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const reconnectByReceiptAction = vi.fn();
vi.mock("@/actions/hotspot", () => ({ reconnectByReceiptAction: (...args: unknown[]) => reconnectByReceiptAction(...args) }));

import AlreadyPaidForm from "@/app/(hotspot)/hotspot/_components/AlreadyPaidForm";

describe("AlreadyPaidForm", () => {
  beforeEach(() => reconnectByReceiptAction.mockReset());

  it("brings a paid package back with the paying number and the M-Pesa code", async () => {
    reconnectByReceiptAction.mockResolvedValue({ success: true, message: "ok", data: { expiresAt: "2026-11-04T05:39:00Z" } });
    render(<AlreadyPaidForm clientMac="2A:11:3C:44:55:66" clientIp="10.50.50.23" />);

    const reconnect = screen.getByRole("button", { name: /^reconnect$/i });
    expect(reconnect).toBeDisabled();
    await userEvent.type(screen.getByLabelText(/phone number that paid/i), "0712345678");
    await userEvent.type(screen.getByLabelText(/m-pesa code/i), "uk3pc0 enzq");
    await userEvent.click(reconnect);

    expect(reconnectByReceiptAction).toHaveBeenCalledWith(expect.objectContaining({
      phone: "0712345678", mpesaCode: "UK3PC0ENZQ", macAddress: "2A:11:3C:44:55:66", clientIp: "10.50.50.23",
    }));
    expect(await screen.findByText(/you're connected again/i)).toBeInTheDocument();
  });

  it("says why when the code is not this number's purchase", async () => {
    reconnectByReceiptAction.mockResolvedValue({
      success: false,
      message: "We could not find a paid package for that phone number and M-Pesa code on this Wi-Fi.",
      data: null,
    });
    render(<AlreadyPaidForm />);

    await userEvent.type(screen.getByLabelText(/phone number that paid/i), "0712345678");
    await userEvent.type(screen.getByLabelText(/m-pesa code/i), "UK3PC0ENZQ");
    await userEvent.click(screen.getByRole("button", { name: /^reconnect$/i }));

    expect(await screen.findByText(/could not find a paid package/i)).toBeInTheDocument();
  });
});
