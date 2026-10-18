import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PromotionsClient } from "@/components/communications/PromotionsClient";
import { addOptOut, getOptOuts, getPromotions, previewPromotion, saveDraft, sendPromotion } from "@/actions/promotions";
import type { Promotion, PromotionPreview } from "@/lib/types/promotions";

vi.mock("@/actions/promotions", () => ({
  getPromotions: vi.fn(), getOptOuts: vi.fn(), previewPromotion: vi.fn(), saveDraft: vi.fn(), sendPromotion: vi.fn(),
  cancelPromotion: vi.fn(), addOptOut: vi.fn(), removeOptOut: vi.fn(),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const preview: PromotionPreview = {
  recipients: 35, optedOut: 1, optOutLine: "To stop these messages call or WhatsApp 0700111222.",
  fullText: "Weekend offer\nTo stop these messages call or WhatsApp 0700111222.", characters: 66, smsPerRecipient: 1,
  totalSms: 35, costPerSms: null, estimatedCost: null, promotionsPerDay: 700, daysNeeded: 1, sendingHours: "08:00-19:00",
  smsEnabled: true, problem: null,
};
const draft = { id: 7, name: "Weekend", message: "Weekend offer", status: "DRAFT", recipients: null } as Promotion;

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getPromotions).mockResolvedValue({ data: [], error: null });
  vi.mocked(getOptOuts).mockResolvedValue({ data: [], error: null });
});

async function compose() {
  await userEvent.type(screen.getByLabelText("Name (for your records)"), "Weekend");
  await userEvent.type(screen.getByLabelText("Message"), "Weekend offer");
}

describe("PromotionsClient", () => {
  it("previews with the opt-out line, then a company admin sends after confirming", async () => {
    vi.mocked(previewPromotion).mockResolvedValue({ data: preview, error: null });
    vi.mocked(saveDraft).mockResolvedValue({ data: draft, error: null });
    vi.mocked(sendPromotion).mockResolvedValue({ data: { ...draft, status: "QUEUED", recipients: 35 }, error: null });
    render(<PromotionsClient initialPromotions={[]} initialOptOuts={[]} canDraft canSend canRemoveOptOut />);
    await compose();
    expect(screen.getByRole("button", { name: /Send/ })).toHaveProperty("disabled", true); // preview first
    await userEvent.click(screen.getByRole("button", { name: "Preview" }));
    await waitFor(() => expect(screen.getByText(/WhatsApp 0700111222/)).toBeTruthy());
    await userEvent.click(screen.getByRole("button", { name: /Send/ }));
    expect(screen.getByText("Send this promotion to 35 people?")).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "Send" }));
    await waitFor(() => expect(sendPromotion).toHaveBeenCalledWith(7));
  });

  it("a manager can only save a draft", async () => {
    render(<PromotionsClient initialPromotions={[]} initialOptOuts={[]} canDraft canSend={false} canRemoveOptOut={false} />);
    expect(screen.queryByRole("button", { name: /Send/ })).toBeNull();
    expect(screen.getByText(/a company admin sends it/)).toBeTruthy();
  });

  it("records an opt-out", async () => {
    vi.mocked(addOptOut).mockResolvedValue({ data: { withdrawn: 1 }, error: null });
    render(<PromotionsClient initialPromotions={[]} initialOptOuts={[]} canDraft={false} canSend={false} canRemoveOptOut={false} />);
    await userEvent.type(screen.getByLabelText("Phone number"), "0712000003");
    await userEvent.selectOptions(screen.getByLabelText("How they asked"), "WHATSAPP");
    await userEvent.click(screen.getByRole("button", { name: "Record opt-out" }));
    await waitFor(() => expect(addOptOut).toHaveBeenCalledWith("0712000003", "WHATSAPP", ""));
    await waitFor(() => expect(getOptOuts).toHaveBeenCalled());
  });
});
