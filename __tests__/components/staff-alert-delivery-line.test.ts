import { describe, expect, it } from "vitest";
import { deliveryLine } from "@/components/account/RecentStaffAlerts";

describe("deliveryLine", () => {
  it("says when nobody could be told", () => {
    expect(deliveryLine({ emails: 0, emailsSent: 0, emailsFailed: 0, texts: 0 })).toBe("nobody to tell");
  });

  it("shows sent, failed and waiting emails and the texts", () => {
    expect(deliveryLine({ emails: 4, emailsSent: 2, emailsFailed: 1, texts: 1 })).toBe(
      "2 of 4 emailed, 1 failed, 1 waiting · 1 text queued"
    );
  });

  it("is short when everything went out", () => {
    expect(deliveryLine({ emails: 3, emailsSent: 3, emailsFailed: 0, texts: 0 })).toBe("3 of 3 emailed");
  });
});
