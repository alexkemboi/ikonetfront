import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import BulkEmailWizard from "@/app/(dashboard)/communications/bulk-email/_components/BulkEmailWizard";
import {
  getAudiencePeople,
  sendBulkEmailAction,
  sendSmsNoticeAction,
  type AudienceListing,
  type AudienceTree,
} from "@/actions/communications";
import type { CampaignRecipient, EmailTemplate } from "@/app/(dashboard)/communications/bulk-email/page";

vi.mock("@/actions/communications", () => ({
  sendBulkEmailAction: vi.fn(),
  sendSmsNoticeAction: vi.fn(),
  getAudiencePeople: vi.fn(),
}));

const tree: AudienceTree = {
  regions: [{ id: 1, parentId: null, name: "MOMBASA", active: true, pppoe: 1, hotspot: 1, accounts: 1 }],
  locations: [{ id: 3, parentId: 1, name: "MWAIMA", active: true, pppoe: 1, hotspot: 1, accounts: 1 }],
  stations: [{ id: 3, parentId: 3, name: "WESTGATE", active: true, pppoe: 1, hotspot: 1, accounts: 1 }],
  devices: [{ id: 54, parentId: 3, name: "ADRINOLD-WESTLANDS", active: true, pppoe: 1, hotspot: 1, accounts: 0 }],
  unplaced: 0,
};
const place = { deviceName: "ADRINOLD-WESTLANDS", stationName: "WESTGATE", locationName: "MWAIMA", regionName: "MOMBASA" };
const listing: AudienceListing = {
  people: [
    { key: "U:14", kind: "PPPOE", userId: 14, name: "Dan Komen", phone: "254700000014", email: "dan@example.test", ...place },
    { key: "P:254711000001", kind: "HOTSPOT", userId: null, name: null, phone: "254711000001", email: null, ...place },
    { key: "U:15", kind: "ACCOUNT", userId: 15, name: "No Contact", phone: null, email: null, ...place, deviceName: null },
  ],
  total: 3,
  withPhone: 2,
  withEmail: 1,
  truncated: false,
};
const systemUsers: CampaignRecipient[] = [
  { id: 22, name: "Support User", email: "support@example.test", phoneNumber: "254700000022", recipientType: "SYSTEM_USER", selectable: true },
];
const templates: EmailTemplate[] = [
  { id: "renewal-reminder", name: "Renewal Reminder", subject: "Renew soon", body: "Hi {{customer_name}}" },
];

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getAudiencePeople).mockResolvedValue({ data: listing });
});

async function compose(user: ReturnType<typeof userEvent.setup>, body: string, subject?: string) {
  await user.click(screen.getByRole("button", { name: "Continue" }));
  if (subject) await user.type(screen.getByPlaceholderText("e.g. Your subscription is expiring soon"), subject);
  fireEvent.change(screen.getByPlaceholderText("Write your message here..."), { target: { value: body } });
  await user.click(screen.getByRole("button", { name: "Continue" }));
  await user.click(screen.getByRole("button", { name: "Confirm & Review" }));
}

describe("SMS & Emails wizard", () => {
  it("lists the customers of the filter with where they are, and emails customers and staff by account", async () => {
    const user = userEvent.setup();
    vi.mocked(sendBulkEmailAction).mockResolvedValueOnce({ success: true, message: "Queued", status: 202 });
    render(<BulkEmailWizard tree={tree} systemUsers={systemUsers} templates={templates} />);

    expect(await screen.findByText("Dan Komen")).toBeInTheDocument();
    expect(screen.getByText(/WESTGATE · ADRINOLD-WESTLANDS · PPPoE subscribers/)).toBeInTheDocument();
    expect(screen.getByText(/3 customers here: 2 with a mobile number, 1 with an email/)).toBeInTheDocument();
    expect(getAudiencePeople).toHaveBeenCalledWith(expect.objectContaining({ regionIds: [], deviceIds: [] }));

    let checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes[2]).toBeDisabled(); // the hotspot number has no email
    await user.click(checkboxes[1]!);

    await user.click(screen.getByRole("button", { name: /system users/i }));
    checkboxes = screen.getAllByRole("checkbox");
    await user.click(checkboxes[1]!);
    expect(screen.getByText("2 selected")).toBeInTheDocument();

    await compose(user, "Hello {{customer_name}}", "Service update");
    await user.click(screen.getByRole("button", { name: "Send email" }));

    expect(sendBulkEmailAction).toHaveBeenCalledWith(expect.objectContaining({
      recipients: [
        { recipientType: "CUSTOMER", recipientId: 14 },
        { recipientType: "SYSTEM_USER", recipientId: 22 },
      ],
      subject: "Service update",
      body: "Hello {{customer_name}}",
    }));
    expect(sendSmsNoticeAction).not.toHaveBeenCalled();
    expect(await screen.findByText(/queued for delivery to/)).toBeInTheDocument();
  });

  it("sends an SMS through the SMS endpoint with the filter, to customers only", async () => {
    const user = userEvent.setup();
    vi.mocked(sendSmsNoticeAction).mockResolvedValueOnce({
      success: true, message: "Queued", status: 200, requestId: undefined,
      data: { noticeId: 1, recipients: 2, smsPerRecipient: 1, skippedNoPhone: 0 },
    });
    render(<BulkEmailWizard tree={tree} systemUsers={systemUsers} templates={templates} />);
    await screen.findByText("Dan Komen");

    await user.click(screen.getByRole("button", { name: "SMS" }));
    expect(screen.queryByRole("button", { name: /system users/i })).not.toBeInTheDocument();
    await user.click(screen.getByText("Select all visible"));
    expect(screen.getByText("2 selected")).toBeInTheDocument(); // the account with no number is left out

    await compose(user, "Maintenance tonight 10pm");
    await user.click(screen.getByRole("button", { name: "Send SMS" }));

    expect(sendSmsNoticeAction).toHaveBeenCalledWith({
      scope: expect.objectContaining({ deviceIds: [], kinds: [] }),
      keys: ["U:14", "P:254711000001"],
      message: "Maintenance tonight 10pm",
    });
    expect(sendBulkEmailAction).not.toHaveBeenCalled();
    expect(await screen.findByText(/2 recipients/)).toBeInTheDocument();
  });
});
