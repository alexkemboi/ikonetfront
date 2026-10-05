import { describe, expect, it } from "vitest";
import { DEFAULT_PORTAL_BRAND, normalizeCompanyCode, sanitizeErrorMessage } from "@/lib/brand";

describe("normalizeCompanyCode", () => {
  it("accepts any well-formed company code, including companies added later", () => {
    expect(normalizeCompanyCode("cmp-bsm-001")).toBe("CMP-BSM-001");
    expect(normalizeCompanyCode(" CMP-0004-001 ")).toBe("CMP-0004-001");
    expect(normalizeCompanyCode("CMP-NEW-001")).toBe("CMP-NEW-001");
  });

  it("returns null for names, legacy aliases and missing input", () => {
    expect(normalizeCompanyCode("Beesmart")).toBeNull();
    expect(normalizeCompanyCode("COMPANY-001")).toBeNull();
    expect(normalizeCompanyCode(null)).toBeNull();
  });

  it("has a neutral default brand that names no company", () => {
    expect(DEFAULT_PORTAL_BRAND).toBe("Wi-Fi Hotspot");
  });
});

describe("sanitizeErrorMessage", () => {
  it("replaces database / payment-account errors with a maintenance message", () => {
    expect(
      sanitizeErrorMessage("No default active PAYBILL payment account found for company: COMPANY-001")
    ).toBe(
      "Payment gateway is currently undergoing scheduled maintenance. Please retry in a few moments."
    );
    expect(sanitizeErrorMessage("payment account found: CMP-BDK-001")).toBe(
      "Payment gateway is currently undergoing scheduled maintenance. Please retry in a few moments."
    );
  });

  it("replaces timeout / connection errors with a signal message", () => {
    expect(sanitizeErrorMessage("Connection timed out")).toBe(
      "Network connection timed out. Please verify your phone has signal and try again."
    );
    expect(sanitizeErrorMessage("Failed to establish connection")).toBe(
      "Network connection timed out. Please verify your phone has signal and try again."
    );
  });

  it("passes through unrelated messages unchanged", () => {
    expect(sanitizeErrorMessage("Insufficient M-Pesa balance")).toBe(
      "Insufficient M-Pesa balance"
    );
    expect(sanitizeErrorMessage("")).toBe("");
  });
});