import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import InvestorInvoiceDialog from "@/components/investors/InvestorInvoiceDialog";
import type { InvestorSummary } from "@/lib/types/investor";

const sendInvestorInvoice = vi.fn().mockResolvedValue({
  success: true,
  data: { batchId: null, deliveries: [{ investorId: "i1", investorCode: "INV-000018", investorName: "Adrinold01", emails: 1, texts: 1, smsCompany: "CMP-ADR-001", note: null }] },
});
vi.mock("@/actions/investorRegistry", () => ({ sendInvestorInvoice: (...a: unknown[]) => sendInvestorInvoice(...a) }));
vi.mock("@/actions/platformFees", () => ({ payFeeNow: vi.fn(), getFeePromptStatus: vi.fn() }));

const investor: InvestorSummary = {
  id: "i1", code: "INV-000018", legalName: "Adrinold01", contactName: "admin@adrinold", phone: "0722937319",
  email: null, status: "ACTIVE", companies: [], agreementCount: 1, routerCount: 1, accountCount: 1,
  fees: {
    charged: 300, paid: 100, outstanding: 200, standing: "OVERDUE", nextDueDate: "2026-11-10", suspendDate: "2026-11-15",
    owing: [{ agreementId: "a1", agreementCode: "AGR-000011", companyCode: "CMP-ADR-001", companyName: "Adrinold",
      outstanding: 200, dueDate: "2026-11-10", standing: "OVERDUE" }],
  },
};
const paybill = { accountType: "PAYBILL" as const, shortCode: "4326865", accountReference: null, promptAvailable: true };

describe("InvestorInvoiceDialog", () => {
  it("offers an M-Pesa prompt or a paybill invoice for each agreement that owes", () => {
    render(<InvestorInvoiceDialog investor={investor} account={paybill} open onOpenChange={() => {}} />);
    expect(screen.getByText("Paybill route: M-Pesa paybill 4326865, account AGR-000011.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send M-Pesa prompt" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Send paybill invoice/ })).toBeInTheDocument();
  });

  it("fills in the investor's phone for the prompt", () => {
    render(<InvestorInvoiceDialog investor={investor} account={paybill} open onOpenChange={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Send M-Pesa prompt" }));
    expect(screen.getByLabelText("M-Pesa number")).toHaveValue("0722937319");
    expect(screen.getByLabelText("Amount (KES, whole shillings)")).toHaveValue("200");
  });

  it("sends the paybill invoice for that agreement by email and text", async () => {
    render(<InvestorInvoiceDialog investor={investor} account={paybill} open onOpenChange={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: /Send paybill invoice/ }));
    await waitFor(() => expect(sendInvestorInvoice).toHaveBeenCalledWith("i1", { agreementId: "a1", email: true, sms: true }));
  });
});
