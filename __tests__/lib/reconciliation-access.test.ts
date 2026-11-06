import { describe, expect, it } from "vitest";
import { canAccessPaybillRegister, canAccessReconciliation } from "@/lib/utils/reconciliationAccess";

describe("reconciliation access policy", () => {
  it.each(["SYSADMIN", "ADMIN", "01", "MANAGEMENT", "02"])("allows %s", (role) => {
    expect(canAccessReconciliation(role)).toBe(true);
  });

  it.each(["STAFF", "03", "INVESTOR", "04", "CUSTOMER", "05", null, undefined])("blocks %s", (role) => {
    expect(canAccessReconciliation(role)).toBe(false);
  });
});

describe("paybill register access policy", () => {
  it.each(["SYSADMIN", "ADMIN", "01", "MANAGEMENT", "02", "STAFF", "03"])("allows %s", (role) => {
    expect(canAccessPaybillRegister(role)).toBe(true);
  });

  it.each(["INVESTOR", "04", "CUSTOMER", "05", null, undefined])("blocks %s", (role) => {
    expect(canAccessPaybillRegister(role)).toBe(false);
  });
});
