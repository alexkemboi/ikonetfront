import { describe, expect, it } from "vitest";
import { formatLocalPhone, formatTimeLeft, mpesaReceiptOrNull, toMinutes, trimZeroDays } from "@/lib/utils/subscriberTime";

describe("subscriber time helpers", () => {
  it("shows phones the way staff dial them", () => {
    expect(formatLocalPhone("254725134318")).toBe("0725 134 318");
    expect(formatLocalPhone("0116125111")).toBe("0116 125 111");
    expect(formatLocalPhone(undefined)).toBeUndefined();
  });

  it("formats time left", () => {
    expect(formatTimeLeft(20 * 60)).toBe("20 min");
    expect(formatTimeLeft(3 * 3600 + 5 * 60)).toBe("3h 05m");
    expect(formatTimeLeft(2 * 86400 + 4 * 3600)).toBe("2 days 4h");
    expect(formatTimeLeft(null)).toBe("—");
  });

  it("drops a leading zero-day count", () => {
    expect(trimZeroDays("0d 4h 29m")).toBe("4h 29m");
    expect(trimZeroDays("2d 0h 5m")).toBe("2d 0h 5m");
  });

  it("shows only real M-Pesa receipts", () => {
    expect(mpesaReceiptOrNull("UJ8NE9BMNH")).toBe("UJ8NE9BMNH");
    expect(mpesaReceiptOrNull("ws_CO_07102026225330107116125111")).toBeNull();
  });

  it("converts typed amounts to minutes", () => {
    expect(toMinutes(2, "hours")).toBe(120);
    expect(toMinutes(1, "days")).toBe(1440);
    expect(toMinutes(45, "minutes")).toBe(45);
  });
});
