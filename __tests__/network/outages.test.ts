import { describe, expect, it } from "vitest";
import { formatOutageDuration, outageCauseLabel } from "@/lib/utils/outages";

describe("outage display helpers", () => {
  it("formats durations from seconds to days", () => {
    expect(formatOutageDuration(45)).toBe("45s");
    expect(formatOutageDuration(12 * 60 + 5)).toBe("12m");
    expect(formatOutageDuration(3 * 3600 + 5 * 60)).toBe("3h 05m");
    expect(formatOutageDuration(2 * 86400 + 4 * 3600)).toBe("2d 4h");
  });

  it("explains the cause in plain words", () => {
    expect(outageCauseLabel({ cause: "POWER_LOSS", status: "CLOSED" })).toBe("Power cut or router restart");
    expect(outageCauseLabel({ cause: "LINK_LOSS", status: "CLOSED" })).toContain("router stayed on");
    expect(outageCauseLabel({ cause: "UNKNOWN", status: "OPEN" })).toBe("Cause known once the router is back");
    expect(outageCauseLabel({ cause: "UNKNOWN", status: "CLOSED" })).toBe("Cause not known yet");
  });
});
