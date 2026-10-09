import { describe, expect, it } from "vitest";
import { buildRateLimit, validatePppoePackageForm, type PppoePackageForm } from "@/lib/utils/pppoe-package";

const valid: PppoePackageForm = {
  name: "Home 10",
  downloadSpeed: "10",
  uploadSpeed: "5",
  durationDays: "30",
  price: "2500",
  dataCapGb: "",
  maxDevices: "1",
};

describe("buildRateLimit", () => {
  it("puts upload before download, as the router reads it", () => {
    expect(buildRateLimit("5", "10")).toBe("5M/10M");
  });

  it("gives nothing until both speeds are whole numbers above zero", () => {
    expect(buildRateLimit("", "10")).toBeNull();
    expect(buildRateLimit("0", "10")).toBeNull();
    expect(buildRateLimit("2.5", "10")).toBeNull();
  });
});

describe("validatePppoePackageForm", () => {
  it("accepts a complete package with no data cap", () => {
    expect(validatePppoePackageForm(valid)).toEqual({});
  });

  it("requires a price above zero", () => {
    expect(validatePppoePackageForm({ ...valid, price: "" }).price).toBeDefined();
    expect(validatePppoePackageForm({ ...valid, price: "0" }).price).toBeDefined();
  });

  it("refuses a period or speed that is not a whole number", () => {
    const errors = validatePppoePackageForm({ ...valid, durationDays: "1.5", downloadSpeed: "fast" });
    expect(errors.durationDays).toBeDefined();
    expect(errors.downloadSpeed).toBeDefined();
  });

  it("accepts a data cap only when it is above zero", () => {
    expect(validatePppoePackageForm({ ...valid, dataCapGb: "50" })).toEqual({});
    expect(validatePppoePackageForm({ ...valid, dataCapGb: "0" }).dataCapGb).toBeDefined();
  });
});
