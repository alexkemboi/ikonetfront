import { describe, expect, it } from "vitest";
import { toKenyanMobile } from "@/lib/hotspot/phone";

describe("toKenyanMobile", () => {
  it.each([
    ["0712345678", "254712345678"],
    ["0112345678", "254112345678"],
    ["712345678", "254712345678"],
    ["254712345678", "254712345678"],
    ["+254712345678", "254712345678"],
    ["+254 712 345 678", "254712345678"],
    ["0712 345-678", "254712345678"],
    ["2540712345678", "254712345678"],
    ["  0712345678  ", "254712345678"],
  ])("accepts %s", (typed, expected) => {
    expect(toKenyanMobile(typed)).toBe(expected);
  });

  // shapes that reached the backend in production and that M-Pesa never accepted
  it.each(["", "2018", "8888", "79312345", "25471234567", "0812345678", "071234567", "07123456789", "abc", "+255712345678"])(
    "refuses %s",
    (typed) => {
      expect(toKenyanMobile(typed)).toBeNull();
    }
  );

  it("refuses nothing at all", () => {
    expect(toKenyanMobile(null)).toBeNull();
    expect(toKenyanMobile(undefined)).toBeNull();
  });
});
