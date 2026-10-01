import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import BulkEmailWizard from "@/app/(dashboard)/communications/bulk-email/_components/BulkEmailWizard";
import { sendBulkEmailAction } from "@/actions/communications";
import type { CampaignRecipient, EmailTemplate } from "@/app/(dashboard)/communications/bulk-email/page";

vi.mock("@/actions/communications", () => ({ sendBulkEmailAction: vi.fn() }));

const customers: CampaignRecipient[] = [
  { id: 14, name: "Dan Komen", email: "dan@example.test", phoneNumber: "254700000014", recipientType: "CUSTOMER", selectable: true },
  { id: 15, name: "No Email", email: null, phoneNumber: null, recipientType: "CUSTOMER", selectable: false },
];
const systemUsers: CampaignRecipient[] = [
  { id: 22, name: "Support User", email: "support@example.test", phoneNumber: "254700000022", recipientType: "SYSTEM_USER", selectable: true },
];
const templates: EmailTemplate[] = [
  { id: "renewal-reminder", name: "Renewal Reminder", subject: "Renew soon", body: "Hi {{customer_name}}" },
];

beforeEach(() => { vi.clearAllMocks(); });

describe("BulkEmailWizard", () => {
  it("selects individual customers and system users and sends their typed IDs", async () => {
    const user = userEvent.setup();
    vi.mocked(sendBulkEmailAction).mockResolvedValueOnce({ success: true, message: "Queued", status: 202 });
    render(<BulkEmailWizard customers={customers} systemUsers={systemUsers} templates={templates} />);

    let checkboxes = screen.getAllByRole("checkbox");
    await user.click(checkboxes[1]!);
    expect(screen.getByText("No Email")).toBeInTheDocument();
    expect(checkboxes[2]).toBeDisabled();

    await user.click(screen.getByRole("button", { name: /system users/i }));
    checkboxes = screen.getAllByRole("checkbox");
    await user.click(checkboxes[1]!);
    expect(screen.getByText("2 selected")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.type(screen.getByPlaceholderText("e.g. Your subscription is expiring soon"), "Service update");
    fireEvent.change(screen.getByPlaceholderText("Write your message here..."), { target: { value: "Hello {{customer_name}}" } });
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Confirm & Review" }));
    await user.click(screen.getByRole("button", { name: "Send Campaign" }));

    expect(sendBulkEmailAction).toHaveBeenCalledWith(expect.objectContaining({
      recipients: [
        { recipientType: "CUSTOMER", recipientId: 14 },
        { recipientType: "SYSTEM_USER", recipientId: 22 },
      ],
      subject: "Service update",
      body: "Hello {{customer_name}}",
    }));
    expect(await screen.findByRole("heading", { name: "Campaign Sent!" })).toBeInTheDocument();
  });
});