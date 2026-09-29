import { describe, expect, it } from "vitest";
import { canAccessReconciliation } from "@/lib/utils/reconciliationAccess";

describe("reconciliation access policy", () => {
  it.each(["SYSADMIN", "ADMIN", "01", "MANAGEMENT", "02"])("allows %s", (role) => {
    expect(canAccessReconciliation(role)).toBe(true);
  });

  it.each(["STAFF", "03", "INVESTOR", "04", "CUSTOMER", "05", null, undefined])("blocks %s", (role) => {
    expect(canAccessReconciliation(role)).toBe(false);
  });
});