import type { PermissionFlags } from "@/lib/types/roles";

export const NO_PERMISSIONS: PermissionFlags = {
  canView: false,
  canCreate: false,
  canEdit: false,
  canDelete: false,
};

/**
 * Map a catalogue or legacy route to the route the app actually serves.
 * Permission maps are keyed by the result, so lookups must normalize too.
 */
export function normalizeMenuRoute(route: string): string {
  const clean = route?.trim();
  if (!clean) return "/dashboard/overview";

  const routeMap: Record<string, string> = {
    "/finance/packages": "/system/packages",
    "/packages": "/system/packages",
    "/system/internet-packages": "/system/packages",
    "/dashboard/admin": "/dashboard/overview",
    "/dashboard/management": "/analytics",
    "/dashboard/staff": "/customers",
    "/dashboard/customer": "/portal/pppoe",
    "/customers/active": "/customers/all",
    "/customers/directory": "/customers/all",
    "/customers/ip-bindings": "/customers/bindings",
    "/network/ip-mapping": "/customers/bindings",
    "/customers/pppoe": "/portal/pppoe",
    "/network/microtick": "/network/mikrotik",
    "/network-routers": "/network/routers",
    "/routers": "/network/routers",
    "/finance/coa": "/finance/ledger",
    "/finance/chart-of-accounts": "/finance/ledger",
    "/finance/payments": "/finance/billing/payments",
    "/finance/invoices": "/finance/billing/invoices",
    "/investor/dashboard": "/finance/investor",
  };

  return routeMap[clean] ?? clean;
}
