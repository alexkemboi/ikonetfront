import { describe, expect, it } from "vitest";
import { canAccessPaybillRegister, canAccessReconciliation } from "@/lib/utils/reconciliationAccess";
import { NO_ACCESS, type NavAccess } from "@/lib/access";

/**
 * The built-in roles' access as the permission migrations seed it (the reconciliation trigger is
 * granted to 01 and 02; the paybill register to 01, 02 and 03). Same outcomes as the old
 * role-name rules, now read from the role's permissions.
 */
const builtIn: Record<string, NavAccess> = {
  SYSADMIN: { superAdmin: true, permissions: {} },
  "01": { superAdmin: false, permissions: { API_PAYMENT_RECONCILIATION_GET_RECONCILIATION: ["VIEW", "CREATE"], API_PAYBILLTRANSACTION: ["VIEW", "CREATE"] } },
  "02": { superAdmin: false, permissions: { API_PAYMENT_RECONCILIATION_GET_RECONCILIATION: ["VIEW", "CREATE"], API_PAYBILLTRANSACTION: ["VIEW", "CREATE"] } },
  "03": { superAdmin: false, permissions: { API_PAYMENT_RECONCILIATION_GET_RECONCILIATION: ["VIEW"], API_PAYBILLTRANSACTION: ["VIEW", "CREATE"] } },
  "04": { superAdmin: false, principalType: "INVESTOR", permissions: {} },
  "05": { superAdmin: false, principalType: "CUSTOMER", permissions: {} },
};

describe("reconciliation access policy", () => {
  it.each(["SYSADMIN", "01", "02"])("allows %s", (role) => {
    expect(canAccessReconciliation(builtIn[role])).toBe(true);
  });

  it.each(["03", "04", "05"])("blocks %s", (role) => {
    expect(canAccessReconciliation(builtIn[role])).toBe(false);
  });

  it("blocks a caller with no access", () => {
    expect(canAccessReconciliation(NO_ACCESS)).toBe(false);
    expect(canAccessReconciliation(undefined)).toBe(false);
  });
});

describe("paybill register access policy", () => {
  it.each(["SYSADMIN", "01", "02", "03"])("allows %s", (role) => {
    expect(canAccessPaybillRegister(builtIn[role])).toBe(true);
  });

  it.each(["04", "05"])("blocks %s", (role) => {
    expect(canAccessPaybillRegister(builtIn[role])).toBe(false);
  });

  it("a custom role granted the register sees it", () => {
    expect(canAccessPaybillRegister({ superAdmin: false, permissions: { API_PAYBILLTRANSACTION: ["VIEW"] } })).toBe(true);
  });
});
