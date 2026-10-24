import { describe, it, expect } from "vitest";
import { smsLine } from "@/components/network/RouterOutages";

describe("outage SMS line on the router page", () => {
  it("never calls queued messages sent", () => {
    expect(smsLine("outage SMS", 12, 0, 0, 12, 0)).toBe(" · outage SMS: 0 sent, 12 not sent (SMS sending was off or failing)");
  });
  it("shows sent, waiting and refused separately", () => {
    expect(smsLine("outage SMS", 10, 7, 1, 0, 2)).toBe(" · outage SMS: 7 sent, 2 waiting, 1 refused by the provider");
  });
  it("is empty when nothing was queued", () => {
    expect(smsLine("outage SMS", null, 0, 0, 0, 0)).toBe("");
  });
  it("falls back honestly on an older server", () => {
    expect(smsLine("outage SMS", 5)).toBe(" · outage SMS queued for 5 (delivery unknown)");
  });
});
