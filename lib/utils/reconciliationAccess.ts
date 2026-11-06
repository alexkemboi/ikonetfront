import { normalizeRole, ROLE_NAME } from "@/lib/types/roles";

export function canAccessReconciliation(role: string | null | undefined): boolean {
  const normalized = normalizeRole(role);
  return normalized === ROLE_NAME.ADMIN || normalized === ROLE_NAME.MANAGEMENT;
}

/**
 * The paybill payments register on the reconciliation page: admins, management and staff
 * (customer care and finance look up a customer's payment there). What each may change is
 * still decided by the role's MENU-FINANCE-RECONCILIATION permissions on the backend.
 */
export function canAccessPaybillRegister(role: string | null | undefined): boolean {
  const normalized = normalizeRole(role);
  return canAccessReconciliation(role) || normalized === ROLE_NAME.STAFF;
}
