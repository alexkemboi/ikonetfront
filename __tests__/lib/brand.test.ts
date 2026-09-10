import { describe, expect, it } from "vitest";
import {
  getCustomerFacingBrand,
  normalizeCompanyCode,
  resolveCompanyFromRouterTag,
  sanitizeErrorMessage,
} from "@/lib/brand";

describe("getCustomerFacingBrand", () => {
  it("maps each company code to a clean customer-facing brand", () => {
    expect(getCustomerFacingBrand("CMP-BSM-001")).toBe("Beesmart High-Speed Wi-Fi");
    expect(getCustomerFacingBrand("CMP-BDK-001")).toBe("Bedak Networks");
    expect(getCustomerFacingBrand("CMP-ADR-001")).toBe("Adrinold Broadband");
  });

  it("accepts canonical spellings (BSM, BEESMART, BDK, ADRINOLD)", () => {
    expect(getCustomerFacingBrand("BSM")).toBe("Beesmart High-Speed Wi-Fi");
    expect(getCustomerFacingBrand("BEESMART")).toBe("Beesmart High-Speed Wi-Fi");
    expect(getCustomerFacingBrand("BEDAK")).toBe("Bedak Networks");
    expect(getCustomerFacingBrand("ADRINOLD")).toBe("Adrinold Broadband");
  });

  it("falls back to a neutral brand for unknown or missing codes", () => {
    expect(getCustomerFacingBrand()).toBe("Ikonex Wi-Fi");
    expect(getCustomerFacingBrand("COMPANY-001")).toBe("Ikonex Wi-Fi");
    expect(getCustomerFacingBrand("")).toBe("Ikonex Wi-Fi");
  });
});

describe("normalizeCompanyCode", () => {
  it("returns the canonical CMP-* code for any spelling", () => {
    expect(normalizeCompanyCode("cmp-bsm-001")).toBe("CMP-BSM-001");
    expect(normalizeCompanyCode("Beesmart")).toBe("CMP-BSM-001");
    expect(normalizeCompanyCode("adrinold")).toBe("CMP-ADR-001");
    expect(normalizeCompanyCode("bedak")).toBe("CMP-BDK-001");
  });

  it("returns null for unknown input", () => {
    expect(normalizeCompanyCode("COMPANY-001")).toBeNull();
    expect(normalizeCompanyCode(null)).toBeNull();
  });
});

describe("resolveCompanyFromRouterTag", () => {
  it("parses the company head from letter-suffix asset tags", () => {
    expect(resolveCompanyFromRouterTag("RTR-BSM-A")).toBe("CMP-BSM-001");
    expect(resolveCompanyFromRouterTag("RTR-BSM-B")).toBe("CMP-BSM-001");
    expect(resolveCompanyFromRouterTag("RTR-ADR-UKD-A")).toBe("CMP-ADR-001");
    expect(resolveCompanyFromRouterTag("RTR-BDK-MSA-A")).toBe("CMP-BDK-001");
    expect(resolveCompanyFromRouterTag("RTR-BDK-LIK-A")).toBe("CMP-BDK-001");
  });

  it("returns null for non-asset-tag strings", () => {
    expect(resolveCompanyFromRouterTag("edge-router-1")).toBeNull();
    expect(resolveCompanyFromRouterTag(null)).toBeNull();
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