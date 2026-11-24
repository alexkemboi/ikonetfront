/**
 * Test helper: the access the permission migrations seed for the six built-in roles, for the
 * permission keys the component tests exercise. Lets a test say "as management (02)" and get
 * exactly what the database grants 02, instead of a role name the code no longer reads.
 */
import { can, type AccessAction, type NavAccess } from "@/lib/access";

const GRANTS: Record<string, Record<string, AccessAction[]>> = {
  "01": {
    API_REMOTEACCESS: ["CREATE"],
    API_ROUTEROPERATIONS_SERVICES: ["VIEW", "EDIT"],
    API_SUBSCRIBERTIME_HOTSPOT_SESSIONS_CHANGE_HOTSPOT_DEVICE: ["CREATE"],
    API_SUBSCRIBERTIME_HOTSPOT_SESSIONS_CORRECT_HOTSPOT_DATES: ["VIEW", "CREATE"],
    API_SUBSCRIBERTIME_PPPOE_SUBSCRIPTIONS_CORRECT_PPPOE_DATES: ["VIEW", "CREATE"],
    API_SUBSCRIBERTIME_TV_CUSTOMERS_CHANGE_TV_DEVICE: ["CREATE"],
    API_SUBSCRIBERTIME_TV_CUSTOMERS_CORRECT_TV_DATES: ["VIEW", "CREATE"],
  },
  "02": {
    API_ROUTEROPERATIONS_SERVICES: ["VIEW"],
    API_SUBSCRIBERTIME_HOTSPOT_SESSIONS_CHANGE_HOTSPOT_DEVICE: ["CREATE"],
    API_SUBSCRIBERTIME_HOTSPOT_SESSIONS_CORRECT_HOTSPOT_DATES: ["VIEW"],
    API_SUBSCRIBERTIME_PPPOE_SUBSCRIPTIONS_CORRECT_PPPOE_DATES: ["VIEW"],
    API_SUBSCRIBERTIME_TV_CUSTOMERS_CHANGE_TV_DEVICE: ["CREATE"],
    API_SUBSCRIBERTIME_TV_CUSTOMERS_CORRECT_TV_DATES: ["VIEW"],
  },
  "03": {
    API_ROUTEROPERATIONS_SERVICES: ["VIEW"],
    API_SUBSCRIBERTIME_HOTSPOT_SESSIONS_CORRECT_HOTSPOT_DATES: ["VIEW"],
    API_SUBSCRIBERTIME_PPPOE_SUBSCRIPTIONS_CORRECT_PPPOE_DATES: ["VIEW"],
    API_SUBSCRIBERTIME_TV_CUSTOMERS_CORRECT_TV_DATES: ["VIEW"],
  },
  "04": { API_INVESTOR_AGREEMENTS: ["VIEW"], API_INVESTOR_BILLING_SNAPSHOTS: ["VIEW"] },
  "05": {},
};
const ALIASES: Record<string, string> = { ADMIN: "01", MANAGEMENT: "02", FINANCE_MANAGER: "03", INVESTOR: "04", NETWORK_PARTNER: "04", CUSTOMER: "05" };
const TYPES: Record<string, string> = { "04": "INVESTOR", "05": "CUSTOMER" };

export function builtInAccess(role?: string | null): NavAccess {
  const raw = (role ?? "").trim().toUpperCase().replace(/^ROLE_/, "");
  if (raw === "SYSADMIN") return { superAdmin: true, roleCode: "SYSADMIN", principalType: "STAFF", scopeLevel: "PLATFORM", permissions: {} };
  const code = ALIASES[raw] ?? raw;
  if (!(code in GRANTS)) return { superAdmin: false, permissions: {} };
  return { superAdmin: false, roleCode: code, principalType: TYPES[code] ?? "STAFF", permissions: GRANTS[code] };
}

/** What useAccess() returns for a built-in role. */
export function builtInAccessHook(role?: string | null) {
  const access = builtInAccess(role);
  return {
    access,
    can: (key: string, action: AccessAction = "VIEW") => can(access, key, action),
    holdsRight: (key: string) => can(access, key, "VIEW"),
    isSuperAdmin: access.superAdmin,
  };
}
