import { beforeEach, describe, expect, it, vi } from "vitest";
import { getEmailTemplates, sendBulkEmailAction } from "@/actions/communications";
import { apiFetch } from "@/lib/apiClient";

vi.mock("@/lib/apiClient", () => ({ apiFetch: vi.fn() }));

const mockedApiFetch = vi.mocked(apiFetch);
const notFound = (requestId: string) => ({
  status: 404,
  success: false,
  message: "NOT_FOUND",
  data: { requestId },
  requestId,
  timestamp: "2026-09-29T11:30:01Z",
});

beforeEach(() => { vi.clearAllMocks(); });

describe("email catalog actions", () => {
  it("returns an unavailable template result for a missing backend route", async () => {
    mockedApiFetch.mockResolvedValueOnce(notFound("req-template-404") as never);
    await expect(getEmailTemplates()).resolves.toMatchObject({
      success: false,
      data: [],
      message: "NOT_FOUND",
      status: 404,
      requestId: "req-template-404",
    });
  });

  it("sends selected recipient references through the email campaign endpoint", async () => {
    mockedApiFetch.mockResolvedValueOnce({
      status: 202,
      success: true,
      message: "Campaign queued",
      data: { queued: true },
      requestId: "req-email-queued",
      timestamp: "2026-09-29T11:30:01Z",
    } as never);
    const payload = {
      recipients: [
        { recipientType: "CUSTOMER" as const, recipientId: 14 },
        { recipientType: "SYSTEM_USER" as const, recipientId: 22 },
      ],
      templateId: "blank",
      subject: "Service update",
      body: "Hello {{customer_name}}",
    };

    await expect(sendBulkEmailAction(payload)).resolves.toMatchObject({ success: true, status: 202, requestId: "req-email-queued" });
    expect(mockedApiFetch).toHaveBeenCalledWith("/communications/email/send", expect.objectContaining({
      method: "POST",
      body: payload,
      auth: "required",
    }));
  });
});
